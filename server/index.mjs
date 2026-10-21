import { randomUUID } from 'node:crypto';

const RP_BOUNDARY = 'Everything in this conversation occurs only within the fictional scene. Describe and perform in-character actions freely, but never claim to have completed real-world actions or accessed information outside the supplied scene.';
const MAX = Object.freeze({ name: 120, card: 24000, scenario: 12000, notes: 16000, message: 24000, transcript: 400, outputTokens: 8192 });
const DEFAULT_CHARACTER = Object.freeze({
  id: 'house-goblin',
  name: 'The House Goblin',
  premise: 'A charismatic goblin host who welcomes the operator onto a private theatrical stage where any story can begin.',
  personality: 'Clever, playful, vivid, curious, mischievous, and committed to the scene.',
  voice: 'Direct, conversational, expressive, and comfortable using stage directions between asterisks.',
  rituals: 'Treat scene openings like the rise of a curtain. Preserve established forms of address and recurring gestures.',
  principles: 'Stay in character. Advance the scene without rushing it. Treat fictional actions as real inside the fiction. Never audit, retract, or apologize for imaginary actions merely because no tool was used.',
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
function validateCharacter(body, existing = {}) {
  if (!plain(body)) fail('character_invalid');
  const allowed = ['name', 'premise', 'personality', 'voice', 'rituals', 'principles'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) fail('character_invalid');
  const result = {};
  for (const field of allowed) result[field] = text(body[field] ?? existing[field], field, field === 'name' ? MAX.name : MAX.card, { required: ['name', 'premise', 'personality', 'voice', 'principles'].includes(field) });
  return result;
}
function validateScene(body, existing = {}) {
  if (!plain(body)) fail('scene_invalid');
  const allowed = ['title', 'characterId', 'connectionId', 'model', 'scenario', 'notes'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) fail('scene_invalid');
  return {
    title: text(body.title ?? existing.title, 'title', MAX.name, { required: true }),
    characterId: id(body.characterId ?? existing.characterId, 'character_id'),
    connectionId: text(body.connectionId ?? existing.connectionId, 'connection_id', 128, { required: true }),
    model: text(body.model ?? existing.model, 'model', 256, { required: true }),
    scenario: text(body.scenario ?? existing.scenario, 'scenario', MAX.scenario),
    notes: text(body.notes ?? existing.notes, 'notes', MAX.notes)
  };
}
function characterPrompt(character) {
  return [`# Character: ${character.name}`, `## Premise\n${character.premise}`, `## Core nature\n${character.personality}`, `## Voice and forms of address\n${character.voice}`, character.rituals ? `## Rituals and characteristic behavior\n${character.rituals}` : '', `## Behavior, pacing, and failure boundaries\n${character.principles}`, `## Fiction boundary\n${RP_BOUNDARY}`].filter(Boolean).join('\n\n');
}
function buildPrompt(character, scene) {
  const transcript = scene.messages.map((message) => `${message.role === 'user' ? 'Operator' : character.name}:\n${message.content}`).join('\n\n');
  return [characterPrompt(character), scene.scenario ? `# Scenario\n${scene.scenario}` : '', scene.notes ? `# Pinned continuity\n${scene.notes}` : '', '# Scene transcript', transcript, `${character.name}:`].filter(Boolean).join('\n\n');
}

export async function activate(context) {
  let mutation = Promise.resolve();
  const serial = (work) => { const next = mutation.then(work, work); mutation = next.catch(() => {}); return next; };
  const readCharacters = async () => {
    const stored = await context.settings.get('rp-characters', null);
    return Array.isArray(stored) && stored.length ? stored : [clone(DEFAULT_CHARACTER)];
  };
  const readScenes = async () => { const stored = await context.settings.get('rp-scenes', []); return Array.isArray(stored) ? stored : []; };
  const saveCharacters = (items) => context.settings.set('rp-characters', items);
  const saveScenes = (items) => context.settings.set('rp-scenes', items);
  const route = (handler) => async (request) => { try { requireOperator(request); return await handler(request); } catch (error) { return errorResponse(error, context.logger); } };

  context.api.get('/bootstrap', route(async () => response(200, { ok: true, boundary: RP_BOUNDARY, models: await context.models.list(), characters: await readCharacters(), scenes: await readScenes() })));

  context.api.post('/characters', route(async ({ body }) => serial(async () => {
    const timestamp = now(); const character = { id: randomUUID(), ...validateCharacter(body), createdAt: timestamp, updatedAt: timestamp };
    const characters = await readCharacters(); characters.push(character); await saveCharacters(characters);
    return response(201, { ok: true, character });
  })));
  context.api.put('/characters/:id', route(async ({ params, body }) => serial(async () => {
    const characterId = id(params.id); const characters = await readCharacters(); const index = characters.findIndex((item) => item.id === characterId);
    if (index < 0) fail('character_not_found', 404);
    characters[index] = { ...characters[index], ...validateCharacter(body, characters[index]), updatedAt: now() }; await saveCharacters(characters);
    return response(200, { ok: true, character: characters[index] });
  })));
  context.api.delete('/characters/:id', route(async ({ params }) => serial(async () => {
    const characterId = id(params.id); const characters = await readCharacters();
    if (!characters.some((item) => item.id === characterId)) fail('character_not_found', 404);
    const scenes = await readScenes(); if (scenes.some((item) => item.characterId === characterId)) fail('character_in_use', 409);
    await saveCharacters(characters.filter((item) => item.id !== characterId)); return response(200, { ok: true });
  })));

  context.api.post('/scenes', route(async ({ body }) => serial(async () => {
    const values = validateScene(body); const characters = await readCharacters();
    if (!characters.some((item) => item.id === values.characterId)) fail('character_not_found', 404);
    const models = await context.models.list(); if (!models.some((item) => item.connectionId === values.connectionId && item.model === values.model)) fail('model_not_found', 404);
    const timestamp = now(); const scene = { id: randomUUID(), ...values, messages: [], createdAt: timestamp, updatedAt: timestamp };
    const scenes = await readScenes(); scenes.unshift(scene); await saveScenes(scenes); return response(201, { ok: true, scene });
  })));
  context.api.put('/scenes/:id', route(async ({ params, body }) => serial(async () => {
    const sceneId = id(params.id); const scenes = await readScenes(); const index = scenes.findIndex((item) => item.id === sceneId); if (index < 0) fail('scene_not_found', 404);
    const values = validateScene(body, scenes[index]); const characters = await readCharacters(); if (!characters.some((item) => item.id === values.characterId)) fail('character_not_found', 404);
    scenes[index] = { ...scenes[index], ...values, updatedAt: now() }; await saveScenes(scenes); return response(200, { ok: true, scene: scenes[index] });
  })));
  context.api.delete('/scenes/:id', route(async ({ params }) => serial(async () => {
    const sceneId = id(params.id); const scenes = await readScenes(); if (!scenes.some((item) => item.id === sceneId)) fail('scene_not_found', 404);
    await saveScenes(scenes.filter((item) => item.id !== sceneId)); return response(200, { ok: true });
  })));
  context.api.post('/scenes/:id/branch', route(async ({ params, body }) => serial(async () => {
    const sceneId = id(params.id); const scenes = await readScenes(); const source = scenes.find((item) => item.id === sceneId); if (!source) fail('scene_not_found', 404);
    const through = body?.throughMessageId === undefined ? null : id(body.throughMessageId, 'message_id');
    const index = through === null ? source.messages.length - 1 : source.messages.findIndex((item) => item.id === through); if (through !== null && index < 0) fail('message_not_found', 404);
    const timestamp = now(); const scene = { ...clone(source), id: randomUUID(), title: `${source.title} — branch`, messages: source.messages.slice(0, index + 1), createdAt: timestamp, updatedAt: timestamp };
    scenes.unshift(scene); await saveScenes(scenes); return response(201, { ok: true, scene });
  })));
  context.api.put('/scenes/:id/messages/:messageId', route(async ({ params, body }) => serial(async () => {
    const sceneId = id(params.id); const messageId = id(params.messageId, 'message_id'); const content = text(body?.content, 'message', MAX.message, { required: true });
    const scenes = await readScenes(); const scene = scenes.find((item) => item.id === sceneId); if (!scene) fail('scene_not_found', 404);
    const index = scene.messages.findIndex((item) => item.id === messageId); if (index < 0) fail('message_not_found', 404);
    scene.messages[index] = { ...scene.messages[index], content, editedAt: now() }; scene.messages = scene.messages.slice(0, index + 1); scene.updatedAt = now(); await saveScenes(scenes);
    return response(200, { ok: true, scene });
  })));

  context.api.post('/scenes/:id/turn', route(async ({ params, body }) => {
    const sceneId = id(params.id); if (!plain(body) || Object.keys(body).some((key) => !['content', 'regenerate', 'maxTokens'].includes(key))) fail('turn_invalid');
    const regenerate = body.regenerate === true; if (body.regenerate !== undefined && typeof body.regenerate !== 'boolean') fail('turn_invalid');
    const maxTokens = body.maxTokens === undefined ? 1200 : body.maxTokens; if (!Number.isSafeInteger(maxTokens) || maxTokens < 1 || maxTokens > MAX.outputTokens) fail('max_tokens_invalid');
    let scene; let character;
    await serial(async () => {
      const scenes = await readScenes(); const index = scenes.findIndex((item) => item.id === sceneId); if (index < 0) fail('scene_not_found', 404);
      scene = clone(scenes[index]);
      if (regenerate) { if (scene.messages.at(-1)?.role !== 'character') fail('nothing_to_regenerate', 409); scene.messages.pop(); }
      else { const content = text(body.content, 'message', MAX.message, { required: true }); if (scene.messages.length >= MAX.transcript) fail('scene_message_limit', 409); scene.messages.push({ id: randomUUID(), role: 'user', content, createdAt: now() }); }
      character = (await readCharacters()).find((item) => item.id === scene.characterId); if (!character) fail('character_not_found', 404);
    });
    const generated = await context.models.generateText({ connectionId: scene.connectionId, model: scene.model, prompt: buildPrompt(character, scene), maxTokens });
    const content = text(generated?.text, 'generated_text', MAX.message, { required: true });
    return serial(async () => {
      const scenes = await readScenes(); const index = scenes.findIndex((item) => item.id === sceneId); if (index < 0) fail('scene_not_found', 404);
      const current = scenes[index];
      const currentBase = regenerate ? current.messages.slice(0, -1) : current.messages;
      const generatedBase = regenerate ? scene.messages : scene.messages.slice(0, -1);
      if (JSON.stringify(currentBase.map((item) => item.id)) !== JSON.stringify(generatedBase.map((item) => item.id))) fail('scene_changed_during_generation', 409);
      scene.messages.push({ id: randomUUID(), role: 'character', content, createdAt: now() }); scene.updatedAt = now(); scenes[index] = scene; await saveScenes(scenes);
      return response(200, { ok: true, scene });
    });
  }));

  context.logger.info('Burrow Theater activated');
  return () => context.logger.info('Burrow Theater stopped');
}

export const theaterContract = Object.freeze({ RP_BOUNDARY, MAX, DEFAULT_CHARACTER });
