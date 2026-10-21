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
class FakeFragment extends FakeNode{constructor(){super('#fragment');}}
const descendants=node=>[node,...node.children.flatMap(descendants)];
const documentFixture={createElement:tag=>new FakeNode(tag),createTextNode:text=>new FakeNode('#text',text),createDocumentFragment:()=>new FakeFragment()};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test.beforeEach(()=>{globalThis.document=documentFixture;globalThis.requestAnimationFrame=(fn)=>fn();globalThis.confirm=()=>true;});
test.afterEach(()=>{delete globalThis.document;delete globalThis.requestAnimationFrame;delete globalThis.confirm;});

test('control loads the focused private stage and cleans up',async()=>{const root=new FakeNode('div');const calls=[];const cleanup=mountControl({root,api:async(path,init)=>{calls.push({path,init});return{ok:true,models:[{connectionId:'local',model:'stheno',provider:'ollama'}],characters:[{id:'house-goblin',name:'House Goblin'}],scenes:[]};}});await settle();assert.equal(calls[0].path,'/bootstrap');assert.match(root.textContent,/BURROW THEATER/i);assert.match(root.textContent,/without tools, operational context/i);assert.match(root.textContent,/managed in Settings/i);const signal=calls[0].init.signal;cleanup();assert.equal(signal.aborted,true);assert.equal(root.children.length,0);});
test('control renders persisted transcript with stage directions and scene controls',async()=>{const root=new FakeNode('div');mountControl({root,api:async()=>({ok:true,models:[{connectionId:'local',model:'stheno',provider:'ollama'}],characters:[{id:'c',name:'Kajira'}],scenes:[{id:'s',title:'The chamber',characterId:'c',connectionId:'local',model:'stheno',scenario:'',notes:'',messages:[{id:'m',role:'character',content:'*kneels* Welcome.'}]}]})});await settle();assert.match(root.textContent,/The chamber/);assert.match(root.textContent,/Kajira/);assert.match(root.textContent,/Edit from here/);assert.match(root.textContent,/Regenerate/);assert.ok(descendants(root).some(x=>x.tagName==='EM'));});
test('settings owns reusable character management and cleans up',async()=>{assert.deepEqual(settingsSections,[{id:'characters',label:'Characters'}]);const root=new FakeNode('div');const calls=[];const cleanup=mountSettings({section:'characters',primary:{replace:nodes=>root.replaceChildren(...(Array.isArray(nodes)?nodes:[nodes]))},api:async(path,init)=>{calls.push({path,init});return{ok:true,characters:[{id:'c',name:'The House Goblin',premise:'A charismatic host.'}]};}});await settle();assert.equal(calls[0].path,'/bootstrap');assert.match(root.textContent,/Characters/);assert.match(root.textContent,/reusable character cards/i);assert.match(root.textContent,/The House Goblin/);assert.match(root.textContent,/New character/);const signal=calls[0].init.signal;cleanup();assert.equal(signal.aborted,true);});
