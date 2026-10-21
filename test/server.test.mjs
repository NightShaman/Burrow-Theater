import test from 'node:test';
import assert from 'node:assert/strict';
import { activate, theaterContract } from '../server/index.mjs';

function fixture() {
  const routes = new Map(); const settings = new Map(); const logs = [];
  const models = [{ connectionId: 'local', model: 'stheno', provider: 'ollama' }]; const generations = []; const forgeCreates = []; const forgeJobs = new Map();
  const context = {
    api: Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map((method) => [method, (path, handler) => routes.set(`${method.toUpperCase()} ${path}`, handler)])),
    settings: { get: async (name, fallback = null) => settings.has(name) ? structuredClone(settings.get(name)) : fallback, set: async (name, value) => (settings.set(name, structuredClone(value)), value), delete: async (name) => settings.delete(name) },
    models: { list: async () => models, generateText: async (input) => (generations.push(input), { text: '*The curtain rises.* Welcome.' }) },
    forge: { images: { status: async () => ({ available: true }), create: async (input) => { forgeCreates.push(structuredClone(input)); const job = { id: `job-${forgeCreates.length}`, kind: 'image', status: 'queued', artifacts: [], error: null, createdAt: now, updatedAt: now }; forgeJobs.set(job.id, job); return { job, replayed: false }; } }, jobs: { read: async (jobId) => { const job = forgeJobs.get(jobId); if (!job) throw Error('forge_job_not_found'); return structuredClone(job); } } },
    operator: { displayIdentity: async () => ({ id: 'operator', name: 'Rob' }) },
    logger: Object.fromEntries(['debug', 'info', 'warn', 'error'].map((level) => [level, (...args) => logs.push([level, ...args])]))
  };
  return { context, routes, settings, models, generations, forgeCreates, forgeJobs, logs };
}
const now = '2026-10-21T12:00:00.000Z';
const req = (body = {}, params = {}, auth = { enabled: true, authenticated: true }) => ({ body, params, auth, query: {}, headers: {} });

async function createConversation(f, roleId = 'house-goblin') {
  return f.routes.get('POST /conversations')(req({ roleId, connectionId: 'local', model: 'stheno' }));
}

test('activation exposes only SOUL role and conversation routes with no agent tools', async () => {
  const f = fixture(); const cleanup = await activate(f.context);
  assert.deepEqual([...f.routes.keys()], ['GET /bootstrap', 'POST /roles', 'PUT /roles/:id', 'DELETE /roles/:id', 'POST /conversations', 'PUT /conversations/:id', 'POST /conversations/:id/turn', 'POST /conversations/:id/forge/reconcile']);
  cleanup(); assert.deepEqual(f.logs.map((item) => item[1]), ['Burrow Theater activated', 'Burrow Theater stopped']);
});

