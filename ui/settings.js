export const settingsSections = [{ id: 'characters', label: 'Characters' }];

const styles = `
.bt-settings{display:grid;gap:14px}.bt-settings *{box-sizing:border-box}.bt-settings-header{display:flex;align-items:start;justify-content:space-between;gap:14px}.bt-settings-header h2{margin:0}.bt-settings-header p{margin:5px 0 0;color:var(--muted);font-size:12px;line-height:1.45}.bt-settings button,.bt-settings input,.bt-settings textarea{font:inherit}.bt-settings button{cursor:pointer}.bt-settings button:focus-visible,.bt-settings input:focus-visible,.bt-settings textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.bt-settings-list{display:grid;gap:8px}.bt-character{padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--panel)}.bt-character-head{display:flex;align-items:start;justify-content:space-between;gap:12px}.bt-character h3{margin:0;font-size:14px}.bt-character p{display:-webkit-box;overflow:hidden;margin:5px 0 0;color:var(--muted);font-size:12px;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.bt-character-actions{display:flex;flex:0 0 auto;gap:7px}.bt-settings .bt-danger{color:var(--danger)}.bt-settings-empty{padding:18px;border:1px dashed var(--line);border-radius:8px;color:var(--muted);text-align:center}.bt-settings-feedback{min-height:18px;margin:0;color:var(--muted);font-size:11px}.bt-settings-feedback.error{color:var(--danger)}.bt-settings-layer{position:fixed;z-index:1000;inset:0;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.7);backdrop-filter:blur(6px)}.bt-settings-dialog{width:min(680px,100%);max-height:88vh;overflow:auto;padding:20px;border:1px solid var(--line);border-radius:12px;background:var(--surface,#17131d);color:var(--text);box-shadow:0 25px 80px rgba(0,0,0,.55)}.bt-settings-dialog h2{margin:0 0 4px}.bt-settings-dialog>p{margin:0 0 16px;color:var(--muted);font-size:12px}.bt-settings-grid{display:grid;gap:12px}.bt-settings-field{display:grid;gap:5px;color:var(--text);font-size:12px;font-weight:700}.bt-settings-field input,.bt-settings-field textarea{width:100%;padding:8px 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface-input);color:var(--text)}.bt-settings-field textarea{min-height:90px;resize:vertical}.bt-settings-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}@media(max-width:620px){.bt-settings-header,.bt-character-head{display:grid}.bt-character-actions{justify-content:flex-start}.bt-settings-header button{justify-self:start}}
`;
function element(tag, attrs = {}, ...children) { const node = document.createElement(tag); for (const [name, value] of Object.entries(attrs)) { if (name === 'className') node.className = value; else if (name === 'text') node.textContent = value; else if (name === 'htmlFor') node.htmlFor = value; else node.setAttribute(name, value); } node.append(...children); return node; }
function button(label, className = '') { return element('button', { type: 'button', className, text: label }); }
function control(name, value, multiline = true) { const node = multiline ? element('textarea', { name, rows: '4' }) : element('input', { name, type: 'text', autocomplete: 'off' }); node.value = value || ''; return node; }
function field(label, node) { return element('label', { className: 'bt-settings-field' }, document.createTextNode(label), node); }
function message(error) { const code = error instanceof Error ? error.message : ''; const known = { character_in_use: 'This character is still used by a scene. Reassign or delete those scenes first.', character_not_found: 'That character no longer exists.' }; return known[code] || (code ? code.replaceAll('_', ' ') : 'The character could not be saved.'); }

