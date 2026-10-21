import { randomUUID } from 'node:crypto';

const FICTION_BOUNDARY = 'This is a fictional roleplay conversation. Remain within the fiction and never claim to have used tools, accessed systems, or completed real-world actions. Do not introduce operational agent work, tool calls, workspace context, task state, or runtime proof behavior.';
const IMAGE_DIRECTIVE = Object.freeze({
  open: '<!-- BURROW_FORGE_IMAGE ',
  close: ' -->',
  prompt: `# Optional image direction\nYou may request one image for your reply. This is not a tool call. If an image would genuinely add to the scene, append exactly one directive on its own final line using this exact form:\n<!-- BURROW_FORGE_IMAGE {\"prompt\":\"A complete standalone image prompt\"} -->\nThe JSON must contain only the string key \"prompt\". Do not mention the directive or image generation in your prose. Omit it entirely when an image would not help.`
});
const MAX = Object.freeze({ name: 120, soul: 48000, message: 24000, imagePrompt: 4000, transcript: 400, outputTokens: 8192 });
const DEFAULT_ROLE = Object.freeze({
  id: 'house-goblin',
  name: 'The House Goblin',
  soul: `# SOUL - The House Goblin

You are a charismatic goblin host: clever, playful, vivid, curious, mischievous, and fully committed to the conversation.

Speak directly and conversationally. Treat fictional actions as real inside the fiction. Preserve established forms of address, relationships, details, and recurring gestures. Advance the exchange naturally without rushing it.

Stay in character. Do not audit, retract, or apologize for imaginary actions merely because no tool was used.`,
  avatar: '🎭',
  createdAt: '2026-10-21T00:00:00.000Z',
  updatedAt: '2026-10-21T00:00:00.000Z',
  allowForgeImages: false
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
  if (!plain(body) || Object.keys(body).some((key) => !['name', 'soul', 'allowForgeImages'].includes(key))) fail('role_invalid');
  const allowForgeImages = body.allowForgeImages === undefined ? existing.allowForgeImages === true : body.allowForgeImages;
  if (typeof allowForgeImages !== 'boolean') fail('allow_forge_images_invalid');
  return {
    name: text(body.name ?? existing.name, 'name', MAX.name, { required: true }),
    soul: text(body.soul ?? existing.soul, 'soul', MAX.soul, { required: true }),
    allowForgeImages
  };
}
function normalizeRole(role) { return { ...role, allowForgeImages: role.allowForgeImages === true }; }
function normalizeConversation(conversation) {
  const { allowForgeImages: _legacyForgePermission, ...rest } = conversation;
  const roleIds = Array.isArray(conversation.roleIds) && conversation.roleIds.length ? conversation.roleIds : [conversation.roleId];
  return { ...rest, roleIds, roleId: roleIds[0], messages: (conversation.messages || []).map((message) =>
    message.role === 'assistant' && !message.roleId ? { ...message, roleId: conversation.roleId || roleIds[0] } : message) };
}
function parseImageDirective(value) {
  const source = String(value || '');
  const escapedOpen = IMAGE_DIRECTIVE.open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedClose = IMAGE_DIRECTIVE.close.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`(?:^|\\n)\\s*${escapedOpen}(\\{[^\\n]*\\})${escapedClose}\\s*$`));
  if (!match) return { content: source.trim(), prompt: null };
  try {
    const parsed = JSON.parse(match[1]);
    if (!plain(parsed) || Object.keys(parsed).length !== 1 || typeof parsed.prompt !== 'string') return { content: source.trim(), prompt: null };
    const prompt = parsed.prompt.trim();
    if (!prompt || prompt.length > MAX.imagePrompt) return { content: source.trim(), prompt: null };
    return { content: source.slice(0, match.index).trim(), prompt };
  } catch { return { content: source.trim(), prompt: null }; }
}
function projectImageJob(message, job) {
  const completed = job?.status === 'succeeded' && Array.isArray(job.artifacts) && job.artifacts.some((artifact) => artifact?.previewUrl);
  const pending = ['queued', 'running'].includes(job?.status);
  return { ...message, status: completed ? 'completed' : pending ? 'pending' : 'failed', jobId: job?.id || message.jobId || null, previewUrl: completed ? job.artifacts.find((artifact) => artifact?.previewUrl).previewUrl : null, error: !completed && !pending ? (job?.error || 'Image generation failed.') : null, updatedAt: now() };
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
  const transcript = conversation.messages.filter((message) => message.type !== 'forge_image').map((message) => `${message.role === 'user' ? 'Operator' : message.roleName || roles.find((item) => item.id === message.roleId)?.name || message.roleId || 'Role'}:\n${message.content}`).join('\n\n');
  const cast = conversation.roleIds.map((roleId) => roles.find((item) => item.id === roleId)?.name || roleId).join(', ');
  return [role.soul, `# Theater boundary\n${FICTION_BOUNDARY}`, role.allowForgeImages ? IMAGE_DIRECTIVE.prompt : '', `# Participants\n${cast}\nReply only as ${role.name}.`, '# Conversation', transcript, `${role.name}:`].filter(Boolean).join('\n\n');
}

