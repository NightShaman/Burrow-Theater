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
function normalizeConversation(conversation) {
  const roleIds = Array.isArray(conversation.roleIds) && conversation.roleIds.length ? conversation.roleIds : [conversation.roleId];
  return { ...conversation, roleIds, roleId: roleIds[0], messages: (conversation.messages || []).map((message) =>
    message.role === 'assistant' && !message.roleId ? { ...message, roleId: conversation.roleId || roleIds[0] } : message) };
}
function validateConversation(body, existing = {}) {
  if (!plain(body) || Object.keys(body).some((key) => !['roleId', 'roleIds', 'connectionId', 'model', 'title', 'effort', 'temperature'].includes(key))) fail('conversation_invalid');
  const participants = body.roleIds !== undefined ? body.roleIds : body.roleId !== undefined ? [body.roleId] : existing.roleIds || [existing.roleId];
  if (!Array.isArray(participants) || !participants.length || participants.length >= MAX.transcript) fail('role_ids_invalid');
  const roleIds = participants.map((value) => id(value, 'role_id'));
  if (new Set(roleIds).size !== roleIds.length) fail('role_ids_invalid');
  if (body.roleIds !== undefined && body.roleId !== undefined && body.roleId !== roleIds[0]) fail('role_ids_invalid');
  const effort = body.effort === undefined ? existing.effort : body.effort;
  if (effort != null && (typeof effort !== 'string' || !['off', 'minimal', 'low', 'medium', 'high', 'ultra', 'xhigh', 'max'].includes(effort))) fail('model_reasoning_effort_invalid');
  const temperature = body.temperature === undefined ? existing.temperature : body.temperature;
  if (temperature != null && (typeof temperature !== 'number' || !Number.isFinite(temperature) || temperature < 0 || temperature > 2)) fail('model_temperature_invalid');
  return {
    roleIds, roleId: roleIds[0],
    connectionId: text(body.connectionId ?? existing.connectionId, 'connection_id', 128, { required: true }),
    model: text(body.model ?? existing.model, 'model', 256, { required: true }),
    title: text(body.title ?? existing.title, 'title', MAX.name),
    effort: effort ?? null, temperature: temperature ?? null
  };
}
function generationControls(conversation, model) {
  const controls = {};
  if (conversation.effort != null) {
    if (conversation.effort !== 'off' && (!Array.isArray(model.reasoningEfforts) || !model.reasoningEfforts.includes(conversation.effort))) fail('model_reasoning_effort_not_supported');
    controls.effort = conversation.effort;
  }
  if (conversation.temperature != null) {
    if (model.supportsTemperature !== true) fail('model_temperature_not_supported');
    controls.temperature = conversation.temperature;
  }
  return controls;
}
function buildPrompt(role, conversation, roles) {
  const transcript = conversation.messages.map((message) => `${message.role === 'user' ? 'Operator' : message.roleName || roles.find((item) => item.id === message.roleId)?.name || message.roleId || 'Role'}:\n${message.content}`).join('\n\n');
  const cast = conversation.roleIds.map((roleId) => roles.find((item) => item.id === roleId)?.name || roleId).join(', ');
  return [role.soul, `# Theater boundary\n${FICTION_BOUNDARY}`, `# Participants\n${cast}\nReply only as ${role.name}.`, '# Conversation', transcript, `${role.name}:`].filter(Boolean).join('\n\n');
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
    return Array.isArray(stored) ? stored.map(normalizeConversation) : [];
  };
  const saveRoles = (items) => context.settings.set('roles', items);
  const saveConversations = (items) => context.settings.set('conversations', items);
  const route = (handler) => async (request) => { try { requireOperator(request); return await handler(request); } catch (error) { return errorResponse(error, context.logger); } };
  const validateSelection = async (values, body = {}, existing = {}) => {
    const roles = await readRoles();
    if (values.roleIds.some((roleId) => !roles.some((item) => item.id === roleId))) fail('role_not_found', 404);
    const model = (await context.models.list()).find((item) => item.connectionId === values.connectionId && item.model === values.model);
    if (!model) fail('model_not_found', 404);
    // Switching models clears incompatible inherited controls, but explicit selections are errors.
    if (existing.model !== values.model || existing.connectionId !== values.connectionId) {
      if (body.effort === undefined && !model.reasoningEfforts?.includes(values.effort)) values.effort = null;
      if (body.temperature === undefined && model.supportsTemperature !== true) values.temperature = null;
    }
    generationControls(values, model);
    return roles;
  };

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
    if ((await readConversations()).some((item) => item.roleIds.includes(roleId))) fail('role_in_use', 409);
    await saveRoles(roles.filter((item) => item.id !== roleId));
    return response(200, { ok: true });
  })));

  context.api.post('/conversations', route(async ({ body }) => serial(async () => {
    const values = validateConversation(body); const roles = await validateSelection(values, body);
    const role = roles.find((item) => item.id === values.roleId);
    const timestamp = now();
    const defaultTitle = values.roleIds.map((roleId) => roles.find((item) => item.id === roleId)?.name).filter(Boolean).join(', ');
    const conversation = { id: randomUUID(), ...values, title: values.title || defaultTitle || role.name, messages: [], createdAt: timestamp, updatedAt: timestamp };
    const conversations = await readConversations(); conversations.unshift(conversation); await saveConversations(conversations);
    return response(201, { ok: true, conversation });
  })));
  context.api.put('/conversations/:id', route(async ({ params, body }) => serial(async () => {
    const conversationId = id(params.id); const conversations = await readConversations(); const index = conversations.findIndex((item) => item.id === conversationId);
    if (index < 0) fail('conversation_not_found', 404);
    const values = validateConversation(body, conversations[index]);
    await validateSelection(values, body, conversations[index]);
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
    let conversation; let roles; let snapshot; let controls;
    await serial(async () => {
      const conversations = await readConversations(); const current = conversations.find((item) => item.id === conversationId);
      if (!current) fail('conversation_not_found', 404);
      snapshot = JSON.stringify(current);
      conversation = clone(current);
      if (conversation.messages.length + 1 + conversation.roleIds.length > MAX.transcript) fail('conversation_message_limit', 409);
      roles = await readRoles();
      if (conversation.roleIds.some((roleId) => !roles.some((item) => item.id === roleId))) fail('role_not_found', 404);
      const model = (await context.models.list()).find((item) => item.connectionId === conversation.connectionId && item.model === conversation.model);
      if (!model) fail('model_not_found', 404);
      controls = generationControls(conversation, model);
      conversation.messages.push({ id: randomUUID(), role: 'user', content, createdAt: now() });
    });
    // Sequential generation lets each participant hear the preceding replies. Commit the whole turn atomically.
    for (const roleId of conversation.roleIds) {
      const role = roles.find((item) => item.id === roleId);
      const generated = await context.models.generateText({ connectionId: conversation.connectionId, model: conversation.model, prompt: buildPrompt(role, conversation, roles), maxTokens, tools: null, ...controls });
      const reply = text(generated?.text, 'generated_text', MAX.message, { required: true });
      conversation.messages.push({ id: randomUUID(), role: 'assistant', roleId, roleName: role.name, content: reply, createdAt: now() });
    }
    return serial(async () => {
      const conversations = await readConversations(); const index = conversations.findIndex((item) => item.id === conversationId);
      if (index < 0) fail('conversation_not_found', 404);
      const currentRoles = await readRoles();
      if (JSON.stringify(conversations[index]) !== snapshot || conversation.roleIds.some((roleId) =>
        JSON.stringify(currentRoles.find((item) => item.id === roleId)) !== JSON.stringify(roles.find((item) => item.id === roleId)))) fail('conversation_changed_during_generation', 409);
      conversation.updatedAt = now(); conversations[index] = conversation; await saveConversations(conversations);
      return response(200, { ok: true, conversation });
    });
  }));

  context.logger.info('Burrow Theater activated');
  return () => context.logger.info('Burrow Theater stopped');
}

export const theaterContract = Object.freeze({ FICTION_BOUNDARY, MAX, DEFAULT_ROLE });
