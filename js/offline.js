export class OfflineManager {
  constructor({onStatus,onUpdate}){this.onStatus=onStatus;this.onUpdate=onUpdate;this.busy=false;}
  unsupported(message){this.onStatus({badge:'Uso offline indisponível',detail:message,ready:false,supported:false});}
  async start(){
    if(!('serviceWorker' in navigator)||!window.isSecureContext){this.unsupported('Abra a Soundboard por HTTPS ou localhost para preparar o uso offline.');return;}
    try{
      this.registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      if(this.registration.waiting)this.onUpdate();
      this.registration.addEventListener('updatefound',()=>{
        const worker=this.registration.installing;
        worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)this.onUpdate();});
      });
      await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('A preparação do aplicativo offline não terminou. Confira a conexão e recarregue.')),20000))]);
      this.registration=await navigator.serviceWorker.getRegistration();
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(this.updating)location.reload();else void this.check();});
      await this.check();
    }catch(error){this.unsupported(error.message||'O navegador não permitiu o cache offline.');}
  }
  async request(type){
    const worker=this.registration?.active;
    if(!worker)throw Error('O aplicativo ainda não está preparado para uso offline. Recarregue e tente novamente.');
    return new Promise((resolve,reject)=>{
      const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(Error('A conferência offline não respondeu. Tente recarregar.'));},15000);
      channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();event.data.error?reject(Error(event.data.error)):resolve(event.data);};
      worker.postMessage({type},[channel.port2]);
    });
  }
  display(data,extra={}){
    const errors=extra.errors||data.errors||[];
    const ready=data.shellReady&&data.cached===data.total&&errors.length===0;
    this.onStatus({supported:true,ready,total:data.total,done:data.cached,megabytes:(data.bytes/1048576).toFixed(1),busy:this.busy,
      badge:ready?`Offline: ${data.cached}/${data.total} áudios conferidos`:`Offline: ${data.cached}/${data.total} áudios armazenados`,
      detail:(ready?'Conferido: ':'Ainda faltam arquivos: ')+`aplicativo ${data.shellReady?'armazenado':'incompleto'}, ${data.cached} de ${data.total} áudios oficiais (${(data.bytes/1048576).toFixed(1)} MB no pacote). `+(ready?'Ícones e teste de áudio incluídos. Os arquivos locais permanecem no IndexedDB.':'Use Preparar uso offline e aguarde a conferência terminar.')+(errors.length?' Falhas: '+errors.join('; '):''),...extra});
  }
  async check(){
    if(this.busy||!this.registration?.active)return;
    try{this.display(await this.request('STATUS'));}catch(error){this.unsupported(error.message);}
  }
  async prepare(){
    if(this.busy)return;this.busy=true;
    try{
      const worker=this.registration?.active;if(!worker)throw Error('Aguarde o aplicativo terminar de armazenar os recursos essenciais e tente novamente.');
      await new Promise((resolve,reject)=>{
        const channel=new MessageChannel();let timer;
        const renew=()=>{clearTimeout(timer);timer=setTimeout(()=>{channel.port1.close();reject(Error('O download offline não respondeu. Sua parte já armazenada foi preservada.'));},45000);};renew();
        channel.port1.onmessage=event=>{renew();const data=event.data;
          if(data.error){clearTimeout(timer);channel.port1.close();reject(Error(data.error));return;}
          this.display(data,{verified:!!data.finished,errors:data.errors||[]});
          if(data.finished){clearTimeout(timer);channel.port1.close();resolve();}
        };worker.postMessage({type:'PREPARE'},[channel.port2]);
      });
    }finally{this.busy=false;await this.check();}
  }
  applyUpdate(){const worker=this.registration?.waiting;if(worker){this.updating=true;worker.postMessage({type:'ACTIVATE_UPDATE'});}else void this.registration?.update();}
}