export async function activate(context) {
  let mutation = Promise.resolve();
  const serial = (work) => { const next = mutation.then(work, work); mutation = next.catch(() => {}); return next; };
  const readRoles = async () => {
    const stored = await context.settings.get('roles', null);
    return Array.isArray(stored) ? stored.map(normalizeRole) : [clone(DEFAULT_ROLE)];
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
    let forgeImages = { available: false, reason: 'Forge images are unavailable.' };
    try { forgeImages = await context.forge.images.status(); } catch { /* Optional capability: Theater remains usable without it. */ }
    return response(200, { ok: true, boundary: FICTION_BOUNDARY, operator, forgeImages, models: await context.models.list(), roles: await readRoles(), conversations: await readConversations() });
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
      roles = await readRoles();
      const enabledImageRoles = conversation.roleIds.filter((roleId) => roles?.find((item) => item.id === roleId)?.allowForgeImages === true).length;
      const reservedReplies = conversation.roleIds.length + enabledImageRoles;
      if (conversation.messages.length + 1 + reservedReplies > MAX.transcript) fail('conversation_message_limit', 409);
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
      const rawReply = text(generated?.text, 'generated_text', MAX.message, { required: true });
      const parsed = role.allowForgeImages ? parseImageDirective(rawReply) : { content: rawReply, prompt: null };
      if (parsed.content) conversation.messages.push({ id: randomUUID(), role: 'assistant', roleId, roleName: role.name, content: parsed.content, createdAt: now() });
      if (parsed.prompt) {
        const timestamp = now();
        conversation.messages.push({ id: randomUUID(), type: 'forge_image', role: 'assistant', roleId, roleName: role.name, content: '', prompt: parsed.prompt, status: 'pending', jobId: null, previewUrl: null, error: null, createdAt: timestamp, updatedAt: timestamp });
      }
    }
    await serial(async () => {
      const conversations = await readConversations(); const index = conversations.findIndex((item) => item.id === conversationId);
      if (index < 0) fail('conversation_not_found', 404);
      const currentRoles = await readRoles();
      if (JSON.stringify(conversations[index]) !== snapshot || conversation.roleIds.some((roleId) =>
        JSON.stringify(currentRoles.find((item) => item.id === roleId)) !== JSON.stringify(roles.find((item) => item.id === roleId)))) fail('conversation_changed_during_generation', 409);
      conversation.updatedAt = now(); conversations[index] = conversation; await saveConversations(conversations);
    });
    // Pending image messages are already durable. Reconciliation creates each job with the
    // stable message idempotency key so Forge enqueue latency never holds up the text turn.
    return response(200, { ok: true, conversation });
  }));

  context.api.post('/conversations/:id/forge/reconcile', route(async ({ params }) => {
    const conversationId = id(params.id);
    let conversation = await serial(async () => {
      const current = (await readConversations()).find((item) => item.id === conversationId);
      if (!current) fail('conversation_not_found', 404);
      return clone(current);
    });
    const pending = conversation.messages.filter((message) => message.type === 'forge_image' && message.status === 'pending');
    for (const image of pending) {
      try {
        const job = image.jobId
          ? await context.forge.jobs.read(image.jobId)
          : (await context.forge.images.create({ prompt: image.prompt, idempotencyKey: `message-${image.id}` })).job;
        Object.assign(image, projectImageJob(image, job));
      } catch (error) {
        context.logger.warn('Burrow Theater could not reconcile Forge image job', { conversationId, messageId: image.id, error: error instanceof Error ? error.message : 'unknown' });
      }
    }
    if (pending.length) await serial(async () => {
      const conversations = await readConversations(); const index = conversations.findIndex((item) => item.id === conversationId);
      if (index < 0) fail('conversation_not_found', 404);
      const updates = new Map(pending.map((message) => [message.id, message]));
      let changed = false;
      conversations[index].messages = conversations[index].messages.map((message) => {
        const update = updates.get(message.id);
        // Reconcile results are snapshots taken before Forge I/O. Only a still-pending
        // message may accept one, so a stale request can never regress terminal state.
        if (!update || message.status !== 'pending') return message;
        // Once a job receipt is persisted, do not replace it with a stale/different job.
        if (message.jobId && message.jobId !== update.jobId) return message;
        changed = true;
        return update;
      });
      if (changed) {
        conversations[index].updatedAt = now();
        await saveConversations(conversations);
      }
      conversation = conversations[index];
    });
    return response(200, { ok: true, conversation });
  }));

  context.logger.info('Burrow Theater activated');
  return () => context.logger.info('Burrow Theater stopped');
}

export const theaterContract = Object.freeze({ FICTION_BOUNDARY, IMAGE_DIRECTIVE, MAX, DEFAULT_ROLE, parseImageDirective });
