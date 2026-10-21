const styles = `
.bt{--bt-accent:#b878f4;--bt-accent-strong:#8f43d8;--bt-ink:#f7f2fb;--bt-muted:#b9adc3;--bt-line:rgba(208,166,238,.19);--bt-panel:rgba(20,14,25,.9);--bt-panel-soft:rgba(31,21,38,.72);height:100%;min-height:560px;color:var(--bt-ink);background:radial-gradient(circle at 74% -12%,rgba(166,77,223,.17),transparent 38%),linear-gradient(145deg,#0b080d,#17101c 58%,#0d0910);font:14px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.bt *{box-sizing:border-box}.bt button,.bt input,.bt textarea,.bt select{font:inherit}.bt button{cursor:pointer}.bt button:focus-visible,.bt input:focus-visible,.bt textarea:focus-visible,.bt select:focus-visible,.bt-scene:focus-visible{outline:2px solid #dcadff;outline-offset:2px}.bt-shell{display:grid;grid-template-columns:minmax(220px,278px) minmax(0,1fr);height:100%;min-height:560px}.bt-rail{display:flex;min-width:0;flex-direction:column;padding:22px 16px;border-right:1px solid var(--bt-line);background:rgba(8,6,10,.68)}.bt-brand{margin:0;color:#d9a6ff;font:800 21px/1.1 Georgia,serif;letter-spacing:.1em;text-transform:uppercase}.bt-tag{margin:6px 0 20px;color:var(--bt-muted);font-size:11px;letter-spacing:.11em;text-transform:uppercase}.bt-button{min-height:36px;padding:7px 11px;border:1px solid rgba(201,153,235,.28);border-radius:7px;color:var(--bt-ink);background:rgba(53,35,63,.72)}.bt-button:hover:not(:disabled){border-color:#c78af2;background:rgba(73,45,88,.8)}.bt-button.primary{border-color:#ce94fa;background:linear-gradient(180deg,#a558df,#7a32b8);font-weight:750}.bt-button.quiet{background:transparent}.bt-button.danger{border-color:rgba(244,126,126,.34);color:#ffb2b2;background:transparent}.bt-button:disabled{cursor:not-allowed;opacity:.48}.bt-new{width:100%;margin-bottom:16px}.bt-scene-list{display:grid;gap:7px;overflow:auto;padding:2px}.bt-scene{display:block;width:100%;min-width:0;padding:11px 12px;border:1px solid transparent;border-radius:9px;color:inherit;background:transparent;text-align:left}.bt-scene:hover{background:var(--bt-panel-soft)}.bt-scene.active{border-color:rgba(198,130,244,.48);background:linear-gradient(100deg,rgba(143,67,216,.25),rgba(65,39,75,.56));box-shadow:inset 3px 0 #b667eb}.bt-scene strong,.bt-scene small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bt-scene strong{font-size:13px}.bt-scene small{margin-top:3px;color:var(--bt-muted);font-size:11px}.bt-main{display:grid;min-width:0;min-height:0;grid-template-rows:auto minmax(0,1fr) auto}.bt-toolbar{display:flex;min-width:0;align-items:center;gap:8px;padding:12px clamp(14px,2.8vw,34px);border-bottom:1px solid var(--bt-line);background:rgba(11,8,14,.64);backdrop-filter:blur(12px)}.bt-title{min-width:0;margin-right:auto}.bt-title h1{overflow:hidden;margin:0;color:var(--bt-ink);font-size:17px;text-overflow:ellipsis;white-space:nowrap}.bt-title p{overflow:hidden;margin:2px 0 0;color:var(--bt-muted);font-size:11px;text-overflow:ellipsis;white-space:nowrap}.bt-toolbar-actions{display:flex;gap:7px}.bt-stage{min-height:0;overflow:auto;padding:28px clamp(16px,5vw,68px);scrollbar-gutter:stable}.bt-transcript{display:grid;max-width:850px;margin:0 auto;gap:19px}.bt-line{position:relative;padding:15px 17px;border:1px solid var(--bt-line);border-radius:11px;background:var(--bt-panel);box-shadow:0 12px 26px rgba(0,0,0,.16)}.bt-line.character{border-left:3px solid var(--bt-accent)}.bt-line.user{margin-left:9%;border-right:3px solid #68bddd;background:rgba(16,23,29,.91)}.bt-speaker{margin-bottom:7px;color:#d6a8f7;font-size:12px;font-weight:800;letter-spacing:.03em}.bt-line.user .bt-speaker{color:#84d4f0}.bt-content{overflow-wrap:anywhere;white-space:pre-wrap}.bt-content em{color:#d1c2dc}.bt-line-actions{display:flex;justify-content:flex-end;margin-top:7px}.bt-line-actions .bt-button{min-height:27px;padding:3px 8px;color:var(--bt-muted);font-size:11px}.bt-empty{display:grid;max-width:700px;min-height:100%;margin:auto;place-content:center;justify-items:center;padding:34px;text-align:center}.bt-mark{display:grid;width:70px;height:70px;place-items:center;border:1px solid rgba(203,145,244,.35);border-radius:50%;background:rgba(104,48,139,.19);font-size:34px;box-shadow:0 0 48px rgba(145,54,210,.18)}.bt-empty h2{margin:20px 0 8px;color:#dcaeff;font:800 clamp(30px,5vw,58px)/1 Georgia,serif;letter-spacing:.025em}.bt-empty p{max-width:540px;margin:0 0 20px;color:var(--bt-muted);font-size:15px}.bt-empty .bt-kicker{margin-bottom:4px;color:#c78cf0;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.bt-empty-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}.bt-composer{padding:12px clamp(14px,5vw,68px) 17px;border-top:1px solid var(--bt-line);background:rgba(8,6,10,.9)}.bt-compose-inner{display:grid;max-width:850px;margin:auto;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:end}.bt textarea,.bt input,.bt select{width:100%;border:1px solid rgba(202,159,232,.3);border-radius:7px;background:#120d16;color:var(--bt-ink)}.bt textarea{min-height:70px;max-height:190px;padding:10px 11px;resize:vertical}.bt input,.bt select{min-height:38px;padding:8px 10px}.bt textarea::placeholder{color:#8f8199}.bt-feedback{max-width:850px;min-height:18px;margin:6px auto 0;color:var(--bt-muted);font-size:11px}.bt-feedback.error{color:#ffaaa8}.bt-dialog-layer{position:fixed;z-index:1000;inset:0;display:grid;place-items:center;padding:20px;background:rgba(4,2,6,.79);backdrop-filter:blur(7px)}.bt-dialog{width:min(700px,100%);max-height:min(88vh,760px);overflow:auto;padding:22px;border:1px solid rgba(202,137,246,.48);border-radius:14px;background:#17101d;box-shadow:0 28px 90px rgba(0,0,0,.66)}.bt-dialog-header{margin-bottom:18px}.bt-dialog h2{margin:0;color:#e0b7fc;font:800 25px/1.15 Georgia,serif}.bt-dialog-header p{margin:5px 0 0;color:var(--bt-muted);font-size:12px}.bt-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.bt-field{display:grid;min-width:0;gap:5px;color:#d4c7dc;font-size:12px;font-weight:700}.bt-span{grid-column:1/-1}.bt-dialog textarea{min-height:104px}.bt-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.bt-dialog .bt-feedback{margin:10px 0 0}.bt-loading{animation:bt-pulse 1.2s ease-in-out infinite alternate}@keyframes bt-pulse{to{opacity:.55}}@media(prefers-reduced-motion:reduce){.bt-loading{animation:none}}@media(max-width:780px){.bt{height:auto;min-height:100%}.bt-shell{grid-template-columns:1fr;grid-template-rows:auto minmax(520px,1fr);height:auto}.bt-rail{padding:14px;border-right:0;border-bottom:1px solid var(--bt-line)}.bt-tag{margin-bottom:12px}.bt-new{width:auto;align-self:flex-start;margin-bottom:10px}.bt-scene-list{display:flex;margin:0 -2px;overflow-x:auto}.bt-scene{width:190px;flex:0 0 190px}.bt-toolbar{position:sticky;z-index:3;top:0;flex-wrap:wrap}.bt-title{flex:1 1 180px}.bt-toolbar-actions{width:100%;overflow-x:auto}.bt-toolbar-actions .bt-button{white-space:nowrap}.bt-stage{min-height:380px;padding-block:22px}.bt-line.user{margin-left:0}.bt-compose-inner{grid-template-columns:1fr}.bt-compose-inner .bt-button{justify-self:end}.bt-form-grid{grid-template-columns:1fr}.bt-span{grid-column:auto}}`;

