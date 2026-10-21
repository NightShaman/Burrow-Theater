import test from 'node:test';
import assert from 'node:assert/strict';
import { activate, theaterContract } from '../server/index.mjs';

function fixture() {
  const routes = new Map(); const settings = new Map(); const logs = [];
  const models = [{ connectionId: 'local', model: 'stheno', provider: 'ollama' }]; const generations = [];
  const context = {
    api: Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map((method) => [method, (path, handler) => routes.set(`${method.toUpperCase()} ${path}`, handler)])),
    settings: { get: async (name, fallback = null) => settings.has(name) ? structuredClone(settings.get(name)) : fallback, set: async (name, value) => (settings.set(name, structuredClone(value)), value), delete: async (name) => settings.delete(name) },
    models: { list: async () => models, generateText: async (input) => (generations.push(input), { text: '*The curtain rises.* Welcome.' }) },
    operator: { displayIdentity: async () => ({ id: 'operator', name: 'Rob' }) },
    logger: Object.fromEntries(['debug', 'info', 'warn', 'error'].map((level) => [level, (...args) => logs.push([level, ...args])]))
  };
  return { context, routes, settings, models, generations, logs };
}
const req = (body = {}, params = {}, auth = { enabled: true, authenticated: true }) => ({ body, params, auth, query: {}, headers: {} });

async function createConversation(f, roleId = 'house-goblin') {
  return f.routes.get('POST /conversations')(req({ roleId, connectionId: 'local', model: 'stheno' }));
}

test('activation exposes only SOUL role and conversation routes with no agent tools', async () => {
  const f = fixture(); const cleanup = await activate(f.context);
  assert.deepEqual([...f.routes.keys()], ['GET /bootstrap', 'POST /roles', 'PUT /roles/:id', 'DELETE /roles/:id', 'POST /conversations', 'PUT /conversations/:id', 'POST /conversations/:id/turn']);
  cleanup(); assert.deepEqual(f.logs.map((item) => item[1]), ['Burrow Theater activated', 'Burrow Theater stopped']);
});

test('bootstrap returns configured models, operator identity, default SOUL role, and conversations', async () => {
  const f = fixture(); await activate(f.context); const result = await f.routes.get('GET /bootstrap')(req());
  assert.equal(result.status, 200); assert.deepEqual(result.body.models, f.models); assert.equal(result.body.operator.name, 'Rob');
  assert.equal(result.body.roles[0].name, 'The House Goblin'); assert.match(result.body.roles[0].soul, /# SOUL/); assert.deepEqual(result.body.conversations, []);
});

test('auth context protects Theater state when Burrow authentication is enabled', async () => {
  const f = fixture(); await activate(f.context);
  assert.equal((await f.routes.get('GET /bootstrap')(req({}, {}, { enabled: true, authenticated: false }))).status, 401);
  assert.equal((await f.routes.get('GET /bootstrap')(req({}, {}, { enabled: false, authenticated: false }))).status, 200);
});

test('roles are name plus SOUL markdown and cannot be deleted while in use', async () => {
  const f = fixture(); await activate(f.context);
  const made = await f.routes.get('POST /roles')(req({ name: 'Mara', soul: '# SOUL\nA dangerous librarian.' }));
  assert.equal(made.status, 201); assert.equal(made.body.role.name, 'Mara'); assert.match(made.body.role.soul, /dangerous librarian/);
  const updated = await f.routes.get('PUT /roles/:id')(req({ name: 'Mara', soul: '# SOUL\nA very dangerous librarian.' }, { id: made.body.role.id }));
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
