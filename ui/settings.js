export const settingsSections = [{ id: 'roles', label: 'Roles' }];

const styles = `
.theater-role-settings{display:grid;gap:14px}.theater-role-settings *{box-sizing:border-box}.theater-role-settings textarea{width:100%;min-height:320px;padding:10px;border:1px solid var(--line);border-radius:6px;resize:vertical;background:var(--surface-input);color:var(--text);font:inherit;line-height:1.5}.theater-role-settings textarea:focus,.theater-role-settings input:focus{border-color:var(--accent);outline:0;box-shadow:0 0 0 3px var(--accent-subtle)}.theater-role-settings input{width:100%;min-height:34px;padding:0 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface-input);color:var(--text);font:inherit}.theater-role-form{display:grid;gap:4px}.theater-role-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line-soft)}.theater-role-actions>div{display:flex;gap:7px}.theater-role-feedback{margin:0;color:var(--muted);font-size:12px}.theater-role-feedback.error{color:var(--danger)}.theater-role-list{display:grid;gap:8px}.theater-role-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:7px;background:var(--panel)}.theater-role-card.active{border-color:var(--accent-border);background:var(--accent-subtle)}.theater-role-select{display:block;min-width:0;flex:1;padding:0;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;font:inherit}.theater-role-select strong,.theater-role-select small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.theater-role-select small{margin-top:3px;color:var(--muted);font-size:11px}.theater-role-delete{display:grid;width:28px;height:28px;flex:0 0 auto;place-items:center;padding:0;border:0;border-radius:5px;background:transparent;color:var(--muted);font-size:20px;cursor:pointer}.theater-role-delete:hover{background:var(--danger-hover);color:var(--danger)}.theater-role-empty{display:grid;min-height:100px;place-items:center;margin:0;color:var(--muted);text-align:center}@media(max-width:620px){.theater-role-settings textarea{min-height:250px}.theater-role-actions{align-items:stretch;flex-direction:column}.theater-role-actions>div{display:grid;grid-template-columns:1fr 1fr}.theater-role-actions button{width:100%}}
`;
function el(tag, attrs = {}, ...children) { const node = document.createElement(tag); for (const [name, value] of Object.entries(attrs)) { if (name === 'className') node.className = value; else if (name === 'text') node.textContent = value; else if (name === 'htmlFor') node.htmlFor = value; else node.setAttribute(name, value); } node.append(...children); return node; }
function button(label, className = '') { return el('button', { type: 'button', className, text: label }); }
function message(error) { const code = error instanceof Error ? error.message : ''; const known = { role_in_use: 'This role still has conversations. Delete those conversations before deleting the role.', role_not_found: 'That role no longer exists.' }; return known[code] || (code ? code.replaceAll('_', ' ') : 'The role could not be saved.'); }
function summary(soul) { const line = String(soul || '').split('\n').map((item) => item.trim()).find((item) => item && !item.startsWith('#')); return line || 'SOUL role'; }

