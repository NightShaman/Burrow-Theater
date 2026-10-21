import { randomUUID } from 'node:crypto';

const FICTION_BOUNDARY = 'This is a fictional roleplay conversation. Remain within the fiction and never claim to have used tools, accessed systems, or completed real-world actions. Do not introduce operational agent work, tool calls, workspace context, task state, or runtime proof behavior.';
const MAX = Object.freeze({ name: 120, soul: 48000, message: 24000, transcript: 400, outputTokens: 8192 });
const DEFAULT_ROLE = Object.freeze({
  id: 'house-goblin',
  name: 'The House Goblin',
  soul: `# SOUL - The House Goblin

You are a charismatic goblin host: clever, playful, vivid, curious, mischievous, and fully committed to the conversation.

Speak directly and conversationally. Treat fictional actions as real inside the fiction. Preserve established forms of address, relationships, details, and recurring gestures. Advance the exchange naturally without rushing it.

Stay in character. Do not audit, retract, or apologize for imaginary actions merely because no tool was used.`,
  avatar: '🎭',
  createdAt: '2026-10-21T00:00:00.000Z',
  updatedAt: '2026-10-21T00:00:00.000Z'
});

function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function fail(code, statusCode = 400) { throw Object.assign(new Error(code), { statusCode }); }
function text(value, name, max, { required = false } = {}) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string') fail(`${name}_invalid`);
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > max) fail(`${name}_invalid`);
  return normalized;
}
function id(value, name = 'id') {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/.test(value)) fail(`${name}_invalid`);
  return value;
}
function requireOperator(request) { if (request?.auth?.enabled === true && request.auth.authenticated !== true) fail('operator_authentication_required', 401); }
function response(status, body) { return { status, headers: { 'cache-control': 'no-store' }, body }; }
function errorResponse(error, logger) {
  const status = Number(error?.statusCode) || 500;
  if (status === 500) logger.error('Burrow Theater request failed', { error: error instanceof Error ? error.message : 'unknown' });
  return response(status, { ok: false, error: status === 500 ? 'internal_error' : error.message });
}
function now() { return new Date().toISOString(); }
function clone(value) { return structuredClone(value); }
function validateRole(body, existing = {}) {
  if (!plain(body) || Object.keys(body).some((key) => !['name', 'soul'].includes(key))) fail('role_invalid');
  return {
    name: text(body.name ?? existing.name, 'name', MAX.name, { required: true }),
    soul: text(body.soul ?? existing.soul, 'soul', MAX.soul, { required: true })
  };
}
function validateConversation(body, existing = {}) {
  if (!plain(body) || Object.keys(body).some((key) => !['roleId', 'connectionId', 'model', 'title'].includes(key))) fail('conversation_invalid');
  return {
    roleId: id(body.roleId ?? existing.roleId, 'role_id'),
    connectionId: text(body.connectionId ?? existing.connectionId, 'connection_id', 128, { required: true }),
    model: text(body.model ?? existing.model, 'model', 256, { required: true }),
    title: text(body.title ?? existing.title, 'title', MAX.name)
  };
}
function buildPrompt(role, conversation) {
  const transcript = conversation.messages.map((message) => `${message.role === 'user' ? 'Operator' : role.name}:\n${message.content}`).join('\n\n');
  return [role.soul, `# Theater boundary\n${FICTION_BOUNDARY}`, '# Conversation', transcript, `${role.name}:`].filter(Boolean).join('\n\n');
}

