// Uma sessão de reprodução. Nenhuma decisão assíncrona pode reativar uma sessão antiga.
export class AudioEngine {
  constructor({contextFactory,loadBuffer,onState=()=>{},maxCacheBytes=24*1024*1024}={}) {
    this.contextFactory=contextFactory||(()=>new (window.AudioContext||window.webkitAudioContext)());
    this.loadBuffer=loadBuffer||((item,ctx,signal)=>this.decodeItem(item,ctx,signal));
    this.onState=onState; this.maxCacheBytes=maxCacheBytes; this.cache=new Map();
    this.cacheBytes=0; this.volume=.35; this.sequence=0; this.state={phase:'idle',id:null};
    this.blobKeys=new WeakMap();this.nextBlobKey=0;
  }
  emit(state) { this.state=state; this.onState(state); }
  setup() {
    if(this.context)return this.context;
    const ctx=this.contextFactory();
    const compressor=ctx.createDynamicsCompressor(),gain=ctx.createGain();
    // O ganho geral nunca ultrapassa 1; redução moderada de picos antes da saída.
    compressor.threshold.value=-12; compressor.knee.value=12; compressor.ratio.value=3;
    compressor.attack.value=.003; compressor.release.value=.18;
    gain.gain.value=this.volume; compressor.connect(gain); gain.connect(ctx.destination);
    ctx.onstatechange=()=>{if(['suspended','interrupted','closed'].includes(ctx.state)&&this.state.phase==='playing'){
      this.stop(); this.emit({phase:'interrupted',id:null,message:'Áudio interrompido pelo sistema. Toque novamente para retomar.'});
    }};
    this.context=ctx; this.compressor=compressor; this.gain=gain; return ctx;
  }
  setVolume(value) {
    this.volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):.35;
    if(this.gain)this.gain.gain.setTargetAtTime(this.volume,this.context.currentTime,.015);
  }
  stop(notify=true) {
    this.sequence++; this.controller?.abort(); this.controller=null;
    if(this.source){const source=this.source;this.source=null;source.onended=null;
      try{source.stop();}catch{} try{source.disconnect();}catch{}}
    if(notify)this.emit({phase:'idle',id:null});
  }
  async toggle(item) {
    if(this.state.id===item.id&&['loading','playing'].includes(this.state.phase)){this.stop();return;}
    this.stop(false); const session=this.sequence;
    if(item.action==='stop'){this.emit({phase:'idle',id:null,message:'Silêncio dramático: reprodução interrompida.'});return;}
    const controller=new AbortController(); this.controller=controller;
    this.emit({phase:'loading',id:item.id,name:item.name});
    try {
      const ctx=this.setup(); await ctx.resume();
      if(session!==this.sequence)return;
      if(ctx.state!=='running')throw Error('Toque novamente para liberar o áudio neste navegador.');
      const buffer=await this.buffer(item,controller.signal);
      if(session!==this.sequence)return;
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=!!item.loop;
      source.connect(this.compressor);
      source.onended=()=>{if(this.source===source&&session===this.sequence)this.stop();};
      this.source=source;source.start();
      this.emit({phase:'playing',id:item.id,name:item.name,loop:!!item.loop});
    } catch(error) {
      if(session!==this.sequence)return;
      this.stop(false);this.emit({phase:'error',id:item.id,name:item.name,message:audioError(error)});
    }
  }
  key(item){
    let blobKey='';
    if(item.blob){if(!this.blobKeys.has(item.blob))this.blobKeys.set(item.blob,++this.nextBlobKey);blobKey=':blob'+this.blobKeys.get(item.blob);}
    return item.id+':'+(item.revision||item.updatedAt||item.sha256||item.file||'local')+blobKey;
  }
  async buffer(item,signal) {
    const key=this.key(item);
    if(this.cache.has(key)){const entry=this.cache.get(key);this.cache.delete(key);this.cache.set(key,entry);return entry.buffer;}
    const buffer=await this.loadBuffer(item,this.setup(),signal);
    if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
    const bytes=buffer.length*buffer.numberOfChannels*4;
    if(!Number.isFinite(bytes)||!buffer.duration||bytes>64*1024*1024)throw Error('Áudio longo demais para decodificar com segurança neste dispositivo. Use um trecho menor.');
    if(bytes<=this.maxCacheBytes){
      while(this.cacheBytes+bytes>this.maxCacheBytes&&this.cache.size){const oldest=this.cache.keys().next().value;this.cacheBytes-=this.cache.get(oldest).bytes;this.cache.delete(oldest);}
      const previous=this.cache.get(key);if(previous)this.cacheBytes-=previous.bytes;
      this.cache.set(key,{buffer,bytes});this.cacheBytes+=bytes;
    }
    return buffer;
  }
  async decodeItem(item,ctx,signal) {
    let blob=item.blob;
    if(!blob){
      if(!item.file||item.available===false)throw Error('Áudio pendente. Adicione um arquivo autorizado no modo de edição.');
      const response=await fetch(item.file,{signal});
      if(!response.ok)throw Error(response.status===404?'Arquivo ausente no pacote.':'Não foi possível carregar o áudio. Verifique a conexão ou a cópia offline.');
      blob=await response.blob();
    }
    if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
    return ctx.decodeAudioData(await blob.arrayBuffer());
  }
  async validate(blob) {
    const ctx=this.setup();
    const buffer=await ctx.decodeAudioData(await blob.arrayBuffer());
    const bytes=buffer.length*buffer.numberOfChannels*4;
    if(!Number.isFinite(buffer.duration)||buffer.duration<=0||bytes>64*1024*1024)throw Error('Use um áudio menor: o limite de memória decodificada é 64 MB por efeito.');
    return {duration:buffer.duration,sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels};
  }
  async preload(items) {
    // Poucos favoritos curtos, somente depois de uma interação e sem concorrer com um toque.
    if(!this.context||this.context.state!=='running')return;
    const session=this.sequence;
    for(const item of items.slice(0,3)){
      if(session!==this.sequence)return;
      if(item.action||item.available===false||(item.duration||0)>8)continue;
      try{await this.buffer(item);}catch{}
    }
  }
}
export function audioError(error) {
  if(error?.name==='TypeError'||error?.name==='NetworkError')return 'Não foi possível carregar o áudio. Confira a conexão e a disponibilidade offline.';
  if(error?.name==='InvalidStateError')return 'A saída de áudio foi interrompida pelo navegador. Recarregue a página e toque novamente.';
  if(error?.name==='NotAllowedError')return 'O navegador bloqueou o áudio. Toque novamente para permitir a reprodução.';
  if(error?.name==='EncodingError'||error?.name==='NotSupportedError')return 'Áudio inválido ou formato incompatível. Experimente MP3 ou WAV.';
  if(error?.name==='AbortError')return 'Reprodução cancelada.';
  return error?.message||'Não foi possível reproduzir este áudio.';
}