function node(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'className') element.className = value;
    else if (name === 'text') element.textContent = value;
    else if (name === 'htmlFor') element.htmlFor = value;
    else element.setAttribute(name, value);
  }
  element.append(...children);
  return element;
}
function action(label, className = '') { return node('button', { type: 'button', className: `bt-button${className ? ` ${className}` : ''}`, text: label }); }
function input(name, value = '') { const control = node('input', { name, type: 'text', autocomplete: 'off' }); control.value = value; return control; }
function textarea(name, value = '', rows = '4') { const control = node('textarea', { name, rows }); control.value = value; return control; }
function field(label, control, wide = false) { return node('label', { className: `bt-field${wide ? ' bt-span' : ''}` }, document.createTextNode(label), control); }
function errorText(error) {
  const code = error instanceof Error ? error.message : '';
  const known = { model_not_found: 'That model is no longer available.', character_not_found: 'That character is no longer available.', scene_changed_during_generation: 'The scene changed while the reply was being written. Try again.', scene_message_limit: 'This scene has reached its 400-message limit.' };
  return known[code] || (code ? code.replaceAll('_', ' ') : 'Something went sideways backstage.');
}
function richText(content) {
  const fragment = document.createDocumentFragment();
  for (const part of String(content).split(/(\*[^*\n]+\*)/g)) fragment.append(part.startsWith('*') && part.endsWith('*') ? node('em', { text: part }) : document.createTextNode(part));
  return fragment;
}
function download(name, content) {
  const link = node('a', { href: URL.createObjectURL(new Blob([content], { type: 'text/markdown' })), download: name });
  link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

export function mountControl({ root, api }) {
  const controller = new AbortController();
  let mounted = true;
  let data = { models: [], characters: [], scenes: [] };
  let activeId = '';
  let busy = false;
  let feedback = '';
  let feedbackError = false;
  let draft = '';
  const style = node('style', { text: styles });
  const app = node('div', { className: 'bt' });
  root.replaceChildren(style, app);
  const request = (path, init = {}) => api(path, { ...init, signal: controller.signal, headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } });
  const active = () => data.scenes.find((scene) => scene.id === activeId);
  const character = (id) => data.characters.find((item) => item.id === id);

  async function mutate(path, method, body) {
    return request(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  function showDialog({ title, description, fields, submitLabel, submit }) {
    const layer = node('div', { className: 'bt-dialog-layer' });
    const form = node('form', { className: 'bt-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'bt-dialog-title' });
    const grid = node('div', { className: 'bt-form-grid' });
    const cancel = action('Cancel', 'quiet');
    const save = node('button', { type: 'submit', className: 'bt-button primary', text: submitLabel });
    const status = node('p', { className: 'bt-feedback', role: 'status', 'aria-live': 'polite' });
    for (const item of fields) grid.append(field(item.label, item.control, item.wide));
    form.append(node('header', { className: 'bt-dialog-header' }, node('h2', { id: 'bt-dialog-title', text: title }), description ? node('p', { text: description }) : ''), grid, status, node('div', { className: 'bt-dialog-actions' }, cancel, save));
    layer.append(form); app.append(layer);
    const first = form.querySelector('input') || form.querySelector('select') || form.querySelector('textarea');
    first?.focus?.();
    const close = () => layer.remove();
    cancel.onclick = close;
    layer.onclick = (event) => { if (event.target === layer) close(); };
    layer.onkeydown = (event) => { if (event.key === 'Escape') close(); };
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      save.disabled = true; cancel.disabled = true; save.textContent = 'Saving…';
      try { await submit(Object.fromEntries(new FormData(form))); close(); }
      catch (error) { status.textContent = errorText(error); status.className = 'bt-feedback error'; status.setAttribute('role', 'alert'); save.disabled = false; cancel.disabled = false; save.textContent = submitLabel; }
    };
  }
  function sceneDialog(existing = null) {
    if (!data.characters.length) { feedback = 'Create a character in Settings → Burrow Theater first.'; feedbackError = true; render(); return; }
    if (!data.models.length) { feedback = 'No configured text models are available.'; feedbackError = true; render(); return; }
    const title = input('title', existing?.title || 'Untitled scene'); title.required = true; title.maxLength = 120;
    const characterSelect = node('select', { name: 'characterId' });
    for (const item of data.characters) { const option = node('option', { value: item.id, text: item.name }); if (item.id === (existing?.characterId || data.characters[0]?.id)) option.selected = true; characterSelect.append(option); }
    const modelSelect = node('select', { name: 'modelKey' });
    for (const model of data.models) { const key = `${model.connectionId}\u0000${model.model}`; const option = node('option', { value: key, text: `${model.model} · ${model.provider}` }); if (model.connectionId === existing?.connectionId && model.model === existing?.model) option.selected = true; modelSelect.append(option); }
    showDialog({
      title: existing ? 'Scene setup' : 'Raise a new curtain',
      description: existing ? 'Changes affect future replies; the transcript stays intact.' : 'Choose the cast and establish the opening situation.',
      fields: [
        { label: 'Scene title', control: title },
        { label: 'Character', control: characterSelect },
        { label: 'Text model', control: modelSelect, wide: true },
        { label: 'Scenario / setting', control: textarea('scenario', existing?.scenario || '', '5'), wide: true },
        { label: 'Pinned story, relationship, and world notes', control: textarea('notes', existing?.notes || '', '5'), wide: true },
      ],
      submitLabel: existing ? 'Save setup' : 'Create scene',
      submit: async (values) => {
        const [connectionId, model] = values.modelKey.split('\u0000');
        const payload = { title: values.title, characterId: values.characterId, connectionId, model, scenario: values.scenario, notes: values.notes };
        const result = await mutate(existing ? `/scenes/${existing.id}` : '/scenes', existing ? 'PUT' : 'POST', payload);
        data.scenes = existing ? data.scenes.map((item) => item.id === existing.id ? result.scene : item) : [result.scene, ...data.scenes];
        activeId = result.scene.id; feedback = ''; render();
      },
    });
  }
  function editMessage(scene, message) {
    const control = textarea('content', message.content, '8'); control.required = true; control.maxLength = 24000;
    showDialog({ title: 'Edit this beat', description: 'Saving here trims every later beat so the scene can continue from this point.', fields: [{ label: 'Message', control, wide: true }], submitLabel: 'Save and trim', submit: async (values) => {
      const result = await mutate(`/scenes/${scene.id}/messages/${message.id}`, 'PUT', { content: values.content });
      data.scenes = data.scenes.map((item) => item.id === scene.id ? result.scene : item); feedback = 'The scene now continues from the edited beat.'; feedbackError = false; render();
    } });
  }
  function exportScene(scene) {
    const who = character(scene.characterId)?.name || 'Character';
    const content = [`# ${scene.title}`, scene.scenario ? `## Scenario\n${scene.scenario}` : '', scene.notes ? `## Pinned continuity\n${scene.notes}` : '', '## Transcript', ...scene.messages.map((message) => `### ${message.role === 'user' ? 'Operator' : who}\n${message.content}`)].filter(Boolean).join('\n\n');
    download(`${scene.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'scene'}.md`, content);
  }
  async function runTurn({ regenerate = false } = {}) {
    const scene = active();
    const content = draft.trim();
    if (!scene || busy || (!regenerate && !content)) return;
    busy = true; feedback = regenerate ? 'Replaying the last beat…' : 'The house goes quiet…'; feedbackError = false; if (!regenerate) draft = ''; render();
    try {
      const result = await request(`/scenes/${scene.id}/turn`, { method: 'POST', body: JSON.stringify(regenerate ? { regenerate: true } : { content }) });
      data.scenes = data.scenes.map((item) => item.id === scene.id ? result.scene : item); feedback = ''; render();
      requestAnimationFrame(() => app.querySelector('.bt-stage')?.scrollTo(0, 999999));
    } catch (error) { if (!regenerate) draft = content; feedback = errorText(error); feedbackError = true; render(); }
    finally { busy = false; if (mounted) render(); }
  }
  async function branchScene(scene) {
    busy = true; feedback = 'Branching the scene…'; feedbackError = false; render();
    try { const result = await mutate(`/scenes/${scene.id}/branch`, 'POST', {}); data.scenes = [result.scene, ...data.scenes]; activeId = result.scene.id; feedback = 'A new branch is ready.'; }
    catch (error) { feedback = errorText(error); feedbackError = true; }
    finally { busy = false; render(); }
  }
  async function deleteScene(scene) {
    if (!confirm(`Drop the curtain on “${scene.title}”? This cannot be undone.`)) return;
    busy = true; render();
    try { await mutate(`/scenes/${scene.id}`, 'DELETE'); data.scenes = data.scenes.filter((item) => item.id !== scene.id); activeId = data.scenes[0]?.id || ''; feedback = 'Scene deleted.'; feedbackError = false; }
    catch (error) { feedback = errorText(error); feedbackError = true; }
    finally { busy = false; render(); }
  }
  function render() {
    if (!mounted) return;
    const scene = active();
    const who = scene ? character(scene.characterId) : null;
    const rail = node('aside', { className: 'bt-rail', 'aria-label': 'Theater scenes' }, node('h1', { className: 'bt-brand', text: 'Burrow Theater' }), node('p', { className: 'bt-tag', text: 'New role. Same bad influence.' }));
    const add = action('New scene', 'primary bt-new'); add.disabled = busy; add.onclick = () => sceneDialog(); rail.append(add);
    const sceneList = node('nav', { className: 'bt-scene-list', 'aria-label': 'Scenes' });
    for (const item of data.scenes) {
      const cast = character(item.characterId);
      const select = action('', `bt-scene${item.id === activeId ? ' active' : ''}`); select.setAttribute('aria-current', item.id === activeId ? 'page' : 'false');
      select.append(node('strong', { text: item.title }), node('small', { text: `${cast?.name || 'Missing character'} · ${item.model}` }));
      select.onclick = () => { activeId = item.id; feedback = ''; feedbackError = false; render(); }; sceneList.append(select);
    }
    if (!data.scenes.length) sceneList.append(node('p', { className: 'bt-feedback', text: 'No scenes yet.' }));
    rail.append(sceneList);

    const main = node('main', { className: 'bt-main' });
    const title = node('div', { className: 'bt-title' }, node('h1', { text: scene?.title || 'The stage is yours' }), node('p', { text: scene ? `${who?.name || 'Missing character'} · ${scene.model}` : 'Private, tool-free character conversation' }));
    const toolbar = node('header', { className: 'bt-toolbar' }, title);
    if (scene) {
      const actions = node('div', { className: 'bt-toolbar-actions' });
      const setup = action('Setup', 'quiet'); setup.disabled = busy; setup.onclick = () => sceneDialog(scene);
      const branch = action('Branch', 'quiet'); branch.disabled = busy; branch.onclick = () => branchScene(scene);
      const replay = action('Regenerate', 'quiet'); replay.disabled = busy || scene.messages.at(-1)?.role !== 'character'; replay.onclick = () => runTurn({ regenerate: true });
      const save = action('Export', 'quiet'); save.onclick = () => exportScene(scene);
      const remove = action('Delete', 'danger'); remove.disabled = busy; remove.onclick = () => deleteScene(scene);
      actions.append(setup, branch, replay, save, remove); toolbar.append(actions);
    }
    const stage = node('section', { className: 'bt-stage', 'aria-label': scene ? `${scene.title} transcript` : 'Theater welcome' });
    if (!scene) {
      const create = action('Raise the curtain', 'primary'); create.onclick = () => sceneDialog();
      stage.append(node('div', { className: 'bt-empty' }, node('div', { className: 'bt-mark', 'aria-hidden': 'true', text: '✦' }), node('p', { className: 'bt-kicker', text: 'A private stage' }), node('h2', { text: 'Enter the Theater' }), node('p', { text: 'Character conversation without tools, operational context, or backstage machinery. Just the scene.' }), node('div', { className: 'bt-empty-actions' }, create), node('p', { className: 'bt-feedback', text: 'Characters are managed in Settings → Burrow Theater.' })));
    } else {
      const transcript = node('div', { className: 'bt-transcript' });
      if (!scene.messages.length) transcript.append(node('div', { className: 'bt-empty' }, node('div', { className: 'bt-mark', 'aria-hidden': 'true', text: '✦' }), node('p', { className: 'bt-kicker', text: who?.name || 'The cast is waiting' }), node('h2', { text: scene.title }), node('p', { text: scene.scenario || 'The curtain is raised. Set the first beat.' })));
      for (const message of scene.messages) {
        const edit = action('Edit from here', 'quiet'); edit.disabled = busy; edit.onclick = () => editMessage(scene, message);
        transcript.append(node('article', { className: `bt-line ${message.role}` }, node('div', { className: 'bt-speaker', text: message.role === 'user' ? 'Operator' : who?.name || 'Character' }), node('div', { className: 'bt-content' }, richText(message.content)), node('div', { className: 'bt-line-actions' }, edit)));
      }
      stage.append(transcript);
    }
    main.append(toolbar, stage);
    if (scene) {
      const compose = textarea('message', draft, '3'); compose.placeholder = `Write the next beat for ${who?.name || 'the scene'}…`; compose.disabled = busy; compose.setAttribute('aria-label', 'Your next message');
      compose.oninput = () => { draft = compose.value; };
      const send = action(busy ? 'Performing…' : 'Send', 'primary'); send.disabled = busy; send.onclick = () => runTurn();
      compose.onkeydown = (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); draft = compose.value; void runTurn(); } };
      main.append(node('footer', { className: 'bt-composer' }, node('div', { className: 'bt-compose-inner' }, compose, send), node('p', { className: `bt-feedback${feedbackError ? ' error' : ''}${busy ? ' bt-loading' : ''}`, role: feedbackError ? 'alert' : 'status', 'aria-live': 'polite', text: feedback })));
    }
    app.replaceChildren(node('div', { className: 'bt-shell' }, rail, main));
  }
  async function load() {
    app.replaceChildren(node('div', { className: 'bt-empty bt-loading' }, node('div', { className: 'bt-mark', 'aria-hidden': 'true', text: '✦' }), node('h2', { text: 'Opening the theater…' })));
    try {
      const result = await request('/bootstrap');
      if (!mounted) return;
      if (!result || !Array.isArray(result.models) || !Array.isArray(result.characters) || !Array.isArray(result.scenes)) throw new Error('invalid_bootstrap_response');
      data = result; activeId = data.scenes[0]?.id || ''; render();
    } catch (error) {
      if (controller.signal.aborted) return;
      const retry = action('Try again', 'primary'); retry.onclick = () => load();
      app.replaceChildren(node('div', { className: 'bt-empty' }, node('h2', { text: 'The curtain jammed' }), node('p', { className: 'bt-feedback error', role: 'alert', text: errorText(error) }), retry));
    }
  }
  void load();
  return () => { mounted = false; controller.abort(); root.replaceChildren(); };
}