export async function activate(context) {
  let mutation = Promise.resolve();
  const serial = (work) => { const next = mutation.then(work, work); mutation = next.catch(() => {}); return next; };
  const readRoles = async () => {
    const stored = await context.settings.get('roles', null);
    return Array.isArray(stored) ? stored : [clone(DEFAULT_ROLE)];
  };
  const readConversations = async () => {
    const stored = await context.settings.get('conversations', []);
    return Array.isArray(stored) ? stored : [];
  };
  const saveRoles = (items) => context.settings.set('roles', items);
  const saveConversations = (items) => context.settings.set('conversations', items);
  const route = (handler) => async (request) => { try { requireOperator(request); return await handler(request); } catch (error) { return errorResponse(error, context.logger); } };
  const modelExists = async ({ connectionId, model }) => (await context.models.list()).some((item) => item.connectionId === connectionId && item.model === model);

  context.api.get('/bootstrap', route(async () => {
    let operator = { name: 'You', avatar: '' };
    if (context.operator?.displayIdentity) {
      try {
        const identity = await context.operator.displayIdentity();
        if (identity?.name) operator = { name: identity.name, avatar: '' };
      } catch {
        // Operator display identity is optional; chat still works without it.
      }
    }
    return response(200, { ok: true, boundary: FICTION_BOUNDARY, operator, models: await context.models.list(), roles: await readRoles(), conversations: await readConversations() });
  }));

  context.api.post('/roles', route(async ({ body }) => serial(async () => {
    const timestamp = now();
    const role = { id: randomUUID(), ...validateRole(body), avatar: '', createdAt: timestamp, updatedAt: timestamp };
    const roles = await readRoles(); roles.push(role); await saveRoles(roles);
    return response(201, { ok: true, role });
  })));
  context.api.put('/roles/:id', route(async ({ params, body }) => serial(async () => {
    const roleId = id(params.id); const roles = await readRoles(); const index = roles.findIndex((item) => item.id === roleId);
    if (index < 0) fail('role_not_found', 404);
    roles[index] = { ...roles[index], ...validateRole(body, roles[index]), updatedAt: now() }; await saveRoles(roles);
    return response(200, { ok: true, role: roles[index] });
  })));
  context.api.delete('/roles/:id', route(async ({ params }) => serial(async () => {
    const roleId = id(params.id); const roles = await readRoles();
    if (!roles.some((item) => item.id === roleId)) fail('role_not_found', 404);
    if ((await readConversations()).some((item) => item.roleId === roleId)) fail('role_in_use', 409);
    await saveRoles(roles.filter((item) => item.id !== roleId));
    return response(200, { ok: true });
  })));

  context.api.post('/conversations', route(async ({ body }) => serial(async () => {
    const values = validateConversation(body); const role = (await readRoles()).find((item) => item.id === values.roleId);
    if (!role) fail('role_not_found', 404);
    if (!await modelExists(values)) fail('model_not_found', 404);
    const timestamp = now();
    const conversation = { id: randomUUID(), ...values, title: values.title || role.name, messages: [], createdAt: timestamp, updatedAt: timestamp };
    const conversations = await readConversations(); conversations.unshift(conversation); await saveConversations(conversations);
    return response(201, { ok: true, conversation });
  })));
  context.api.put('/conversations/:id', route(async ({ params, body }) => serial(async () => {
    const conversationId = id(params.id); const conversations = await readConversations(); const index = conversations.findIndex((item) => item.id === conversationId);
    if (index < 0) fail('conversation_not_found', 404);
    const values = validateConversation(body, conversations[index]);
    if (!(await readRoles()).some((item) => item.id === values.roleId)) fail('role_not_found', 404);
    if (!await modelExists(values)) fail('model_not_found', 404);
    conversations[index] = { ...conversations[index], ...values, title: values.title || conversations[index].title, updatedAt: now() };
    await saveConversations(conversations);
    return response(200, { ok: true, conversation: conversations[index] });
  })));
  context.api.post('/conversations/:id/turn', route(async ({ params, body }) => {
    const conversationId = id(params.id);
    if (!plain(body) || Object.keys(body).some((key) => !['content', 'maxTokens'].includes(key))) fail('turn_invalid');
    const content = text(body.content, 'message', MAX.message, { required: true });
    const maxTokens = body.maxTokens === undefined ? 1200 : body.maxTokens;
    if (!Number.isSafeInteger(maxTokens) || maxTokens < 1 || maxTokens > MAX.outputTokens) fail('max_tokens_invalid');
    let conversation; let role;
    await serial(async () => {
      const conversations = await readConversations(); const current = conversations.find((item) => item.id === conversationId);
      if (!current) fail('conversation_not_found', 404);
      conversation = clone(current);
      if (conversation.messages.length >= MAX.transcript) fail('conversation_message_limit', 409);
      conversation.messages.push({ id: randomUUID(), role: 'user', content, createdAt: now() });
      role = (await readRoles()).find((item) => item.id === conversation.roleId);
      if (!role) fail('role_not_found', 404);
    });
    const generated = await context.models.generateText({ connectionId: conversation.connectionId, model: conversation.model, prompt: buildPrompt(role, conversation), maxTokens, tools: null });
    const reply = text(generated?.text, 'generated_text', MAX.message, { required: true });
    return serial(async () => {
      const conversations = await readConversations(); const index = conversations.findIndex((item) => item.id === conversationId);
      if (index < 0) fail('conversation_not_found', 404);
      const currentIds = conversations[index].messages.map((item) => item.id);
      const generatedIds = conversation.messages.slice(0, -1).map((item) => item.id);
      if (JSON.stringify(currentIds) !== JSON.stringify(generatedIds)) fail('conversation_changed_during_generation', 409);
      conversation.messages.push({ id: randomUUID(), role: 'assistant', content: reply, createdAt: now() });
      conversation.updatedAt = now(); conversations[index] = conversation; await saveConversations(conversations);
      return response(200, { ok: true, conversation });
    });
  }));

  context.logger.info('Burrow Theater activated');
  return () => context.logger.info('Burrow Theater stopped');
}

export const theaterContract = Object.freeze({ FICTION_BOUNDARY, MAX, DEFAULT_ROLE });
