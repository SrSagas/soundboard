import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {OfflineManager} from '../js/offline.js';
test('uma falha de verificação não pode aparecer como biblioteca conferida',()=>{
  let visible;const manager=new OfflineManager({onStatus:s=>visible=s});
  manager.display({shellReady:true,cached:1,total:1,bytes:50},{verified:true,errors:['Áudio inválido']});
  assert.equal(visible.ready,false);assert.doesNotMatch(visible.badge,/conferidos/);
});
test('cache corrompido reprovado é removido e não conta como disponível offline',async()=>{
  const listeners=new Map(),maps=new Map();
  const storage={async open(name){if(!maps.has(name)){const entries=new Map();maps.set(name,{async match(k){return entries.get(String(k))?.clone();},async put(k,v){entries.set(String(k),v.clone());},async delete(k){return entries.delete(String(k));}});}return maps.get(name);},async keys(){return [...maps.keys()];},async delete(k){return maps.delete(k);},async match(k,{cacheName}){return (await this.open(cacheName)).match(k);}};
  const hash=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const core=[{path:'index.html',sha256:await hash('app')}],audio=[{path:'sons/teste.mp3?v=123',sha256:await hash('real'),bytes:4,name:'Teste'}];
  const scope='http://localhost/soundboard/',key=btoa('/soundboard/').replace(/[^a-z0-9]/gi,'');
  await (await storage.open('soundboard-v12-shell-'+key+'-test')).put(scope+'index.html',new Response('app'));
  const media=await storage.open('soundboard-v12-media-'+key);await media.put(scope+audio[0].path,new Response('corrompido'));
  const source=(await readFile(new URL('../work/sw.template.js',import.meta.url),'utf8')).replace('__BUILD__','"test"').replace('__CORE__',JSON.stringify(core)).replace('__AUDIO__',JSON.stringify(audio));
  const scopeObject={registration:{scope},location:{origin:'http://localhost'},addEventListener:(name,fn)=>listeners.set(name,fn)};
  vm.runInNewContext(source,{self:scopeObject,caches:storage,URL,btoa,crypto,Response,fetch:async()=>{throw Error('Offline');}});
  const messages=[];let work;listeners.get('message')({data:{type:'PREPARE'},ports:[{postMessage:m=>messages.push(m)}],waitUntil:p=>work=p});await work;
  assert.equal(messages.at(-1).cached,0);assert.equal(messages.at(-1).errors.length,1);
  assert.equal(await media.match(scope+audio[0].path),undefined);
});
