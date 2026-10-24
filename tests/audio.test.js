import test from 'node:test';
import assert from 'node:assert/strict';
let AudioEngine,audioError;
try { ({ AudioEngine,audioError } = await import('../js/audio.js')); } catch {}
function deferred() { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; }
function fixture(loadBuffer) {
  assert.equal(typeof AudioEngine, 'function', 'O motor de áudio precisa existir');
  const sources=[], states=[];
  const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});
  const node=()=>({connect(){},disconnect(){},gain:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()});
  const context={state:'running',currentTime:0,destination:{},resume:async()=>{},createGain:node,createDynamicsCompressor:node,
    createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;},onended:null}; sources.push(s); return s;}};
  const engine=new AudioEngine({contextFactory:()=>context,loadBuffer,onState:s=>states.push(s),maxCacheBytes:40});
  return {engine,context,sources,states};
}
const buffer={length:2,numberOfChannels:1,sampleRate:44100,duration:.1};
test('efeitos diferentes iniciam juntos mesmo com carregamentos fora de ordem',async()=>{
  const a=deferred(),b=deferred(); const f=fixture(i=>i.id==='a'?a.promise:b.promise);
  const first=f.engine.toggle({id:'a',name:'Primeiro'}),last=f.engine.toggle({id:'b',name:'Último'});
  b.resolve(buffer); await last; a.resolve(buffer); await first;
  assert.equal(f.sources.filter(s=>s.started&&!s.stopped).length,2);
  assert.deepEqual(new Set(f.engine.state.voices.map(v=>v.id)),new Set(['a','b'])); assert.equal(f.engine.state.phase,'playing');
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
test('término de um som não interrompe o outro nem seu loop',async()=>{
  const f=fixture(async()=>buffer); await f.engine.toggle({id:'a',name:'A'});
  const old=f.sources[0],oldEnd=old.onended; await f.engine.toggle({id:'b',name:'B',loop:true});
  assert.notEqual(old.stopped,true);oldEnd?.();assert.notEqual(f.sources[1].stopped,true);assert.equal(f.engine.state.id,'b');assert.equal(f.sources[1].loop,true);
  f.sources[1].onended(); assert.equal(f.engine.state.phase,'idle');
});
test('toque no ativo interrompe apenas sua fonte e o outro continua',async()=>{
  const f=fixture(async()=>buffer);await f.engine.toggle({id:'a',name:'A',loop:true});await f.engine.toggle({id:'b',name:'B',loop:true});
  await f.engine.toggle({id:'a',name:'A'});
  assert.equal(f.sources[0].stopped,true);assert.notEqual(f.sources[1].stopped,true);assert.equal(f.engine.state.phase,'playing');assert.equal(f.engine.state.id,'b');
});
test('cancelar um carregamento preserva o outro e sua reprodução',async()=>{
  const a=deferred(),b=deferred(),signals=new Map();const f=fixture((item,ctx,signal)=>{signals.set(item.id,signal);return item.id==='a'?a.promise:b.promise;});
  const first=f.engine.toggle({id:'a',name:'A'}),second=f.engine.toggle({id:'b',name:'B'});await Promise.resolve();
  const cancel=f.engine.toggle({id:'a',name:'A'});b.resolve(buffer);a.resolve(buffer);await Promise.all([first,second,cancel]);
  assert.equal(signals.get('a').aborted,true);assert.equal(signals.get('b').aborted,false);assert.equal(f.sources.length,1);assert.equal(f.engine.state.id,'b');
});
test('um carregamento antigo do mesmo ID não substitui a fonte reiniciada',async()=>{
  const a=deferred(),b=deferred();let loads=0;const f=fixture(()=>++loads===1?a.promise:b.promise);
  const first=f.engine.toggle({id:'a',name:'Antigo'});await Promise.resolve();await f.engine.toggle({id:'a',name:'Antigo'});
  const restarted=f.engine.toggle({id:'a',name:'Novo'});b.resolve(buffer);await restarted;a.resolve(buffer);await first;
  assert.equal(f.sources.length,1);assert.equal(f.engine.state.name,'Novo');assert.notEqual(f.sources[0].stopped,true);
});
test('PARAR cancela todas as fontes e cargas sem reinício tardio',async()=>{
  const wait=deferred();const f=fixture(item=>item.id==='c'?wait.promise:Promise.resolve(buffer));
  await f.engine.toggle({id:'a',name:'A',loop:true});await f.engine.toggle({id:'b',name:'B',loop:true});const pending=f.engine.toggle({id:'c',name:'C'});
  f.engine.stop();wait.resolve(buffer);await pending;
  assert.equal(f.sources.length,2);assert.ok(f.sources.every(s=>s.stopped));assert.equal(f.engine.state.phase,'idle');assert.deepEqual(f.engine.state.voices,[]);
});
test('falha de um novo efeito não interrompe os que já estão tocando',async()=>{
  const f=fixture(item=>item.id==='b'?Promise.reject(new Error('Falha B')):Promise.resolve(buffer));
  await f.engine.toggle({id:'a',name:'A',loop:true});await f.engine.toggle({id:'b',name:'B'});
  assert.equal(f.engine.state.phase,'playing');assert.equal(f.engine.state.id,'a');assert.notEqual(f.sources[0].stopped,true);assert.match(f.engine.state.error.message,/Falha B/);
});
test('Silêncio dramático interrompe todos os efeitos da mistura',async()=>{
  const f=fixture(async()=>buffer);await f.engine.toggle({id:'a',name:'A'});await f.engine.toggle({id:'b',name:'B'});await f.engine.toggle({id:'silence',name:'Silêncio',action:'stop'});
  assert.ok(f.sources.every(s=>s.stopped));assert.equal(f.engine.state.phase,'idle');assert.deepEqual(f.engine.state.voices,[]);
});
test('interrupção do navegador encerra a mistura inteira',async()=>{
  const f=fixture(async()=>buffer);await f.engine.toggle({id:'a',name:'A'});await f.engine.toggle({id:'b',name:'B'});f.context.state='suspended';f.context.onstatechange();
  assert.ok(f.sources.every(s=>s.stopped));assert.equal(f.engine.state.phase,'interrupted');assert.deepEqual(f.engine.state.voices,[]);
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