export function mountSettings({ section, primary, overflow, api }) {
  if (section !== 'roles') return;
  const controller = new AbortController(); let mounted = true; let roles = []; let selectedId = ''; let loading = true; let busy = false; let feedback = ''; let failed = false;
  const style = el('style', { text: styles }); const panel = el('section', { className: 'setting-section theater-role-settings', 'aria-labelledby': 'theater-roles-heading' }); const inventory = el('div', { className: 'theater-role-settings' });
  primary.replace([style, panel]); if (overflow) overflow.replace(inventory);
  const request = (path, init = {}) => api(path, { ...init, signal: controller.signal, headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } });
  const selected = () => roles.find((item) => item.id === selectedId) || null;
  const blank = () => { selectedId = ''; feedback = ''; failed = false; render(); };
  async function save(name, soul) {
    const current = selected(); busy = true; feedback = 'Saving role…'; failed = false; render();
    try {
      const result = await request(current ? `/roles/${current.id}` : '/roles', { method: current ? 'PUT' : 'POST', body: JSON.stringify({ name, soul }) });
      if (!result?.role) throw new Error('invalid_role_response');
      roles = current ? roles.map((item) => item.id === current.id ? result.role : item) : [...roles, result.role]; selectedId = result.role.id; feedback = `${result.role.name} saved.`;
    } catch (error) { feedback = message(error); failed = true; }
    finally { busy = false; render(); }
  }
  async function remove(role) {
    if (!confirm(`Delete “${role.name}”? This cannot be undone.`)) return;
    busy = true; feedback = 'Deleting role…'; failed = false; render();
    try { await request(`/roles/${role.id}`, { method: 'DELETE' }); roles = roles.filter((item) => item.id !== role.id); if (selectedId === role.id) selectedId = ''; feedback = `${role.name} deleted.`; }
    catch (error) { feedback = message(error); failed = true; }
    finally { busy = false; render(); }
  }
  function renderInventory() {
    const list = el('div', { className: 'theater-role-list' });
    if (loading) list.append(el('p', { className: 'theater-role-empty', text: 'Loading roles…' }));
    else if (!roles.length) list.append(el('p', { className: 'theater-role-empty', text: 'No SOUL roles yet.' }));
    else for (const role of roles) {
      const choose = button('', 'theater-role-select'); choose.setAttribute('aria-pressed', role.id === selectedId ? 'true' : 'false'); choose.disabled = busy; choose.append(el('strong', { text: role.name }), el('small', { text: summary(role.soul) })); choose.onclick = () => { selectedId = role.id; feedback = ''; failed = false; render(); };
      const removeButton = button('×', 'theater-role-delete'); removeButton.setAttribute('aria-label', `Delete ${role.name}`); removeButton.disabled = busy; removeButton.onclick = () => remove(role);
      list.append(el('article', { className: `theater-role-card${role.id === selectedId ? ' active' : ''}` }, choose, removeButton));
    }
    inventory.replaceChildren(el('section', { className: 'setting-section', 'aria-labelledby': 'theater-saved-roles-heading' }, el('h2', { id: 'theater-saved-roles-heading', text: 'Saved roles' }), el('p', { className: 'settings-description', text: 'Select a role to edit its SOUL.' }), list));
  }
  function render() {
    if (!mounted) return;
    const current = selected();
    const name = el('input', { id: 'theater-role-name', name: 'name', type: 'text', required: '', maxlength: '120', autocomplete: 'off' }); name.value = current?.name || ''; name.disabled = busy;
    const soul = el('textarea', { id: 'theater-role-soul', name: 'soul', required: '', maxlength: '48000', rows: '16', placeholder: '# SOUL\n\nWho this role is, how they speak, what they value, and the boundaries of the fiction.' }); soul.value = current?.soul || ''; soul.disabled = busy;
    const create = button('New role', 'secondary'); create.disabled = busy; create.onclick = blank;
    const saveButton = el('button', { type: 'submit', className: 'primary', text: busy ? 'Saving…' : current ? 'Save role' : 'Create role' }); saveButton.disabled = busy;
    const form = el('form', { className: 'theater-role-form' }, el('label', { className: 'field', htmlFor: name.id }, document.createTextNode('Role name'), name), el('label', { className: 'field', htmlFor: soul.id }, document.createTextNode('SOUL'), soul, el('small', { className: 'settings-help', text: 'Use the same SOUL-style Markdown you use for a Burrow agent. Theater adds only the fictional boundary; it does not add tools or operational context.' })), el('div', { className: 'theater-role-actions' }, el('p', { className: `theater-role-feedback${failed ? ' error' : ''}`, role: failed ? 'alert' : 'status', 'aria-live': 'polite', text: feedback }), el('div', {}, create, saveButton)));
    form.onsubmit = (event) => { event.preventDefault(); if (!form.reportValidity()) return; void save(name.value.trim(), soul.value.trim()); };
    panel.replaceChildren(el('h2', { id: 'theater-roles-heading', text: current ? `Edit ${current.name}` : 'New role' }), el('p', { className: 'settings-description', text: 'A Theater role is a name and a SOUL. Conversations use this identity without Burrow tools, workspace context, or operational instructions.' }), form);
    renderInventory();
  }
  async function load() {
    render();
    try { const result = await request('/bootstrap'); if (!result || !Array.isArray(result.roles)) throw new Error('invalid_bootstrap_response'); roles = result.roles; selectedId = roles[0]?.id || ''; }
    catch (error) { if (!controller.signal.aborted) { feedback = message(error); failed = true; } }
    finally { loading = false; render(); }
  }
  void load();
  return () => { mounted = false; controller.abort(); panel.remove(); style.remove(); inventory.remove(); };
}
