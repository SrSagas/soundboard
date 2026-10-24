import test from 'node:test';
import assert from 'node:assert/strict';
let readBackup,createBackup,planImport,partitionBackup,resolveFavorites;
try { ({readBackup,createBackup,planImport,partitionBackup,resolveFavorites}=await import('../js/backup.js')); } catch {}
function ready(){assert.equal(typeof readBackup,'function','Backup validado precisa existir');}
const official=[{id:'builtin:sino',name:'Sino',category:'humor',icon:'sino',color:'#ffcc66',file:'sons/sino.mp3',builtin:true}];
const record={id:'custom:teste-123',name:'Meu sino',category:'memes',icon:'sino',color:'#ffcc66',loop:false,builtin:false};
const audio=new Blob([new Uint8Array([82,73,70,70,1,2,3,4,87,65,86,69])],{type:'audio/wav'});
const options={catalog:official,validateAudio:async b=>{assert.ok(b.size>0);return {duration:1};},sanitizeSvg:()=>{throw Error('SVG inseguro');}};
test('backup inclui bytes de áudio e verifica integridade antes de restaurar',async()=>{
  ready();const blob=await createBackup([{...record,blob:audio}],{favorites:[record.id],volume:35,categories:[]});
  const data=await readBackup(blob,options); assert.equal(data.sounds[0].blob.size,12);
  assert.equal(data.sounds[0].name,'Meu sino');assert.deepEqual(data.favorites,['custom:teste-123']);
  const damaged=JSON.parse(await blob.text()); damaged.sounds[0].blobBase64='AAAA';
  await assert.rejects(readBackup(new Blob([JSON.stringify(damaged)]),options),/integridade|tamanho/i);
});
test('importa o formato v1 existente sem confiar em caminhos fornecidos',async()=>{
  ready();const legacy={format:'soundboard-backup',version:1,sounds:[{...official[0],icon:'bell',file:'sons/../../segredo'}],favorites:['builtin:sino']};
  const result=await readBackup(new Blob([JSON.stringify(legacy)]),options);
  assert.equal(result.sounds[0].file,'sons/sino.mp3');assert.equal(result.sounds[0].icon,'sino');
});
test('rejeita IDs forjados, registros duplicados e SVG ativo',async()=>{
  ready();for(const sounds of [[{...record,id:'custom:x/builtin:forjado'}],[record,record],[{...record,iconSvg:'<svg onload="alert(1)"/>'}]]){
    await assert.rejects(readBackup(new Blob([JSON.stringify({format:'soundboard-backup',version:2,sounds,favorites:[]})]),options));
  }
});
test('conflitos preservam dados por padrão e cópia recebe novo identificador',()=>{
  ready();const incoming={sounds:[{...record,blob:audio}],favorites:[record.id],categories:[]};
  const skip=planImport(incoming,[record],'skip');assert.equal(skip.sounds.length,0);
  const copy=planImport(incoming,[record],'copy');assert.equal(copy.sounds.length,1);
  assert.notEqual(copy.sounds[0].id,record.id);assert.match(copy.sounds[0].id,/^custom:/);
});
test('bibliotecas grandes são divididas em partes com todos os arquivos preservados',()=>{
  ready();assert.equal(typeof partitionBackup,'function');
  const records=['a','b','c'].map(id=>({id,blob:new Blob([new Uint8Array(600)])}));
  const parts=partitionBackup(records,3000);assert.deepEqual(parts.map(g=>g.map(r=>r.id)),[['a','b'],['c']]);
  assert.deepEqual(partitionBackup([]),[[]]);
});
test('importação permite restaurar a ordem exata dos favoritos do backup',()=>{
  ready();assert.equal(typeof resolveFavorites,'function');
  assert.deepEqual(resolveFavorites(['builtin:sino','builtin:fogo'],['builtin:fogo','builtin:sino'],'restore'),['builtin:fogo','builtin:sino']);
  assert.deepEqual(resolveFavorites(['builtin:sino'],['builtin:fogo','builtin:sino'],'merge'),['builtin:sino','builtin:fogo']);
});
