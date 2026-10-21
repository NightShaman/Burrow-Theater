const heroUrl = new URL('./assets/hero.png', import.meta.url).href;

const styles = `
.theater-chat{display:flex;flex-direction:column;height:100%;min-height:0;padding:18px;gap:12px;color:var(--text);background:var(--surface);font:14px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.theater-chat *{box-sizing:border-box}.theater-chat button,.theater-chat select,.theater-chat textarea{font:inherit}.theater-chat button:focus-visible,.theater-chat select:focus-visible,.theater-chat textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.theater-toolbar{display:flex;align-items:end;gap:10px;min-width:0;padding-bottom:12px;border-bottom:1px solid var(--line-soft)}.theater-toolbar label{display:grid;min-width:0;gap:4px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.theater-toolbar select{width:min(260px,30vw);min-height:34px;padding:0 28px 0 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface-input);color:var(--text)}.theater-toolbar .conversation-select{flex:1}.theater-toolbar .conversation-select select{width:100%}.theater-button{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 12px;border:1px solid var(--line);border-radius:6px;background:var(--surface-raised);color:var(--text);font-weight:750;cursor:pointer;white-space:nowrap}.theater-button:hover:not(:disabled){border-color:var(--accent-border);background:var(--surface-hover)}.theater-button.primary{border-color:var(--accent);background:transparent;color:var(--accent-strong)}.theater-button.primary:hover:not(:disabled){background:var(--accent-glow)}.theater-button:disabled{cursor:not-allowed;opacity:.45}.theater-messages{position:relative;display:flex;flex:1;min-height:0;flex-direction:column;gap:20px;overflow:auto;padding:6px 2px;scrollbar-gutter:stable}.theater-empty{display:flex;flex:1;min-height:260px;flex-direction:column;align-items:center;justify-content:center;text-align:center}.theater-empty img{width:min(720px,84%);max-height:min(50vh,480px);object-fit:contain;opacity:.92}.theater-empty h1{margin:-16px 0 6px;color:var(--accent);font-size:clamp(22px,3vw,34px);letter-spacing:-.02em}.theater-empty p{max-width:520px;margin:0;color:var(--muted);font-size:13px}.theater-message{display:grid;width:min(90%,1120px);max-width:100%;grid-template-columns:46px minmax(0,1fr);align-items:start;gap:10px}.theater-message.operator{align-self:flex-end;grid-template-columns:minmax(0,1fr) 46px}.theater-avatar{display:grid;width:46px;height:46px;grid-column:1;grid-row:1;place-items:center;overflow:hidden;border:1px solid var(--line);border-radius:10px;background:var(--surface-raised);color:var(--text-strong);font-weight:800}.theater-message.operator .theater-avatar{grid-column:2}.theater-avatar img{width:100%;height:100%;object-fit:cover}.theater-message-body{display:flex;min-width:0;grid-column:2;flex-direction:column;align-items:flex-start}.theater-message.operator .theater-message-body{grid-column:1;align-items:flex-end}.theater-message small{margin:0 2px 5px;color:var(--accent);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.theater-message.operator small{color:var(--muted)}.theater-bubble{max-width:100%;padding:10px 13px;border:1px solid var(--line);border-radius:4px 14px 14px;background:var(--surface-raised);color:var(--text);font-size:16px;line-height:1.5;overflow-wrap:anywhere;white-space:pre-wrap}.theater-message.operator .theater-bubble{border-color:var(--accent-border);border-radius:14px 4px 14px 14px;background:var(--accent-subtle)}.theater-waiting{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:13px;font-style:italic}.theater-waiting::before{width:14px;height:14px;border:2px solid var(--accent-border);border-top-color:var(--accent);border-radius:50%;animation:theater-spin .8s linear infinite;content:""}@keyframes theater-spin{to{transform:rotate(360deg)}}.theater-composer-wrap{display:grid;gap:7px;margin-top:auto}.theater-composer{display:flex;min-height:104px;flex-direction:column;padding:12px 8px 8px;border:1px solid var(--line);border-radius:9px;background:var(--panel-2)}.theater-composer:focus-within{border-color:var(--accent-border)}.theater-composer textarea{display:block;flex:1;width:100%;min-height:66px;padding:0;border:0;outline:0;resize:none;background:transparent;color:var(--text);font-size:16px;line-height:1.5}.theater-compose-footer{display:flex;min-height:28px;align-items:center;justify-content:space-between;gap:10px}.theater-hint{margin:0;color:var(--muted);font-size:11px}.theater-send{display:grid;width:28px;height:28px;min-height:28px;place-items:center;padding:0;border:0;border-radius:6px;background:var(--accent);color:var(--text-strong);cursor:pointer}.theater-send svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.theater-send:disabled{cursor:not-allowed;opacity:.45}.theater-feedback{min-height:18px;margin:0;color:var(--muted);font-size:12px}.theater-feedback.error{color:var(--danger)}.theater-load-error{display:grid;max-width:520px;margin:auto;gap:10px;justify-items:center;padding:16px;border:1px solid var(--danger-border);border-radius:8px;background:var(--danger-subtle);color:var(--danger);text-align:center}@media(prefers-reduced-motion:reduce){.theater-waiting::before{animation:none}}@media(max-width:620px){.theater-chat{padding:12px}.theater-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end}.theater-toolbar label{grid-column:1/-1}.theater-toolbar select{width:100%}.theater-toolbar .conversation-select{grid-column:1}.theater-toolbar .conversation-select+button{grid-column:2}.theater-message{width:100%;grid-template-columns:36px minmax(0,1fr);gap:8px}.theater-message.operator{grid-template-columns:minmax(0,1fr) 36px}.theater-avatar{width:36px;height:36px;border-radius:8px}.theater-bubble{font-size:15px}.theater-empty img{width:96%}.theater-empty h1{margin-top:-8px}}
`;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'className') node.className = value;
    else if (name === 'text') node.textContent = value;
    else if (name === 'htmlFor') node.htmlFor = value;
    else node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}
