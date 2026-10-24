const DB_NAME='soundboard-v11'; // Mesmo banco da v1.1. Nunca apagar/renomear seus dados.
export function openDatabase() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,2);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('sounds'))db.createObjectStore('sounds',{keyPath:'id'});
      if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings');
      if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta');
      request.transaction.objectStore('meta').put({schema:2,migratedAt:new Date().toISOString()},'schema');
    };
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(Error('Feche outras abas antigas da Soundboard para atualizar o armazenamento.'));
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(new LibraryStore(db));};
  });
}
export class LibraryStore {
  constructor(db){this.db=db;}
  transaction(stores,action){
    return new Promise((resolve,reject)=>{
      const tx=this.db.transaction(stores,'readwrite');
      tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||Error('Operação cancelada. Nenhum dado foi alterado.'));tx.onerror=()=>{};
      try{action(tx);}catch(error){tx.abort();reject(error);}
    });
  }
  read(store,key){return new Promise((resolve,reject)=>{const tx=this.db.transaction(store,'readonly');const request=key===undefined?tx.objectStore(store).getAll():tx.objectStore(store).get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  setting(key,value){return this.transaction(['settings'],tx=>tx.objectStore('settings').put(value,key));}
  save(record,favorites){return this.transaction(['sounds','settings'],tx=>{tx.objectStore('sounds').put(record);tx.objectStore('settings').put(favorites,'favorites');});}
  remove(id,favorites){return this.transaction(['sounds','settings'],tx=>{tx.objectStore('sounds').delete(id);tx.objectStore('settings').put(favorites,'favorites');});}
  import(plan,{favorites,categories,volume}){
    return this.transaction(['sounds','settings'],tx=>{
      const sounds=tx.objectStore('sounds'),settings=tx.objectStore('settings');
      for(const row of plan.sounds)sounds.put(row);
      settings.put(favorites,'favorites');settings.put(categories,'categories');
      if(volume!==undefined)settings.put(volume,'volume');
    });
  }
}
export function storageError(error){
  if(error?.name==='QuotaExceededError')return 'Armazenamento cheio. Exporte um backup e libere espaço no dispositivo antes de tentar novamente.';
  if(['InvalidStateError','VersionError','TransactionInactiveError'].includes(error?.name))return 'O armazenamento foi fechado ou atualizado em outra aba. Feche as abas antigas e recarregue este navegador.';
  if(error?.name==='SecurityError')return 'O navegador bloqueou o armazenamento local. Confira as permissões deste site.';
  if(['AbortError','UnknownError','ConstraintError','DataError','NotFoundError','TypeError'].includes(error?.name))return 'Não foi possível concluir a operação no armazenamento. Os dados anteriores foram preservados. Tente recarregar o navegador.';
  return error?.message||'Não foi possível gravar os dados. Confira o espaço livre e as permissões do navegador.';
}