export function mountSettings({ section, primary, api }) {
  if (section !== 'characters') return;
  const controller = new AbortController();
  let mounted = true;
  let characters = [];
  let loading = true;
  let feedback = '';
  let feedbackError = false;
  const style = element('style', { text: styles });
  const app = element('section', { className: 'setting-section bt-settings', 'aria-labelledby': 'bt-settings-title' });
  primary.replace([style, app]);
  const request = (path, init = {}) => api(path, { ...init, signal: controller.signal, headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } });

  function showEditor(existing = null) {
    const layer = element('div', { className: 'bt-settings-layer' });
    const form = element('form', { className: 'bt-settings-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'bt-character-dialog-title' });
    const values = [
      ['Name', 'name', false, existing?.name],
      ['Premise and identity', 'premise', true, existing?.premise],
      ['Core nature and personality', 'personality', true, existing?.personality],
      ['Voice and forms of address', 'voice', true, existing?.voice],
      ['Rituals and characteristic behaviors', 'rituals', true, existing?.rituals],
      ['Behavior, pacing, and failure boundaries', 'principles', true, existing?.principles],
    ];
    const grid = element('div', { className: 'bt-settings-grid' });
    for (const [label, name, multiline, value] of values) { const input = control(name, value, multiline); input.maxLength = name === 'name' ? 120 : 24000; if (name !== 'rituals') input.required = true; grid.append(field(label, input)); }
    const cancel = button('Cancel');
    const save = element('button', { type: 'submit', className: 'primary', text: existing ? 'Save character' : 'Create character' });
    const status = element('p', { className: 'bt-settings-feedback', role: 'status', 'aria-live': 'polite' });
    form.append(element('h2', { id: 'bt-character-dialog-title', text: existing ? `Edit ${existing.name}` : 'Create a character' }), element('p', { text: 'This card shapes the character in every scene that uses it.' }), grid, status, element('div', { className: 'bt-settings-dialog-actions' }, cancel, save));
    layer.append(form); app.append(layer);
    const close = () => layer.remove();
    cancel.onclick = close; layer.onclick = (event) => { if (event.target === layer) close(); }; layer.onkeydown = (event) => { if (event.key === 'Escape') close(); };
    form.onsubmit = async (event) => {
      event.preventDefault(); if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      save.disabled = true; cancel.disabled = true; save.textContent = 'Saving…';
      try {
        const body = Object.fromEntries(new FormData(form));
        const result = await request(existing ? `/characters/${existing.id}` : '/characters', { method: existing ? 'PUT' : 'POST', body: JSON.stringify(body) });
        characters = existing ? characters.map((item) => item.id === existing.id ? result.character : item) : [...characters, result.character];
        feedback = existing ? `${result.character.name} updated.` : `${result.character.name} created.`; feedbackError = false; close(); render();
      } catch (error) { status.textContent = message(error); status.className = 'bt-settings-feedback error'; status.setAttribute('role', 'alert'); save.disabled = false; cancel.disabled = false; save.textContent = existing ? 'Save character' : 'Create character'; }
    };
  }
  async function removeCharacter(character) {
    if (!confirm(`Delete “${character.name}”? Characters used by scenes cannot be deleted.`)) return;
    feedback = 'Deleting character…'; feedbackError = false; render();
    try { await request(`/characters/${character.id}`, { method: 'DELETE' }); characters = characters.filter((item) => item.id !== character.id); feedback = `${character.name} deleted.`; }
    catch (error) { feedback = message(error); feedbackError = true; }
    render();
  }
  function render() {
    if (!mounted) return;
    const add = button('New character', 'primary'); add.disabled = loading; add.onclick = () => showEditor();
    const list = element('div', { className: 'bt-settings-list' });
    if (loading) list.append(element('p', { className: 'bt-settings-empty', text: 'Loading the cast…' }));
    else if (!characters.length) list.append(element('p', { className: 'bt-settings-empty', text: 'No characters yet. Create one to begin a scene.' }));
    else for (const character of characters) {
      const edit = button('Edit'); edit.onclick = () => showEditor(character);
      const remove = button('Delete', 'bt-danger'); remove.onclick = () => removeCharacter(character);
      list.append(element('article', { className: 'bt-character' }, element('div', { className: 'bt-character-head' }, element('div', {}, element('h3', { text: character.name }), element('p', { text: character.premise })), element('div', { className: 'bt-character-actions' }, edit, remove))));
    }
    app.replaceChildren(element('div', { className: 'bt-settings-header' }, element('div', {}, element('h2', { id: 'bt-settings-title', text: 'Characters' }), element('p', { text: 'Create and refine reusable character cards. Scene setup and conversation stay on the Theater main screen.' })), add), list, element('p', { className: `bt-settings-feedback${feedbackError ? ' error' : ''}`, role: feedbackError ? 'alert' : 'status', 'aria-live': 'polite', text: feedback }));
  }
  async function load() {
    render();
    try { const result = await request('/bootstrap'); if (!result || !Array.isArray(result.characters)) throw new Error('invalid_bootstrap_response'); characters = result.characters; feedback = ''; }
    catch (error) { if (!controller.signal.aborted) { feedback = message(error); feedbackError = true; } }
    finally { loading = false; render(); }
  }
  void load();
  return () => { mounted = false; controller.abort(); app.remove(); style.remove(); };
}