function button(label, className = '') { return el('button', { type: 'button', className: `theater-button${className ? ` ${className}` : ''}`, text: label }); }
function errorMessage(error) {
  const code = error instanceof Error ? error.message : '';
  const known = {
    role_not_found: 'That role is no longer available.',
    conversation_not_found: 'That conversation is no longer available.',
    model_not_found: 'The selected model is no longer available.',
    conversation_changed_during_generation: 'The conversation changed while the reply was being written. Your draft is still here.',
    conversation_message_limit: 'This conversation has reached its message limit.',
  };
  return known[code] || (code ? code.replaceAll('_', ' ') : 'The reply could not be completed.');
}
function initials(value) { return String(value || '?').trim().slice(0, 1).toUpperCase() || '?'; }
function avatar(value, name) {
  const node = el('div', { className: 'theater-avatar', 'aria-label': `${name} avatar` });
  if (typeof value === 'string' && /^(?:data:image\/|https?:\/\/|blob:|\/)/.test(value.trim())) node.append(el('img', { src: value.trim(), alt: '' }));
  else node.textContent = value || initials(name);
  return node;
}
function time(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return 'Now';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}
function selectOptions(select, items, current, label) {
  select.replaceChildren();
  if (!items.length) select.append(el('option', { value: '', text: label }));
  for (const item of items) {
    const option = el('option', { value: item.id, text: item.label });
    if (item.id === current) option.selected = true;
    select.append(option);
  }
}

