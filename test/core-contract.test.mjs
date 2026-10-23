import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = path.resolve(process.env.BURROW_CORE_ROOT || path.join(root, '..', 'Burrow-Backend'));
async function memoryStore() {
  const settings = new Map(), secrets = new Map();
  return { get: async (name, fallback = null) => settings.has(name) ? settings.get(name) : fallback,
    set: async (name, value) => (settings.set(name, value), value), delete: async name => settings.delete(name),
    getSecret: async name => secrets.get(name) ?? null, setSecret: async (name, value) => (value ? secrets.set(name, String(value)) : secrets.delete(name), true),
    clearSecret: async name => secrets.delete(name), hasSecret: async name => secrets.has(name), close: async () => {} };
}

test('current Burrow Core discovers and hosts Burrow Theater with durable model jobs', async t => {
  const [{ discoverMods }, { startModHost }] = await Promise.all([
    import(pathToFileURL(path.join(coreRoot, 'src/mod-runtime.mjs'))),
    import(pathToFileURL(path.join(coreRoot, 'src/mod-host.mjs'))),
  ]);
  const runtimeRoot = await fs.mkdtemp('/tmp/burrow-theater-contract-');
  const modsRoot = path.join(runtimeRoot, 'mods');
  await fs.mkdir(modsRoot, { recursive: true });
  await fs.cp(root, path.join(modsRoot, 'burrow-theater'), { recursive: true, filter: source => path.basename(source) !== '.git' });
  t.after(() => fs.rm(runtimeRoot, { recursive: true, force: true }));
  const [mod] = await discoverMods({ runtimeRoot, logger: { warn() {} } });
  assert.equal(mod.id, 'burrow-theater'); assert.equal(mod.name, 'Theater'); assert.notEqual(mod.status, 'failed', mod.error);
  assert.deepEqual(Object.keys(mod.ui), ['control', 'settings']);
  assert.deepEqual(mod.contributions.settings.map(item => item.id), ['profile', 'roles']);
  assert.equal(mod.contributions.settings[0].primary.capability, 'settingsUi');
  assert.equal(mod.contributions.settings[1].primary.capability, 'settingsUi');

  const generations = [], jobs = new Map(), forgeCalls = [];
  const host = startModHost({ mod, store: await memoryStore(), logger: { debug() {}, info() {}, warn() {}, error() {} }, capabilities: {
    listModels: async () => [{ connectionId: 'local', model: 'stheno', provider: 'ollama', reasoningEfforts: ['low', 'high'], supportsTemperature: true }],
    submitGeneration: async input => {
      generations.push(input);
      const existing = [...jobs.values()].find(job => job.idempotencyKey === input.idempotencyKey);
      if (existing) return { job: existing, replayed: true };
      const job = { id: `generation-${jobs.size + 1}`, idempotencyKey: input.idempotencyKey, status: 'succeeded', text: 'Welcome to the scene.\n<!-- BURROW_FORGE_IMAGE {"prompt":"A goblin stage"} -->', error: null };
      jobs.set(job.id, job); return { job, replayed: false };
    },
    readGeneration: async ({ jobId }) => jobs.get(jobId),
    getForgeImageStatus: async () => ({ available: true }),
    createForgeImage: async input => (forgeCalls.push(['create', input]), { job: { id: 'job-1', kind: 'image', status: 'queued', artifacts: [], error: null, createdAt: '2026-10-21T00:00:00Z', updatedAt: '2026-10-21T00:00:00Z' }, replayed: false }),
    readForgeImageJob: async input => (forgeCalls.push(['read', input]), { id: input.jobId, kind: 'image', status: 'succeeded', artifacts: [{ id: 'artifact-1', previewUrl: '/api/forge/jobs/job-1/artifacts/artifact-1' }], error: null, createdAt: '2026-10-21T00:00:00Z', updatedAt: '2026-10-21T00:01:00Z' }),
  } });
  t.after(() => host.close());
  const activation = await host.activated;
  assert.equal(activation.tools.length, 0);
  assert.equal(activation.map(entry => `${entry.method} ${entry.path}`)[0], 'GET /bootstrap');
  const invoke = async (method, routePath, body, params = {}) => {
    const entry = activation.find(item => item.method === method && item.path === routePath);
    assert.ok(entry, `${method} ${routePath}`);
    return host.invoke(entry.routeId, { auth: { enabled: false, authenticated: false }, body, query: {}, params, headers: {}, method, path: routePath });
  };
  const bootstrap = await invoke('GET', '/bootstrap', null);
  assert.equal(bootstrap.body.ok, true); assert.equal(bootstrap.body.models[0].model, 'stheno');
  const role = await invoke('POST', '/roles', { name: 'Mara', soul: '# SOUL\nA librarian.', allowForgeImages: true });
  const house = bootstrap.body.roles[0];
  await invoke('PUT', '/roles/:id', { allowForgeImages: true }, { id: house.id });
  const created = await invoke('POST', '/conversations', { roleIds: ['house-goblin', role.body.role.id], connectionId: 'local', model: 'stheno', effort: 'high', temperature: 0.7 });
  const id = created.body.conversation.id;
  const accepted = await invoke('POST', '/conversations/:id/turn', { content: 'Welcome everyone' }, { id });
  assert.equal(accepted.status, 202); assert.equal(accepted.body.conversation.messages.at(-1).type, 'text_generation');
  let turn = accepted;
  for (let index = 0; index < 4 && turn.body.conversation.messages.some(message => message.type === 'text_generation' && message.status === 'pending'); index += 1) {
    turn = await invoke('POST', '/conversations/:id/generation/reconcile', {}, { id });
  }
  assert.deepEqual(turn.body.conversation.messages.map(message => message.role), ['user', 'assistant', 'assistant', 'assistant', 'assistant']);
  assert.equal(generations.length, 2);
  for (const input of generations) { assert.equal(input.effort, 'high'); assert.equal(input.temperature, 0.7); }
  assert.match(generations[1].prompt, /The House Goblin:\nWelcome to the scene/);
  const images = turn.body.conversation.messages.filter(message => message.type === 'forge_image');
  assert.equal(images.length, 2); assert.equal(images[0].jobId, null); assert.equal(forgeCalls.length, 0);
  const enqueued = await invoke('POST', '/conversations/:id/forge/reconcile', {}, { id });
  const queued = enqueued.body.conversation.messages.find(message => message.id === images[0].id);
  assert.equal(queued.jobId, 'job-1'); assert.equal(queued.status, 'pending');
  const reconciled = await invoke('POST', '/conversations/:id/forge/reconcile', {}, { id });
  const completed = reconciled.body.conversation.messages.find(message => message.id === images[0].id);
  assert.equal(completed.status, 'completed'); assert.equal(completed.previewUrl, '/api/forge/jobs/job-1/artifacts/artifact-1');
});
