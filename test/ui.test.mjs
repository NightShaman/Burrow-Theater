import test from 'node:test';
import assert from 'node:assert/strict';
import { mountControl } from '../ui/control.js';
import { mountSettings, settingsSections } from '../ui/settings.js';

class FakeNode {
  constructor(tag='#text',text=''){this.tagName=tag.toUpperCase();this.children=[];this.attributes=new Map();this.listeners=new Map();this.parentNode=null;this._text=text;this.value='';this.disabled=false;this.hidden=false;this.className='';this.checked=false;}
  append(...nodes){for(const value of nodes){if(value==='')continue;const child=typeof value==='string'?new FakeNode('#text',value):value;child.parentNode=this;this.children.push(child);}}
  replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  setAttribute(k,v){this.attributes.set(k,String(v));if(k==='type')this.type=String(v);if(k==='id')this.id=String(v);}
  addEventListener(k,v){this.listeners.set(k,v);}
  removeEventListener(k,v){if(this.listeners.get(k)===v)this.listeners.delete(k);}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);}
  querySelector(selector){const all=descendants(this).slice(1);if(selector.startsWith('.'))return all.find(x=>x.className.split(' ').includes(selector.slice(1)))||null;return all.find(x=>x.tagName===selector.toUpperCase())||null;}
  scrollTo(){} click(){} focus(){} reportValidity(){return true;}
  set textContent(v){this._text=String(v);this.children=[];} get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
}
const descendants=node=>[node,...node.children.flatMap(descendants)];
const documentFixture={createElement:tag=>new FakeNode(tag),createTextNode:text=>new FakeNode('#text',text)};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test.beforeEach(()=>{globalThis.document=documentFixture;globalThis.requestAnimationFrame=(fn)=>fn();globalThis.confirm=()=>true;});
test.afterEach(()=>{delete globalThis.document;delete globalThis.requestAnimationFrame;delete globalThis.confirm;});

const bootstrap={ok:true,operator:{name:'Rob',avatar:'R'},models:[{connectionId:'local',model:'stheno',provider:'ollama'}],roles:[{id:'house-goblin',name:'House Goblin',soul:'# SOUL\nA charismatic host.',avatar:'H'}],conversations:[]};
test('control matches the Burrow chat shell with role rail, model toolbar, and a single Theater hero',async()=>{const root=new FakeNode('div');const calls=[];const cleanup=mountControl({root,api:async(path,init)=>{calls.push({path,init});return bootstrap;}});await settle();assert.equal(calls[0].path,'/bootstrap');assert.match(root.textContent,/Roles/);assert.match(root.textContent,/Provider/);assert.match(root.textContent,/Model/);assert.match(root.textContent,/Effort/);assert.match(root.textContent,/Temp/);assert.match(root.textContent,/Group Chat/);assert.match(root.textContent,/New session/);assert.match(root.textContent,/A different role\. The same conversation\./);assert.equal(descendants(root).filter(x=>x.tagName==='IMG'&&x.attributes.get('alt')==='Burrow Theater').length,1);assert.doesNotMatch(root.textContent,/scene|branch|export|regenerate/i);const signal=calls[0].init.signal;cleanup();assert.equal(signal.aborted,true);assert.equal(root.children.length,0);});
test('control renders a familiar transcript and composer without operational machinery',async()=>{const root=new FakeNode('div');mountControl({root,api:async()=>({...bootstrap,conversations:[{id:'c',title:'House Goblin',roleId:'house-goblin',connectionId:'local',model:'stheno',messages:[{id:'u',role:'user',content:'Hello.',createdAt:'2026-10-21T12:00:00Z'},{id:'a',role:'assistant',content:'Welcome in.',createdAt:'2026-10-21T12:00:01Z'}]}]})});await settle();assert.match(root.textContent,/Rob/);assert.match(root.textContent,/House Goblin/);assert.match(root.textContent,/Hello\./);assert.match(root.textContent,/Welcome in\./);assert.ok(descendants(root).some(x=>x.tagName==='TEXTAREA'&&x.attributes.get('aria-label')==='Message'));assert.doesNotMatch(root.textContent,/tools|operational|setup/i);});
test('settings uses primary and overflow surfaces for SOUL roles',async()=>{assert.deepEqual(settingsSections,[{id:'roles',label:'Roles'}]);const primaryRoot=new FakeNode('div');const overflowRoot=new FakeNode('div');const calls=[];const cleanup=mountSettings({section:'roles',primary:{replace:nodes=>primaryRoot.replaceChildren(...(Array.isArray(nodes)?nodes:[nodes]))},overflow:{replace:nodes=>overflowRoot.replaceChildren(...(Array.isArray(nodes)?nodes:[nodes]))},api:async(path,init)=>{calls.push({path,init});return bootstrap;}});await settle();assert.equal(calls[0].path,'/bootstrap');assert.match(primaryRoot.textContent,/Edit House Goblin/);assert.match(primaryRoot.textContent,/SOUL/);assert.match(overflowRoot.textContent,/Saved roles/);assert.match(overflowRoot.textContent,/House Goblin/);assert.doesNotMatch(primaryRoot.textContent,/character card|scene setup/i);const signal=calls[0].init.signal;cleanup();assert.equal(signal.aborted,true);});