export function mountControl({ root, api }) {
  const controller = new AbortController();
  let mounted = true;
  let data = { models: [], roles: [], conversations: [], operator: { name: 'You', avatar: '' } };
  let activeId = '';
  let draft = '';
  let busy = false;
  let feedback = '';
  let failed = false;
  const style = el('style', { text: styles });
  const app = el('section', { className: 'theater-chat', 'aria-label': 'Burrow Theater conversation' });
  root.replaceChildren(style, app);
  const request = (path, init = {}) => api(path, { ...init, signal: controller.signal, headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } });
  const active = () => data.conversations.find((item) => item.id === activeId) || null;
  const roleFor = (conversation) => data.roles.find((item) => item.id === conversation?.roleId) || data.roles[0] || null;
  const modelFor = (conversation) => data.models.find((item) => item.connectionId === conversation?.connectionId && item.model === conversation?.model) || data.models[0] || null;
  const conversationLabel = (conversation) => conversation.title || roleFor(conversation)?.name || 'New conversation';

  async function createConversation() {
    if (busy) return;
    const role = data.roles[0]; const model = data.models[0];
    if (!role) { feedback = 'Create a SOUL role in Settings → Burrow Theater first.'; failed = true; render(); return; }
    if (!model) { feedback = 'No configured text model is available.'; failed = true; render(); return; }
    busy = true; failed = false; feedback = 'Starting a new conversation…'; render();
    try {
      const result = await request('/conversations', { method: 'POST', body: JSON.stringify({ roleId: role.id, connectionId: model.connectionId, model: model.model }) });
      if (!result?.conversation) throw new Error('invalid_conversation_response');
      data.conversations = [result.conversation, ...data.conversations]; activeId = result.conversation.id; feedback = ''; draft = '';
    } catch (error) { feedback = errorMessage(error); failed = true; }
    finally { busy = false; render(); }
  }
  async function updateConversation(patch) {
    const conversation = active(); if (!conversation || busy) return;
    busy = true; failed = false; feedback = 'Updating conversation…'; render();
    try {
      const result = await request(`/conversations/${conversation.id}`, { method: 'PUT', body: JSON.stringify(patch) });
      if (!result?.conversation) throw new Error('invalid_conversation_response');
      data.conversations = data.conversations.map((item) => item.id === conversation.id ? result.conversation : item); feedback = '';
    } catch (error) { feedback = errorMessage(error); failed = true; }
    finally { busy = false; render(); }
  }
  async function send() {
    const conversation = active(); const content = draft.trim();
    if (!conversation || !content || busy) return;
    busy = true; failed = false; feedback = ''; render();
    try {
      const result = await request(`/conversations/${conversation.id}/turn`, { method: 'POST', body: JSON.stringify({ content }) });
      if (!result?.conversation) throw new Error('invalid_conversation_response');
      data.conversations = data.conversations.map((item) => item.id === conversation.id ? result.conversation : item); draft = '';
    } catch (error) { feedback = errorMessage(error); failed = true; }
    finally {
      busy = false; render();
      requestAnimationFrame(() => { const messages = app.querySelector('.theater-messages'); messages?.scrollTo?.(0, 999999); });
    }
  }
  function renderMessage(message, role) {
    const operator = message.role === 'user';
    const name = operator ? data.operator?.name || 'You' : role?.name || 'Role';
    return el('article', { className: `theater-message ${operator ? 'operator' : 'role'}` }, avatar(operator ? data.operator?.avatar : role?.avatar, name), el('div', { className: 'theater-message-body' }, el('small', { text: `${name} · ${time(message.createdAt)}` }), el('div', { className: 'theater-bubble', text: message.content })));
  }
  function render() {
    if (!mounted) return;
    const conversation = active(); const role = roleFor(conversation); const model = modelFor(conversation);
    const roleSelect = el('select', { 'aria-label': 'Role' });
    selectOptions(roleSelect, data.roles.map((item) => ({ id: item.id, label: item.name })), conversation?.roleId || '', 'No roles configured');
    roleSelect.disabled = busy || !conversation || !data.roles.length;
    roleSelect.onchange = () => updateConversation({ roleId: roleSelect.value });
    const modelSelect = el('select', { 'aria-label': 'Model' });
    selectOptions(modelSelect, data.models.map((item) => ({ id: `${item.connectionId}\u0000${item.model}`, label: item.label || `${item.model} · ${item.provider}` })), model ? `${model.connectionId}\u0000${model.model}` : '', 'No models configured');
    modelSelect.disabled = busy || !conversation || !data.models.length;
    modelSelect.onchange = () => { const [connectionId, selectedModel] = modelSelect.value.split('\u0000'); void updateConversation({ connectionId, model: selectedModel }); };
    const conversationSelect = el('select', { 'aria-label': 'Conversation' });
    selectOptions(conversationSelect, data.conversations.map((item) => ({ id: item.id, label: conversationLabel(item) })), activeId, 'No conversations yet');
    conversationSelect.disabled = busy || !data.conversations.length;
    conversationSelect.onchange = () => { activeId = conversationSelect.value; draft = ''; feedback = ''; failed = false; render(); };
    const create = button('New chat', 'primary'); create.disabled = busy; create.onclick = createConversation;
    const toolbar = el('header', { className: 'theater-toolbar' }, el('label', {}, document.createTextNode('Role'), roleSelect), el('label', {}, document.createTextNode('Model'), modelSelect), el('label', { className: 'conversation-select' }, document.createTextNode('Conversation'), conversationSelect), create);
    const messages = el('div', { className: 'theater-messages', 'aria-live': 'polite', 'aria-busy': busy ? 'true' : 'false' });
    if (!conversation) {
      messages.append(el('div', { className: 'theater-empty' }, el('img', { src: heroUrl, alt: 'Burrow Theater' }), el('h1', { text: 'A different role. The same conversation.' }), el('p', { text: data.roles.length ? 'Start a chat and speak with a role shaped by its own SOUL.' : 'Create a SOUL role in Settings → Burrow Theater, then start a conversation.' })));
    } else if (!conversation.messages?.length) {
      messages.append(el('div', { className: 'theater-empty' }, el('img', { src: heroUrl, alt: 'Burrow Theater' }), el('h1', { text: role?.name || 'The conversation is ready' }), el('p', { text: role?.summary || 'Say something when you are ready.' })));
    } else {
      for (const message of conversation.messages) messages.append(renderMessage(message, role));
      if (busy) messages.append(el('div', { className: 'theater-message role' }, avatar(role?.avatar, role?.name || 'Role'), el('div', { className: 'theater-message-body' }, el('small', { text: `${role?.name || 'Role'} · Now` }), el('div', { className: 'theater-waiting', role: 'status', text: 'Writing…' }))));
    }
    app.replaceChildren(toolbar, messages);
    if (conversation) {
      const input = el('textarea', { id: 'theater-message', name: 'message', 'aria-label': 'Message', placeholder: `Message ${role?.name || 'this role'}…` });
      input.value = draft; input.disabled = busy;
      input.oninput = () => { draft = input.value; sendButton.disabled = busy || !draft.trim(); };
      input.onkeydown = (event) => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); draft = input.value; void send(); } };
      const sendButton = el('button', { type: 'button', className: 'theater-send', 'aria-label': 'Send message', title: 'Send message' }, el('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, el('path', { d: 'm3 3 18 9-18 9 4-9-4-9Z' }), el('path', { d: 'M7 12h14' })));
      sendButton.disabled = busy || !draft.trim(); sendButton.onclick = send;
      app.append(el('div', { className: 'theater-composer-wrap' }, el('div', { className: 'theater-composer' }, input, el('div', { className: 'theater-compose-footer' }, el('p', { className: 'theater-hint', text: 'Enter to send · Shift+Enter for a new line' }), sendButton)), el('p', { className: `theater-feedback${failed ? ' error' : ''}`, role: failed ? 'alert' : 'status', 'aria-live': 'polite', text: feedback })));
    } else if (feedback) app.append(el('p', { className: `theater-feedback${failed ? ' error' : ''}`, role: failed ? 'alert' : 'status', text: feedback }));
  }
  async function load() {
    app.replaceChildren(el('p', { className: 'theater-feedback', role: 'status', text: 'Loading conversations…' }));
    try {
      const result = await request('/bootstrap');
      if (!result || !Array.isArray(result.models) || !Array.isArray(result.roles) || !Array.isArray(result.conversations)) throw new Error('invalid_bootstrap_response');
      data = { ...data, ...result }; activeId = data.conversations[0]?.id || ''; render();
    } catch (error) {
      if (!mounted || controller.signal.aborted) return;
      const retry = button('Try again', 'primary'); retry.onclick = load;
      app.replaceChildren(el('div', { className: 'theater-load-error', role: 'alert' }, el('strong', { text: 'Theater could not load' }), el('span', { text: errorMessage(error) }), retry));
    }
  }
  void load();
  return () => { mounted = false; controller.abort(); root.replaceChildren(); };
}
