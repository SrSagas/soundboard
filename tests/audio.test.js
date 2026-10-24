import test from 'node:test';
import assert from 'node:assert/strict';
let AudioEngine,audioError;
try { ({ AudioEngine,audioError } = await import('../js/audio.js')); } catch {}
function deferred() { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; }
function fixture(loadBuffer) {
  assert.equal(typeof AudioEngine, 'function', 'O motor de sessão única precisa existir');
  const sources=[], states=[];
  const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});
  const node=()=>({connect(){},disconnect(){},gain:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()});
  const context={state:'running',currentTime:0,destination:{},resume:async()=>{},createGain:node,createDynamicsCompressor:node,
    createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;},onended:null}; sources.push(s); return s;}};
  const engine=new AudioEngine({contextFactory:()=>context,loadBuffer,onState:s=>states.push(s),maxCacheBytes:40});
  return {engine,context,sources,states};
}
const buffer={length:2,numberOfChannels:1,sampleRate:44100,duration:.1};
test('apenas a última seleção pode iniciar após carregamentos fora de ordem',async()=>{
  const a=deferred(),b=deferred(); const f=fixture(i=>i.id==='a'?a.promise:b.promise);
  const first=f.engine.toggle({id:'a',name:'Primeiro'}),last=f.engine.toggle({id:'b',name:'Último'});
  b.resolve(buffer); await last; a.resolve(buffer); await first;
  assert.equal(f.sources.filter(s=>s.started&&!s.stopped).length,1);
  assert.equal(f.engine.state.id,'b'); assert.equal(f.engine.state.phase,'playing');
});
test('segundo toque no mesmo efeito cancela inclusive o carregamento',async()=>{
  const wait=deferred(); const f=fixture(()=>wait.promise);
  const first=f.engine.toggle({id:'a',name:'Sino'}); await f.engine.toggle({id:'a',name:'Sino'});
  wait.resolve(buffer); await first;
  assert.equal(f.engine.state.phase,'idle'); assert.equal(f.sources.length,0);
});
test('PARAR invalida uma decodificação em andamento',async()=>{
  const wait=deferred(); const f=fixture(()=>wait.promise); const pending=f.engine.toggle({id:'a',name:'Áudio'});
  f.engine.stop(); wait.resolve(buffer); await pending;
  assert.equal(f.engine.state.phase,'idle'); assert.equal(f.sources.length,0);
});
test('troca interrompe a fonte anterior e término antigo não interrompe a nova',async()=>{
  const f=fixture(async()=>buffer); await f.engine.toggle({id:'a',name:'A'});
  const old=f.sources[0],oldEnd=old.onended; await f.engine.toggle({id:'b',name:'B',loop:true}); oldEnd?.();
  assert.equal(old.stopped,true); assert.equal(f.engine.state.id,'b'); assert.equal(f.sources[1].loop,true);
  f.sources[1].onended(); assert.equal(f.engine.state.phase,'idle');
});
test('reutiliza áudio decodificado e troca a versão após substituir o arquivo',async()=>{
  let loads=0; const f=fixture(async()=>{loads++;return buffer;});
  await f.engine.toggle({id:'a',name:'A',revision:'1'}); f.engine.stop();
  await f.engine.toggle({id:'a',name:'A',revision:'1'}); f.engine.stop();
  assert.equal(loads,1); await f.engine.toggle({id:'a',name:'A',revision:'2'}); assert.equal(loads,2);
});
test('falha de decodificação mantém o cartão fora do estado tocando',async()=>{
  const f=fixture(async()=>{throw new Error('Arquivo inválido');});
  await f.engine.toggle({id:'a',name:'A'});
  assert.equal(f.engine.state.phase,'error'); assert.equal(f.sources.length,0);
});
test('volume fica entre zero e um, sem amplificação digital',()=>{
  const f=fixture(async()=>buffer); f.engine.setVolume(4); assert.equal(f.engine.volume,1);
  f.engine.setVolume(-5); assert.equal(f.engine.volume,0);
});
test('dois arquivos diferentes com a mesma data e revisão não compartilham PCM',async()=>{
  let loads=0;const f=fixture(async()=>{loads++;return {...buffer,duration:loads};});
  await f.engine.toggle({id:'preview:1',name:'Prévia',revision:'mesma-data',blob:new Blob(['A'])});f.engine.stop();
  await f.engine.toggle({id:'preview:1',name:'Prévia',revision:'mesma-data',blob:new Blob(['B'])});
  assert.equal(loads,2);assert.equal(f.sources[1].buffer.duration,2);
});
test('falhas de rede nativas chegam à interface em português',()=>{
  assert.match(audioError(new TypeError('Failed to fetch')),/conexão|carregar|áudio/i);
  assert.doesNotMatch(audioError(new TypeError('Failed to fetch')),/Failed|fetch/);
});