test('bootstrap returns configured models, operator identity, default SOUL role, and conversations', async () => {
  const f = fixture(); await activate(f.context); const result = await f.routes.get('GET /bootstrap')(req());
  assert.equal(result.status, 200); assert.deepEqual(result.body.models, f.models); assert.equal(result.body.operator.name, 'Rob');
  assert.equal(result.body.roles[0].name, 'The House Goblin'); assert.match(result.body.roles[0].soul, /# SOUL/); assert.equal(result.body.roles[0].allowForgeImages, false); assert.deepEqual(result.body.conversations, []);
});

test('auth context protects Theater state when Burrow authentication is enabled', async () => {
  const f = fixture(); await activate(f.context);
  assert.equal((await f.routes.get('GET /bootstrap')(req({}, {}, { enabled: true, authenticated: false }))).status, 401);
  assert.equal((await f.routes.get('GET /bootstrap')(req({}, {}, { enabled: false, authenticated: false }))).status, 200);
});

test('roles are name plus SOUL markdown and cannot be deleted while in use', async () => {
  const f = fixture(); await activate(f.context);
  const made = await f.routes.get('POST /roles')(req({ name: 'Mara', soul: '# SOUL\nA dangerous librarian.', allowForgeImages: true }));
  assert.equal(made.status, 201); assert.equal(made.body.role.name, 'Mara'); assert.equal(made.body.role.allowForgeImages, true); assert.match(made.body.role.soul, /dangerous librarian/);
  const updated = await f.routes.get('PUT /roles/:id')(req({ name: 'Mara', soul: '# SOUL\nA very dangerous librarian.', allowForgeImages: false }, { id: made.body.role.id }));
  assert.match(updated.body.role.soul, /very dangerous/);
  await createConversation(f, made.body.role.id);
  assert.equal((await f.routes.get('DELETE /roles/:id')(req({}, { id: made.body.role.id }))).status, 409);
});

test('deleting the final persisted role preserves an empty role inventory', async () => {
  const f = fixture(); await activate(f.context);
  const made = await f.routes.get('POST /roles')(req({ name: 'Only Role', soul: '# SOUL\nThe last role.' }));
  f.settings.set('roles', [made.body.role]);
  assert.equal((await f.routes.get('DELETE /roles/:id')(req({}, { id: made.body.role.id }))).status, 200);
  const bootstrap = await f.routes.get('GET /bootstrap')(req());
  assert.deepEqual(bootstrap.body.roles, []);
});

test('conversation turn uses Core text generation with tools null and only SOUL plus transcript context', async () => {
  const f = fixture(); await activate(f.context); const created = await createConversation(f); const conversationId = created.body.conversation.id;
  const turn = await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Check the imaginary tank.' }, { id: conversationId }));
  assert.equal(turn.status, 200); assert.deepEqual(turn.body.conversation.messages.map((item) => item.role), ['user', 'assistant']);
  assert.equal(f.generations[0].connectionId, 'local'); assert.equal(f.generations[0].model, 'stheno'); assert.equal(f.generations[0].tools, null);
  assert.match(f.generations[0].prompt, /# SOUL/); assert.match(f.generations[0].prompt, /Check the imaginary tank/); assert.match(f.generations[0].prompt, /never claim to have used tools/i);
  assert.doesNotMatch(f.generations[0].prompt, /scenario|pinned continuity|tool result/i);
  assert.deepEqual([...f.settings.keys()], ['conversations']);
});

test('conversation role and model can be changed while preserving transcript', async () => {
  const f = fixture(); await activate(f.context); const created = await createConversation(f); const conversationId = created.body.conversation.id;
  await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Hello' }, { id: conversationId }));
  const made = await f.routes.get('POST /roles')(req({ name: 'Mara', soul: '# SOUL\nA librarian.' }));
  const updated = await f.routes.get('PUT /conversations/:id')(req({ roleId: made.body.role.id }, { id: conversationId }));
  assert.equal(updated.status, 200); assert.equal(updated.body.conversation.roleId, made.body.role.id); assert.equal(updated.body.conversation.messages.length, 2);
  assert.equal((await f.routes.get('PUT /conversations/:id')(req({ connectionId: 'missing', model: 'nope' }, { id: conversationId }))).status, 404);
});

test('the explicit fiction boundary excludes operational agent behavior', () => {
  assert.match(theaterContract.FICTION_BOUNDARY, /fictional roleplay conversation/); assert.match(theaterContract.FICTION_BOUNDARY, /never claim to have used tools/);
  assert.match(theaterContract.DEFAULT_ROLE.soul, /# SOUL/); assert.match(theaterContract.DEFAULT_ROLE.soul, /Stay in character/);
});

async function groupFixture() {
  const f = fixture(); await activate(f.context);
  const made = await f.routes.get('POST /roles')(req({ name: 'Mara', soul: '# SOUL\nA librarian.' }));
  f.roleIds = ['house-goblin', made.body.role.id];
  return f;
}
const groupCreate = (f, extra = {}) => f.routes.get('POST /conversations')(req({ roleIds: f.roleIds, connectionId: 'local', model: 'stheno', ...extra }));

test('legacy conversations normalize participant arrays and historical attribution without losing messages', async () => {
  const f = fixture(); await activate(f.context);
  f.settings.set('conversations', [{ id: 'legacy', roleId: 'house-goblin', connectionId: 'local', model: 'stheno', messages: [{ id: 'old', role: 'assistant', content: 'Hello' }] }]);
  const bootstrap = await f.routes.get('GET /bootstrap')(req());
  const conversation = bootstrap.body.conversations[0];
  assert.deepEqual(conversation.roleIds, ['house-goblin']); assert.equal(conversation.messages[0].roleId, 'house-goblin');
  const updated = await f.routes.get('PUT /conversations/:id')(req({ title: 'Migrated' }, { id: 'legacy' }));
  assert.equal(updated.status, 200); assert.deepEqual(f.settings.get('conversations')[0].roleIds, ['house-goblin']);
});

test('group turn generates ordered attributed replies with coherent cast and transcript', async () => {
  const f = await groupFixture(); const created = await groupCreate(f); const conversation = created.body.conversation;
  assert.equal(created.status, 201); assert.equal(conversation.roleId, f.roleIds[0]); assert.equal(conversation.title, 'The House Goblin, Mara');
  assert.equal((await f.routes.get('DELETE /roles/:id')(req({}, { id: f.roleIds[1] }))).status, 409);
  const turn = await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Hello everyone' }, { id: conversation.id }));
  assert.equal(turn.status, 200); assert.deepEqual(turn.body.conversation.messages.map(m => m.role), ['user', 'assistant', 'assistant']);
  assert.deepEqual(turn.body.conversation.messages.slice(1).map(m => m.roleId), f.roleIds);
  assert.match(f.generations[1].prompt, /The House Goblin:\n\*The curtain rises/);
  assert.match(f.generations[1].prompt, /Reply only as Mara/);
  assert.equal(Object.hasOwn(f.generations[0], 'effort'), false); assert.equal(Object.hasOwn(f.generations[0], 'temperature'), false);
});

test('participant input validates empty, duplicate, malformed, missing and conflicting roles', async () => {
  const f = await groupFixture();
  for (const roleIds of [[], ['house-goblin', 'house-goblin'], ['bad id'], 'house-goblin']) assert.equal((await groupCreate(f, { roleIds })).status, 400);
  assert.equal((await groupCreate(f, { roleIds: ['missing'] })).status, 404);
  assert.equal((await groupCreate(f, { roleId: f.roleIds[1] })).status, 400);
  const created = await groupCreate(f);
  const updated = await f.routes.get('PUT /conversations/:id')(req({ roleIds: [...f.roleIds].reverse() }, { id: created.body.conversation.id }));
  assert.equal(updated.body.conversation.roleId, f.roleIds[1]);
});

test('model controls persist, validate capabilities and forward selected values only', async () => {
  const f = await groupFixture(); Object.assign(f.models[0], { reasoningEfforts: ['low', 'high'], supportsTemperature: true });
  for (const extra of [{ effort: 'bogus' }, { effort: 'medium' }, { temperature: -1 }, { temperature: 3 }, { temperature: '0.5' }]) assert.equal((await groupCreate(f, extra)).status, 400);
  const created = await groupCreate(f, { effort: 'high', temperature: 0 }); const conversationId = created.body.conversation.id;
  assert.equal(created.status, 201); assert.equal(f.settings.get('conversations')[0].temperature, 0);
  const turn = await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Hello' }, { id: conversationId }));
  assert.equal(turn.status, 200);
  for (const generation of f.generations) { assert.equal(generation.effort, 'high'); assert.equal(generation.temperature, 0); }
  f.models.push({ connectionId: 'local', model: 'plain', reasoningEfforts: [], supportsTemperature: false });
  const updated = await f.routes.get('PUT /conversations/:id')(req({ model: 'plain' }, { id: conversationId }));
  assert.equal(updated.status, 200); assert.equal(updated.body.conversation.effort, null); assert.equal(updated.body.conversation.temperature, null);
  assert.equal((await f.routes.get('PUT /conversations/:id')(req({ temperature: 1 }, { id: conversationId }))).status, 400);
});

test('group generation failure is atomic and reserves room for the entire turn', async () => {
  const f = await groupFixture(); const created = await groupCreate(f); const conversationId = created.body.conversation.id;
  let calls = 0; f.context.models.generateText = async () => { if (++calls === 2) throw Error('provider failed'); return { text: 'First reply' }; };
  assert.equal((await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Hello' }, { id: conversationId }))).status, 500);
  assert.deepEqual(f.settings.get('conversations')[0].messages, []);
  const stored = f.settings.get('conversations'); stored[0].messages = Array.from({ length: theaterContract.MAX.transcript - 2 }, (_, i) => ({ id: `m${i}`, role: 'user', content: 'Hi' }));
  f.settings.set('conversations', stored);
  assert.equal((await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Hello' }, { id: conversationId }))).body.error, 'conversation_message_limit');
  assert.equal(calls, 2);
});

test('generation detects concurrent configuration and role changes rather than overwriting them', async () => {
  for (const changeRole of [false, true]) {
    const f = await groupFixture(); const created = await groupCreate(f); const conversationId = created.body.conversation.id;
    let release; let started;
    const gate = new Promise(resolve => { release = resolve; }); const entered = new Promise(resolve => { started = resolve; });
    f.context.models.generateText = async () => { started(); await gate; return { text: 'Hello' }; };
    const pending = f.routes.get('POST /conversations/:id/turn')(req({ content: 'Hello' }, { id: conversationId })); await entered;
    const updated = changeRole
      ? await f.routes.get('PUT /roles/:id')(req({ name: 'New name' }, { id: f.roleIds[1] }))
      : await f.routes.get('PUT /conversations/:id')(req({ title: 'New title' }, { id: conversationId }));
    assert.equal(updated.status, 200); release();
    assert.equal((await pending).body.error, 'conversation_changed_during_generation');
    assert.deepEqual(f.settings.get('conversations')[0].messages, []);
  }
});

test('overlapping turns cannot overwrite a completed turn', async () => {
  const f = fixture(); await activate(f.context); const created = await createConversation(f); const conversationId = created.body.conversation.id;
  let release; let entered; const gate = new Promise(resolve => { release = resolve; }); const started = new Promise(resolve => { entered = resolve; });
  let calls = 0; f.context.models.generateText = async () => { if (++calls === 1) { entered(); await gate; } return { text: 'Reply' }; };
  const first = f.routes.get('POST /conversations/:id/turn')(req({ content: 'First' }, { id: conversationId })); await started;
  assert.equal((await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Second' }, { id: conversationId }))).status, 200);
  release(); assert.equal((await first).status, 409);
  assert.equal(f.settings.get('conversations')[0].messages[0].content, 'Second');
});


test('Forge permission defaults off, persists per role, and legacy conversation permission is ignored', async () => {
  const f = fixture(); await activate(f.context); const created = await createConversation(f); const conversationId = created.body.conversation.id;
  assert.equal(Object.hasOwn(created.body.conversation, 'allowForgeImages'), false);
  assert.equal((await f.routes.get('PUT /conversations/:id')(req({ allowForgeImages: true }, { id: conversationId }))).status, 400);
  assert.equal((await f.routes.get('PUT /roles/:id')(req({ allowForgeImages: 'yes' }, { id: 'house-goblin' }))).status, 400);
  const updated = await f.routes.get('PUT /roles/:id')(req({ allowForgeImages: true }, { id: 'house-goblin' }));
  assert.equal(updated.body.role.allowForgeImages, true); assert.equal(f.settings.get('roles')[0].allowForgeImages, true);
  const stored = f.settings.get('conversations'); stored[0].allowForgeImages = true; f.settings.set('conversations', stored);
  await f.routes.get('PUT /roles/:id')(req({ allowForgeImages: false }, { id: 'house-goblin' }));
  const bootstrap = await f.routes.get('GET /bootstrap')(req());
  assert.equal(Object.hasOwn(bootstrap.body.conversations[0], 'allowForgeImages'), false);
});

async function enableRoleImages(f, roleId = 'house-goblin') {
  const result = await f.routes.get('PUT /roles/:id')(req({ allowForgeImages: true }, { id: roleId }));
  assert.equal(result.status, 200);
}

test('enabled role turns durably return pending images before idempotent Forge enqueue and hide directives from prose', async () => {
  const f = fixture(); await activate(f.context); await enableRoleImages(f); const created = await createConversation(f); const conversationId = created.body.conversation.id;
  f.context.models.generateText = async input => (f.generations.push(input), { text: 'Behold the stage.\n<!-- BURROW_FORGE_IMAGE {"prompt":"A moonlit goblin theater, wide shot"} -->' });
  f.context.forge.images.create = async () => new Promise(() => {});
  const turn = await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Show me.' }, { id: conversationId }));
  assert.equal(turn.status, 200); assert.match(f.generations[0].prompt, /BURROW_FORGE_IMAGE/); assert.equal(f.generations[0].tools, null);
  assert.equal(turn.body.conversation.messages[1].content, 'Behold the stage.'); assert.doesNotMatch(turn.body.conversation.messages[1].content, /FORGE_IMAGE/);
  const image = turn.body.conversation.messages[2]; assert.equal(image.type, 'forge_image'); assert.equal(image.roleId, 'house-goblin'); assert.equal(image.status, 'pending'); assert.equal(image.jobId, null);
  assert.equal(f.forgeCreates.length, 0); assert.equal(f.settings.get('conversations')[0].messages[2].status, 'pending');
  f.context.forge.images.create = async input => { f.forgeCreates.push(structuredClone(input)); const job = { id: 'job-1', status: 'succeeded', artifacts: [{ id: 'a1', previewUrl: '/api/forge/jobs/job-1/artifacts/a1' }] }; f.forgeJobs.set(job.id, job); return { job, replayed: false }; };
  const reconciled = await f.routes.get('POST /conversations/:id/forge/reconcile')(req({}, { id: conversationId }));
  const completed = reconciled.body.conversation.messages[2]; assert.equal(completed.status, 'completed'); assert.equal(completed.previewUrl, '/api/forge/jobs/job-1/artifacts/a1');
  assert.deepEqual(f.forgeCreates, [{ prompt: 'A moonlit goblin theater, wide shot', idempotencyKey: `message-${image.id}` }]);
});

test('disabled roles leave image directives as prose and do not create jobs', async () => {
  const f = fixture(); await activate(f.context); const created = await createConversation(f); const id = created.body.conversation.id;
  f.context.models.generateText = async input => (f.generations.push(input), { text: 'Nope\n<!-- BURROW_FORGE_IMAGE {"prompt":"x"} -->' });
  const turn = await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Hello' }, { id }));
  assert.equal(turn.body.conversation.messages.length, 2); assert.match(turn.body.conversation.messages[1].content, /FORGE_IMAGE/); assert.doesNotMatch(f.generations[0].prompt, /# Optional image direction/); assert.equal(f.forgeCreates.length, 0);
});

test('mixed groups honor each role permission independently and reserve only enabled image capacity', async () => {
  const f = await groupFixture(); await enableRoleImages(f, f.roleIds[0]); const created = await groupCreate(f); let call = 0;
  f.context.models.generateText = async input => { f.generations.push(input); return call++ === 0 ? { text: 'First.\n<!-- BURROW_FORGE_IMAGE {"prompt":"First role scene"} -->' } : { text: 'Second.\n<!-- BURROW_FORGE_IMAGE {"prompt":"Denied second scene"} -->' }; };
  const turn = await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Perform' }, { id: created.body.conversation.id }));
  assert.equal(turn.status, 200); const images = turn.body.conversation.messages.filter(message => message.type === 'forge_image'); assert.equal(images.length, 1); assert.equal(images[0].roleId, f.roleIds[0]);
  assert.match(f.generations[0].prompt, /BURROW_FORGE_IMAGE/); assert.doesNotMatch(f.generations[1].prompt, /# Optional image direction/); assert.match(turn.body.conversation.messages.at(-1).content, /Denied second scene/);
  assert.doesNotMatch(f.generations[1].prompt, /First role scene/); assert.match(f.generations[1].prompt, /First\./);
  const stored = f.settings.get('conversations'); stored[0].messages = Array.from({ length: theaterContract.MAX.transcript - 4 }, (_, i) => ({ id: `m${i}`, role: 'user', content: 'Hi' })); f.settings.set('conversations', stored);
  assert.equal((await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Fits exactly' }, { id: created.body.conversation.id }))).status, 200);
});

test('failed Forge creation and reload reconciliation persist attributed terminal state', async () => {
  const f = fixture(); await activate(f.context); await enableRoleImages(f); const created = await createConversation(f); const id = created.body.conversation.id;
  f.context.models.generateText = async () => ({ text: 'Scene.\n<!-- BURROW_FORGE_IMAGE {"prompt":"A scene"} -->' });
  const turn = await f.routes.get('POST /conversations/:id/turn')(req({ content: 'Hello' }, { id })); const image = turn.body.conversation.messages[2];
  assert.equal(image.status, 'pending'); assert.equal(image.jobId, null); assert.equal(image.roleId, 'house-goblin');
  f.context.forge.images.create = async input => { f.forgeCreates.push(input); const job = { id: 'job-recovered', status: 'failed', artifacts: [], error: 'provider_failed' }; f.forgeJobs.set(job.id, job); return { job, replayed: false }; };
  const retried = await f.routes.get('POST /conversations/:id/forge/reconcile')(req({}, { id })); assert.equal(retried.body.conversation.messages[2].status, 'failed'); assert.equal(retried.body.conversation.messages[2].jobId, 'job-recovered');
});

test('a stale enqueue failure cannot erase a job receipt persisted by another reconcile', async () => {
  const f = fixture(); await activate(f.context); const created = await createConversation(f); const id = created.body.conversation.id;
  const stored = f.settings.get('conversations');
  stored[0].messages.push({ id: 'image-1', type: 'forge_image', role: 'assistant', roleId: 'house-goblin', roleName: 'House Goblin', content: '', prompt: 'Stage', status: 'pending', jobId: null, previewUrl: null, error: null, createdAt: now, updatedAt: now });
  f.settings.set('conversations', stored);
  let calls = 0; let releaseStale; let releaseReceipt;
  const stale = new Promise(resolve => { releaseStale = resolve; });
  const receipt = new Promise(resolve => { releaseReceipt = resolve; });
  f.context.forge.images.create = async () => ++calls === 1 ? stale : receipt;
  const first = f.routes.get('POST /conversations/:id/forge/reconcile')(req({}, { id }));
  const second = f.routes.get('POST /conversations/:id/forge/reconcile')(req({}, { id }));
  await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 2);
  releaseReceipt({ job: { id: 'job-1', status: 'queued', artifacts: [] }, replayed: false });
  assert.equal((await second).body.conversation.messages[0].jobId, 'job-1');
  releaseStale({ job: null, replayed: false });
  assert.equal((await first).body.conversation.messages[0].jobId, 'job-1');
  assert.equal(f.settings.get('conversations')[0].messages[0].jobId, 'job-1');
});

test('overlapping Forge reconciles cannot regress a terminal image when completion order reverses', async () => {
  const f = fixture(); await activate(f.context); const created = await createConversation(f); const id = created.body.conversation.id;
  const stored = f.settings.get('conversations');
  stored[0].messages.push({ id: 'image-1', type: 'forge_image', role: 'assistant', roleId: 'house-goblin', roleName: 'House Goblin', content: '', prompt: 'Stage', status: 'pending', jobId: 'job-1', previewUrl: null, error: null, createdAt: now, updatedAt: now });
  f.settings.set('conversations', stored);
  let calls = 0; let releaseStale; let releaseTerminal;
  const stale = new Promise(resolve => { releaseStale = resolve; });
  const terminal = new Promise(resolve => { releaseTerminal = resolve; });
  f.context.forge.jobs.read = async () => ++calls === 1 ? stale : terminal;
  const first = f.routes.get('POST /conversations/:id/forge/reconcile')(req({}, { id }));
  const second = f.routes.get('POST /conversations/:id/forge/reconcile')(req({}, { id }));
  await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 2);
  releaseTerminal({ id: 'job-1', status: 'succeeded', artifacts: [{ id: 'a1', previewUrl: '/preview.png' }] });
  assert.equal((await second).body.conversation.messages[0].status, 'completed');
  releaseStale({ id: 'job-1', status: 'running', artifacts: [] });
  const afterStale = await first;
  assert.equal(afterStale.body.conversation.messages[0].status, 'completed');
  assert.equal(f.settings.get('conversations')[0].messages[0].status, 'completed');
  assert.equal(f.settings.get('conversations')[0].messages[0].previewUrl, '/preview.png');
});
