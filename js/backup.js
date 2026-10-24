import {MAX_AUDIO_BYTES,validId,validColor,cleanName,sanitizeSvg as sanitizeDefault,digest} from './validation.js';
const FORMAT='soundboard-backup';
const coreCategories=new Set(['humor','objects','action','ambient','school','music','memes','other']);
const legacyIcons={bell:'sino',bellRing:'campainha',rewind:'rebobinar',phone:'telefone',flame:'fogo',car:'buzina',glass:'vidro-quebrando',hammer:'martelada',laugh:'risadas',clap:'aplausos',bug:'grilos',music:'musica-de-elevador',door:'porta-abrindo',knock:'batidas-na-porta',water:'agua-espirrando',light:'interruptor',clock:'relogio',wind:'vento',cloud:'chuva',tree:'floresta',school:'escola',tv:'abertura-de-programa',star:'vitoria',zap:'choque-eletrico',alert:'errou',mic:'multidao',target:'acertou',waves:'praia',foot:'passos',book:'giz-no-quadro',key:'chaves',shield:'misterio'};
export function migrateIcon(icon,fallback='sino'){return legacyIcons[icon]||icon||fallback;}
function encode(bytes){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}
function decode(base64){
  if(typeof base64!=='string'||base64.length>Math.ceil(MAX_AUDIO_BYTES/3)*4||base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))throw Error('Áudio codificado inválido ou tamanho excessivo.');
  let raw;try{raw=atob(base64);}catch{throw Error('Áudio codificado inválido.');}
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
export function partitionBackup(records,maxBytes=64*1024*1024){
  const groups=[];let group=[],size=0;
  for(const row of records){
    const {blob,...metadata}=row;
    const bytes=Math.ceil((blob?.size||0)/3)*4+JSON.stringify(metadata).length*2+512;
    if(group.length&&size+bytes>maxBytes){groups.push(group);group=[];size=0;}
    group.push(row);size+=bytes;
  }
  if(group.length||!groups.length)groups.push(group);return groups;
}
export function resolveFavorites(current,incoming,mode='merge'){
  return [...new Set(mode==='restore'?incoming:[...current,...incoming])];
}
export async function createBackup(records,{favorites=[],volume=35,categories=[],part}={}) {
  const sounds=[];
  for(const item of records){
    const entry={id:item.id,name:item.name,category:item.category,icon:item.icon,color:item.color,loop:!!item.loop,builtin:!!item.builtin};
    if(item.iconSvg)entry.iconSvg=item.iconSvg;
    if(item.blob){entry.blobBase64=encode(new Uint8Array(await item.blob.arrayBuffer()));entry.blobType=item.blob.type;entry.byteLength=item.blob.size;entry.sha256=await digest(item.blob);}
    sounds.push(entry);
  }
  return new Blob([JSON.stringify({format:FORMAT,version:2,createdAt:new Date().toISOString(),sounds,favorites,categories,volume,...(part?{part}:{})})],{type:'application/json'});
}
export async function readBackup(file,{catalog,validateAudio,sanitizeSvg=sanitizeDefault}={}) {
  if(!file||file.size>250*1024*1024)throw Error('Backup acima de 250 MB. Divida a biblioteca em arquivos menores.');
  let data;try{data=JSON.parse(await file.text());}catch{throw Error('O arquivo não contém um backup JSON válido.');}
  if(!data||data.format!==FORMAT||![1,2].includes(data.version)||!Array.isArray(data.sounds)||!Array.isArray(data.favorites))throw Error('Formato de backup incompatível.');
  if(data.part&&(!Number.isSafeInteger(data.part.index)||!Number.isSafeInteger(data.part.total)||data.part.index<1||data.part.total<data.part.index||typeof data.part.id!=='string'||!/^[-a-z0-9]{1,80}$/.test(data.part.id)))throw Error('Identificação das partes do backup inválida.');
  const stock=new Map(catalog.map(item=>[item.id,item]));
  const icons=new Set(catalog.map(item=>item.icon));
  const categories=[];
  if(data.categories!==undefined&&!Array.isArray(data.categories))throw Error('Categorias inválidas.');
  for(const cat of data.categories||[]){
    if(!cat||typeof cat.id!=='string'||!/^category:[a-z0-9-]{1,80}$/.test(cat.id)||!cleanName(cat.name)||categories.some(c=>c.id===cat.id))throw Error('Categoria personalizada inválida.');
    categories.push({id:cat.id,name:cleanName(cat.name)});
  }
  const categoryIds=new Set([...coreCategories,...categories.map(c=>c.id)]);
  const sounds=[],ids=new Set();
  for(const row of data.sounds){
    if(!row||!validId(row.id)||ids.has(row.id)||!cleanName(row.name)||row.name.length>60||!validColor(row.color)||!categoryIds.has(row.category))throw Error('Metadados inválidos ou identificadores duplicados.');
    const official=stock.get(row.id),builtin=row.id.startsWith('builtin:');
    if(builtin&&!official)throw Error('Efeito oficial desconhecido.');
    let icon=data.version===1?(official?.icon||migrateIcon(row.icon)):row.icon;
    if(!icons.has(icon))throw Error('Ícone desconhecido no backup.');
    if(row.loop!==undefined&&typeof row.loop!=='boolean')throw Error('Configuração de repetição inválida.');
    const entry={id:row.id,name:cleanName(row.name),category:row.category,icon,color:row.color,loop:!!row.loop,builtin,updatedAt:Date.now()};
    // Caminhos recebidos são ignorados: oficiais vêm do catálogo e personalizados exigem bytes.
    if(official)entry.file=official.file;
    if(row.iconSvg)entry.iconSvg=sanitizeSvg(row.iconSvg);
    if(row.blobBase64!==undefined){
      const bytes=decode(row.blobBase64);
      if(!bytes.length||bytes.length>MAX_AUDIO_BYTES)throw Error('Tamanho de áudio inválido.');
      const type=typeof row.blobType==='string'&&/^audio\/[a-zA-Z0-9.+-]+$/.test(row.blobType)?row.blobType:'application/octet-stream';
      entry.blob=new Blob([bytes],{type});
      if(data.version===2&&(row.byteLength!==bytes.length||typeof row.sha256!=='string'||await digest(entry.blob)!==row.sha256))throw Error('Falha de integridade do áudio no backup.');
      if(validateAudio)entry.audioMetadata=await validateAudio(entry.blob);
      entry.file='';entry.revision=await digest(entry.blob);
    } else if(!builtin)throw Error('Um efeito personalizado está sem seu arquivo de áudio.');
    sounds.push(entry);ids.add(entry.id);
  }
  return {sounds,categories,favorites:[...new Set(data.favorites.filter(id=>validId(id)&&(id.startsWith('custom:')||stock.has(id))))],volume:typeof data.volume==='number'&&Number.isFinite(data.volume)?Math.max(0,Math.min(100,data.volume)):undefined,version:data.version,part:data.part};
}
export function planImport(incoming,existing,mode='skip') {
  if(!['skip','copy','replace'].includes(mode))throw Error('Escolha uma política de conflitos.');
  const existingIds=new Set(existing.map(item=>item.id)),mapping=new Map(),sounds=[];
  let skipped=0,copied=0,replaced=0;
  for(const item of incoming.sounds){
    if(existingIds.has(item.id)){
      if(mode==='skip'){skipped++;continue;}
      if(mode==='copy'){
        // Uma cópia personalizada precisa levar áudio próprio; metadados oficiais não bastam.
        if(!item.blob){skipped++;continue;}
        const id='custom:'+crypto.randomUUID();mapping.set(item.id,id);
        sounds.push({...item,id,builtin:false,file:'',name:cleanName(item.name+' (cópia)')});copied++;continue;
      }
      replaced++;
    }
    sounds.push(item);
  }
  return {...incoming,sounds,skipped,copied,replaced,favorites:incoming.favorites.map(id=>mapping.get(id)||id)};
}
