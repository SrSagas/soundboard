import {initial,categories as coreCategories,defaultFavorites,categoryColors,palette} from './catalog.js';
import {AudioEngine} from './audio.js';
import {openDatabase,storageError} from './storage.js';
import {createBackup,readBackup,planImport,migrateIcon,partitionBackup,resolveFavorites} from './backup.js';
import {cleanName,validColor,validId,checkAudioFile,validateAudioFile,sanitizeSvg,digest} from './validation.js';
import {OfflineManager} from './offline.js';
import {iconTones} from './icon-tones.js';

const $=id=>document.getElementById(id);
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const iconIds=new Set(initial.map(i=>i.icon));
let store,items=[...initial],records=[],favorites=[...defaultFavorites],customCategories=[];
let filter='favorites',editing=false,editingId=null,editorSequence=0,customIcon='',saving=false,creatingCategory=false,pendingImport=null,volumeTimer,noticeTimer,colorCustomized=false;
const iconUrls=new Map();
const iconColorCache=new Map();
function notice(message){$('message').textContent=message;clearTimeout(noticeTimer);if(message)noticeTimer=setTimeout(()=>{$('message').textContent='';},7000);}
function report(error,target){const message=storageError(error);if(target)$(target).textContent=message;else notice(message);}
const engine=new AudioEngine({onState:updatePlayback});
function allCategories(){return [...coreCategories,...customCategories];}
function getItem(id){return items.find(i=>i.id===id);}
function focusCatalog(){const target=$('grid').querySelector('[data-sound-id]')||$(filter==='favorites'?'favoritesTab':'allTab');target.focus({preventScroll:true});}
function readableIconColor(color){
  if(iconColorCache.has(color))return iconColorCache.get(color);
  const rgb=hex=>[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16));
  const luminance=channels=>channels.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
  const tokens=getComputedStyle(document.documentElement),background=luminance(rgb(tokens.getPropertyValue('--card').trim()||'#202630'));
  const base=rgb(color),text=rgb(tokens.getPropertyValue('--text').trim()||'#E5EAF1');let channels=base;
  const contrast=values=>{const light=luminance(values);return (Math.max(light,background)+.05)/(Math.min(light,background)+.05);};
  for(let amount=.05;contrast(channels)<3&&amount<=1;amount+=.05)channels=base.map((n,i)=>Math.round(n*(1-amount)+text[i]*amount));
  const result='#'+channels.map(n=>n.toString(16).padStart(2,'0')).join('');iconColorCache.set(color,result);return result;
}
function image(item){
  const img=el('img');img.alt='';img.width=64;img.height=64;img.draggable=false;
  const glyph=el('span','glyph');glyph.setAttribute('aria-hidden','true');
  const tones=iconTones[item.icon]||{accent:'#C8D2DD'},chosen=validColor(item.color)?item.color:categoryColors[item.category]||categoryColors.other;
  const isDefault=item.builtin&&chosen.toUpperCase()===(categoryColors[item.category]||'').toUpperCase();
  const primary=readableIconColor(isDefault&&tones.primary?tones.primary:chosen);
  let secondary=readableIconColor(tones.accent);
  if(primary.toLowerCase()===secondary.toLowerCase())secondary=primary.toLowerCase()==='#c8d2dd'?'#8eadc5':'#c8d2dd';
  glyph.style.setProperty('--icon-primary',primary);glyph.style.setProperty('--icon-secondary',secondary);
  if(item.iconSvg){
    if(!iconUrls.has(item.iconSvg))iconUrls.set(item.iconSvg,URL.createObjectURL(new Blob([sanitizeSvg(item.iconSvg)],{type:'image/svg+xml'})));
    img.src=iconUrls.get(item.iconSvg);
    glyph.classList.add('custom-icon');
  }else img.src='./assets/icons/'+(iconIds.has(item.icon)?item.icon:'sino')+'.svg';
  if(!item.iconSvg){glyph.style.setProperty('--icon-url','url("'+img.getAttribute('src')+'")');glyph.style.setProperty('--icon-accent-url','url("./assets/icons/accents/'+(iconIds.has(item.icon)?item.icon:'sino')+'.svg")');}
  glyph.append(img);return glyph;
}
function mergeRecords(){
  const map=new Map(initial.map(item=>[item.id,{...item}]));
  for(const row of records){
    if(!row||!validId(row.id))continue;
    const stock=map.get(row.id),icon=migrateIcon(row.icon,stock?.icon||'sino');
    const item={...(stock||{}),id:row.id,name:cleanName(row.name)||stock?.name||'Efeito sem nome',category:allCategories().some(c=>c.id===row.category)?row.category:'other',
      color:validColor(row.color)?row.color:palette[0],icon:iconIds.has(icon)?icon:stock?.icon||'sino',loop:typeof row.loop==='boolean'?row.loop:!!stock?.loop,builtin:!!stock,
      file:stock?.file||'',blob:row.blob instanceof Blob?row.blob:undefined,revision:row.revision||row.updatedAt||row.blob?.size||stock?.sha256,
      duration:row.audioMetadata?.duration||stock?.duration};
    // A seleção antiga de um ícone genérico oficial migra para a ilustração do próprio efeito.
    if(stock&&!iconIds.has(row.icon))item.icon=stock.icon;
    if(row.iconSvg){try{item.iconSvg=sanitizeSvg(row.iconSvg);}catch{notice('Um ícone local incompatível foi isolado. O áudio foi preservado.');}}
    if(item.blob){item.available=true;item.file='';item.action=undefined;}
    else if(!stock)item.available=false;
    map.set(item.id,item);
  }
  items=[...map.values()];favorites=favorites.filter(id=>map.has(id));
}
function fillCategories(){
  const previous=$('categoryFilter').value,editorValue=$('soundCategory').value;
  $('categoryFilter').replaceChildren(new Option('Todas as categorias','all'));
  $('soundCategory').replaceChildren();
  for(const cat of allCategories()){$('categoryFilter').add(new Option(cat.name,cat.id));$('soundCategory').add(new Option(cat.name,cat.id));}
  $('categoryFilter').value=allCategories().some(c=>c.id===previous)?previous:'all';
  $('soundCategory').value=allCategories().some(c=>c.id===editorValue)?editorValue:'memes';
}
function render(){
  const query=normalize($('search').value.trim()),category=$('categoryFilter').value;
  let visible=items.filter(i=>(filter!=='favorites'||favorites.includes(i.id))&&(category==='all'||i.category===category)&&normalize(i.name).includes(query));
  if(filter==='favorites')visible.sort((a,b)=>favorites.indexOf(a.id)-favorites.indexOf(b.id));
  const title=category!=='all'?allCategories().find(c=>c.id===category)?.name:filter==='favorites'?'Favoritos':'Todos os efeitos';
  $('sectionName').replaceChildren(document.createTextNode(title+' '),el('span','',visible.length+' efeitos'));
  $('sectionName').lastElementChild.id='count';
  $('sectionEyebrow').textContent=filter==='favorites'?'Efeitos favoritos':'Catálogo de efeitos';
  $('catalogTools').hidden=filter==='favorites';
  $('favoritesTab').setAttribute('aria-pressed',String(filter==='favorites'));
  $('allTab').setAttribute('aria-pressed',String(filter==='all'));
  $('organize').textContent=editing?'Concluir edição':'Organizar';$('organize').setAttribute('aria-pressed',String(editing));$('editNotice').hidden=!editing;
  $('organize').hidden=!editing;
  const nodes=[];
  for(const item of visible){
    const pending=!item.blob&&!item.available&&!item.action;
    const button=el('button','sound'+(pending?' pending':'')+(editing?' editing':''));button.type='button';
    button.dataset.soundId=item.id;button.dataset.category=item.category;button.title=item.name;button.style.setProperty('--accent',item.color);button.setAttribute('aria-label',(editing?'Editar ':item.action?'Acionar ':'Reproduzir ')+item.name+(pending?', áudio pendente':''));
    button.append(image(item),el('span','sound-name',item.name));
    if(favorites.includes(item.id)){const marker=el('span','marker','★');marker.setAttribute('aria-hidden','true');button.append(marker);}
    if(!item.builtin||item.blob)button.append(el('span','local','LOCAL'));
    if(pending)button.append(el('span','sound-status','Áudio pendente'));
    if(item.action&&!item.blob)button.append(el('span','sound-status','Interrompe o áudio'));
    button.onclick=()=>{if(editing)openEditor(item);else void engine.toggle(item);};
    nodes.push(button);
  }
  if(!visible.length)nodes.push(el('p','empty',query?'Nenhum efeito encontrado. Tente outro nome.':filter==='favorites'?'Seus favoritos aparecem aqui. Abra Biblioteca → Editar efeitos para escolher seus sons.':'Esta categoria está pronta para seus arquivos. Abra Biblioteca → Adicionar som para começar.'));
  $('grid').replaceChildren(...nodes);
  const local=items.filter(i=>i.blob).length,official=initial.filter(i=>i.available).length,pending=initial.filter(i=>!i.available&&!i.action).length;
  $('librarySummary').textContent=`${items.length} efeitos · ${official} áudios oficiais · ${local} áudios locais`+(pending?` · ${pending} pendentes`:'')+' · Silêncio dramático interrompe a reprodução';
  updateCards();
}
function updateCards(){
  for(const button of $('grid').querySelectorAll('[data-sound-id]')){
    const active=button.dataset.soundId===engine.state.id;
    button.dataset.phase=active?engine.state.phase:'idle';
    button.setAttribute('aria-pressed',String(active&&engine.state.phase==='playing'));
    button.setAttribute('aria-busy',String(active&&engine.state.phase==='loading'));
  }
}
function updatePlayback(state){
  if(!$('playState'))return;
  $('playState').textContent=({idle:'Pronto',loading:'Carregando',playing:'Tocando',error:'Não reproduzido',interrupted:'Interrompido'})[state.phase]||'Pronto';
  $('now').textContent=state.name||'Nenhum efeito em reprodução';$('now').title=$('now').textContent;
  $('playHint').textContent=state.message||(state.phase==='playing'?(state.loop?'Repetição contínua · toque novamente para parar':'Toque novamente para parar'):state.phase==='loading'?'Preparando áudio…':'Toque em um cartão para reproduzir');
  document.querySelector('.transport').dataset.phase=state.phase;updateCards();
  if(state.phase==='error'||state.phase==='interrupted')notice(state.message);
}
function fillIcons(){
  $('soundIcon').replaceChildren();$('iconChoices').replaceChildren();
  for(const item of initial){
    $('soundIcon').add(new Option(item.name,item.icon));
    const button=el('button','icon-choice');button.type='button';button.dataset.icon=item.icon;button.setAttribute('aria-label','Ícone: '+item.name);button.title=item.name;button.append(image(item));
    button.onclick=()=>{$('soundIcon').value=item.icon;setCustomIcon('');refreshIconChoices();};$('iconChoices').append(button);
  }
}
function refreshIconChoices(){for(const node of $('iconChoices').children)node.setAttribute('aria-pressed',String(!customIcon&&node.dataset.icon===$('soundIcon').value));}
function refreshColorChoices(){
  for(const button of $('colorChoices')?.children||[])button.setAttribute('aria-pressed',String(button.dataset.color===$('soundColor').value.toUpperCase()));
}
function setCustomIcon(value){
  customIcon=value;$('customIconPreview').hidden=!value;
  if(value){if(!iconUrls.has(value))iconUrls.set(value,URL.createObjectURL(new Blob([value],{type:'image/svg+xml'})));$('customIconImage').src=iconUrls.get(value);}
  else{$('svgFile').value='';$('customIconImage').removeAttribute('src');}
  refreshIconChoices();
}
function openEditor(item){
  if(!store){notice('Armazenamento indisponível. Os áudios oficiais continuam acessíveis.');return;}
  editingId=item?.id||null;editorSequence++;$('soundForm').reset();$('editorMessage').textContent='';
  $('editorTitle').textContent=item?'Editar efeito':'Adicionar som';$('soundName').value=item?.name||'';$('soundCategory').value=item?.category||'memes';
  colorCustomized=false;$('soundColor').value=item?.color||categoryColors.memes;refreshColorChoices();$('soundIcon').value=item?.icon||'abertura-de-programa';$('soundLoop').checked=!!item?.loop;$('soundFavorite').checked=item?favorites.includes(item.id):true;
  $('deleteSound').hidden=!item||item.builtin;setCustomIcon(item?.iconSvg||'');
  $('fileTip').textContent=item?.blob?'Áudio salvo neste navegador. Escolha um arquivo para substituir.':item?.action?'Este efeito interrompe o áudio sem usar uma faixa. Adicione um arquivo se preferir.':item?.available?'Áudio oficial incluído. Um arquivo escolhido aqui será uma substituição apenas local.':'Selecione um arquivo autorizado para este efeito.';
  $('editor').showModal();
}
function closeEditor(){if(saving)return;if(engine.state.id?.startsWith('preview:'))engine.stop();editorSequence++;$('editor').close();}
async function saveSound(event){
  event.preventDefault();if(saving)return;
  const old=editingId?getItem(editingId):null,name=cleanName($('soundName').value),file=$('soundFile').files[0];
  if(!name){$('editorMessage').textContent='Informe o nome do efeito.';return;}
  if(items.some(i=>i.id!==old?.id&&normalize(i.name)===normalize(name))){$('editorMessage').textContent='Já existe um efeito com esse nome. Escolha outro para não confundir os cartões.';return;}
  if(!old&&!file){$('editorMessage').textContent='Selecione o arquivo de áudio do novo efeito.';return;}
  const record={id:old?.id||'custom:'+crypto.randomUUID(),name,category:$('soundCategory').value,color:$('soundColor').value,icon:$('soundIcon').value,loop:$('soundLoop').checked,builtin:!!old?.builtin,updatedAt:Date.now()};
  if(customIcon)record.iconSvg=customIcon;
  if(old?.blob){record.blob=old.blob;record.revision=old.revision;record.audioMetadata=old.audioMetadata;}
  const favorite=$('soundFavorite').checked;
  saving=true;$('saveSound').disabled=true;$('editorMessage').textContent='Conferindo e salvando…';
  try{
    if(file){record.audioMetadata=await validateAudioFile(file,b=>engine.validate(b));record.blob=file;record.revision=await digest(file);}
    const nextFavorites=favorites.filter(id=>id!==record.id);if(favorite){const oldIndex=favorites.indexOf(record.id);nextFavorites.splice(oldIndex<0?nextFavorites.length:oldIndex,0,record.id);}
    await store.save(record,nextFavorites);
    records=records.filter(r=>r.id!==record.id).concat(record);favorites=nextFavorites;mergeRecords();render();
    if(engine.state.id?.startsWith('preview:'))engine.stop();$('editor').close();notice('Efeito salvo neste dispositivo.');
  }catch(error){report(error,'editorMessage');}finally{saving=false;$('saveSound').disabled=false;}
}
async function preview(){
  const session=editorSequence,file=$('soundFile').files[0],old=editingId&&getItem(editingId);
  if(!file&&!old){$('editorMessage').textContent='Selecione um áudio para pré-escutar.';return;}
  try{
    // A decodificação pertence à própria sessão: PARAR cancela também uma prévia carregando.
    // O decodificador só reproduz conteúdo de áudio válido; o salvamento confere também o cabeçalho.
    if(file)checkAudioFile(file);
    await engine.toggle({...old,id:'preview:'+session,name:'Pré-escuta: '+($('soundName').value||'Novo efeito'),blob:file||old?.blob,action:file||old?.blob?undefined:old?.action,loop:$('soundLoop').checked,revision:file?file.name+':'+file.size+':'+file.lastModified:old?.revision});
  }catch(error){report(error,'editorMessage');}
}
async function erase(){
  const item=getItem(editingId);if(!item||item.builtin)return;
  if(!confirm('Excluir “'+item.name+'” e seu áudio local? Esta ação não pode ser desfeita sem um backup.'))return;
  try{const next=favorites.filter(id=>id!==item.id);await store.remove(item.id,next);records=records.filter(r=>r.id!==item.id);favorites=next;if(engine.state.id===item.id)engine.stop();mergeRecords();closeEditor();render();notice('Efeito excluído.');}catch(error){report(error,'editorMessage');}
}
async function addCategory(){
  if(creatingCategory)return;
  const name=cleanName($('newCategoryName').value);if(!name){$('editorMessage').textContent='Informe o nome da nova categoria.';return;}
  if(allCategories().some(c=>normalize(c.name)===normalize(name))){$('editorMessage').textContent='Essa categoria já existe.';return;}
  const category={id:'category:'+crypto.randomUUID(),name};
  creatingCategory=true;$('addCategory').disabled=true;
  try{await store.setting('categories',[...customCategories,category]);customCategories.push(category);fillCategories();$('soundCategory').value=category.id;$('newCategoryName').value='';$('editorMessage').textContent='Categoria criada.';}catch(error){report(error,'editorMessage');}finally{creatingCategory=false;$('addCategory').disabled=false;}
}
function renderFavoriteOrder(){
  const list=$('favoriteOrder');list.replaceChildren();
  favorites.forEach((id,index)=>{
    const item=getItem(id);if(!item)return;const row=el('li');row.append(image(item),el('span','',item.name));
    for(const [delta,label,text] of [[-1,'Subir','↑'],[1,'Descer','↓']]){
      const button=el('button','',text);button.type='button';button.setAttribute('aria-label',label+' '+item.name);button.disabled=delta<0?index===0:index===favorites.length-1;
      button.onclick=async()=>{const next=[...favorites];[next[index],next[index+delta]]=[next[index+delta],next[index]];try{await store.setting('favorites',next);favorites=next;renderFavoriteOrder();render();const moved=list.children[index+delta]?.querySelector(delta<0?'button':'button:nth-of-type(2)');moved?.focus();}catch(error){report(error);}};row.append(button);
    }
    const remove=el('button','remove-favorite','×');remove.type='button';remove.setAttribute('aria-label','Desfavoritar '+item.name);remove.onclick=async()=>{try{const next=favorites.filter(x=>x!==id);await store.setting('favorites',next);favorites=next;renderFavoriteOrder();render();}catch(error){report(error);}};row.append(remove);list.append(row);
  });
  if(!favorites.length)list.append(el('li','help','Nenhum favorito. Use Editar efeitos e marque seus efeitos preferidos.'));
}
function safeLink(label,url){const a=el('a','',label);try{const parsed=new URL(url);if(parsed.protocol==='https:'){a.href=parsed.href;a.target='_blank';a.rel='noopener noreferrer';}}catch{}return a;}
function renderCredits(){
  $('credits').replaceChildren();
  for(const item of initial){
    const c=item.credit,block=el('div','credit');block.append(el('strong','',item.name));
    if(item.action){block.append(el('p','','Ação de interromper a reprodução; não usa arquivo de áudio.'));}
    else if(c?.available&&c.userProvided){
      block.append(el('p','',c.license));
      block.append(el('p','',c.attribution));
    }else if(c?.available){
      block.append(document.createTextNode((c.title||c.sourceTitle||item.name)+' — '+(c.author||'Autor não informado')+'. '));
      block.append(safeLink(c.license||'Licença',c.licenseUrl),document.createTextNode(' · '),safeLink('Fonte original',c.source||c.sourceUrl||c.url));
      block.append(el('p','',c.attribution||'Edição para a Soundboard: corte, ajuste de nível e conversão. Detalhes no inventário local.'));
      if(String(c.license).includes('BY'))block.append(el('p','','Ao usar esta trilha em apresentação pública, inclua também o crédito no programa ou na descrição do evento.'));
    }else block.append(el('p','','Pendente: nenhuma gravação licenciada integrada.'));
    $('credits').append(block);
  }
}
async function exportLibrary(){
  if(!store)return;const button=$('export');button.disabled=true;$('backupMessage').textContent='Preparando backup com os arquivos de áudio…';
  try{
    // Exportar o modelo migrado, mantendo os mesmos Blobs; nunca serializar aliases antigos de ícones.
    const groups=partitionBackup(records.map(row=>getItem(row.id)).filter(Boolean));
    const settings={favorites:[...favorites],volume:Number($('volume').value),categories:[...customCategories]},backupId=crypto.randomUUID(),date=new Date().toISOString().slice(0,10);
    const download=async(group,index)=>{
      const blob=await createBackup(group,{...settings,...(groups.length>1?{part:{id:backupId,index:index+1,total:groups.length}}:{})});
      const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='soundboard-biblioteca-'+date+(groups.length>1?'-parte-'+(index+1)+'-de-'+groups.length:'')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    };
    $('backupParts').replaceChildren();
    if(groups.length===1){await download(groups[0],0);$('backupMessage').textContent='Backup exportado. Ele contém seus áudios locais; guarde-o em um lugar seguro.';}
    else{
      $('backupMessage').textContent=`Biblioteca dividida em ${groups.length} partes para limitar o uso de memória. Baixe e guarde todas. Importe-as na ordem; na última, você pode restaurar a ordem completa dos favoritos.`;
      groups.forEach((group,index)=>{const partButton=el('button','button secondary','Baixar parte '+(index+1)+' de '+groups.length);partButton.type='button';partButton.onclick=async()=>{partButton.disabled=true;try{await download(group,index);partButton.textContent='Parte '+(index+1)+' baixada — baixar novamente';}catch(error){report(error,'backupMessage');}finally{partButton.disabled=false;}};$('backupParts').append(partButton);});
    }
  }catch(error){report(error,'backupMessage');}finally{button.disabled=false;}
}
async function inspectImport(file){
  if(!file||!store)return;pendingImport=null;$('backupMessage').textContent='Validando estrutura, integridade e áudios. Aguarde…';$('importFile').disabled=true;
  try{
    const incoming=await readBackup(file,{catalog:initial,validateAudio:b=>validateAudioFile(b,x=>engine.validate(x))});
    const conflicts=incoming.sounds.filter(r=>records.some(x=>x.id===r.id)).length;
    pendingImport=incoming;$('importSummary').textContent=(incoming.part?`Parte ${incoming.part.index} de ${incoming.part.total}. `:'')+`${incoming.sounds.length} efeitos válidos, ${incoming.sounds.filter(r=>r.blob).length} arquivos de áudio e ${conflicts} conflitos com alterações locais. A importação será gravada de uma vez, após sua confirmação.`;
    $('importFavoritesMode').value='merge';$('importVolume').checked=false;$('importVolume').disabled=incoming.volume===undefined;
    $('conflictPolicy').value='skip';$('importMessage').textContent='';$('backupMessage').textContent='Backup validado; revise a importação.';$('importReview').showModal();
  }catch(error){report(error,'backupMessage');}finally{$('importFile').disabled=false;$('importFile').value='';}
}
async function confirmImport(){
  if(!pendingImport)return;const button=$('confirmImport');button.disabled=true;
  try{
    const plan=planImport(pendingImport,records,$('conflictPolicy').value);
    const categoryMap=new Map(customCategories.map(c=>[c.id,c]));
    // IDs de categoria em conflito conservam o nome local e continuam válidos.
    for(const category of plan.categories)if(!categoryMap.has(category.id))categoryMap.set(category.id,category);
    const nextCategories=[...categoryMap.values()],nextFavorites=resolveFavorites(favorites,plan.favorites,$('importFavoritesMode').value);
    const restoredVolume=$('importVolume').checked?plan.volume:undefined;
    await store.import(plan,{favorites:nextFavorites,categories:nextCategories,volume:restoredVolume});
    const map=new Map(records.map(r=>[r.id,r]));for(const row of plan.sounds)map.set(row.id,row);
    records=[...map.values()];favorites=nextFavorites;customCategories=nextCategories;pendingImport=null;
    if(restoredVolume!==undefined){$('volume').value=restoredVolume;$('volumeValue').textContent=restoredVolume+'%';engine.setVolume(restoredVolume/100);}
    mergeRecords();fillCategories();render();renderFavoriteOrder();$('importReview').close();
    $('backupMessage').textContent=`${plan.sounds.length} efeitos importados. ${plan.skipped} conflitos preservados, ${plan.copied} cópias criadas, ${plan.replaced} substituições confirmadas.`;
  }catch(error){report(error,'importMessage');}finally{button.disabled=false;}
}
async function storageStatus(){
  if(!navigator.storage?.estimate){$('storageDetail').textContent='Este navegador não informa a cota de armazenamento.';return;}
  try{const {usage=0,quota=0}=await navigator.storage.estimate(),persisted=await navigator.storage.persisted?.();$('storageDetail').textContent=`Uso deste site: ${(usage/1048576).toFixed(1)} MB de ${(quota/1048576).toFixed(0)} MB disponíveis na cota. `+(persisted?'Armazenamento persistente concedido.':'O sistema pode remover dados locais para liberar espaço.');}catch{$('storageDetail').textContent='Não foi possível consultar o espaço disponível.';}
}
const offline=new OfflineManager({onStatus:status=>{
  $('offlineBadge').textContent=status.badge;$('offlineBadge').classList.toggle('ready',status.ready);$('offlineDetail').textContent=status.detail;
  $('offlineProgress').hidden=!status.busy;$('offlineProgress').max=status.total||1;$('offlineProgress').value=status.done||0;
  $('downloadOffline').disabled=status.busy||!status.supported;$('downloadOffline').textContent=status.busy?'Preparando…':'Preparar uso offline'+(status.megabytes?' · '+status.megabytes+' MB':'');
},onUpdate:()=>{$('updateNotice').hidden=false;}});

function bind(){
  const colorChoices=el('div','color-choices');colorChoices.id='colorChoices';colorChoices.setAttribute('role','group');colorChoices.setAttribute('aria-label','Paleta de cores por categoria');
  for(const category of coreCategories){
    const color=categoryColors[category.id],button=el('button','color-choice');button.type='button';button.title=category.name;button.dataset.color=color.toUpperCase();button.setAttribute('aria-label','Cor: '+category.name);button.style.setProperty('--swatch',color);button.append(el('span'));
    button.onclick=()=>{$('soundColor').value=color;colorCustomized=true;refreshColorChoices();};colorChoices.append(button);
  }
  $('soundColor').closest('label').after(colorChoices);
  colorChoices.after(el('p','help','Cores muito escuras recebem contraste de leitura; sua escolha de cor é preservada.'));
  // showModal deixa o documento de fundo inerte; cada diálogo precisa do próprio transporte.
  for(const dialog of document.querySelectorAll('dialog')){
    const bar=el('div','dialog-stop'),button=el('button','stop','PARAR');button.type='button';button.setAttribute('aria-label','PARAR');button.onclick=()=>engine.stop();
    bar.append(el('span','','Controle da reprodução'),button);dialog.prepend(bar);
  }
  const parts=el('div','button-row');parts.id='backupParts';$('backupMessage').after(parts);
  const favoritesField=el('label','field','Ordem dos favoritos'),favoritesMode=el('select');favoritesMode.id='importFavoritesMode';favoritesMode.add(new Option('Mesclar com os favoritos atuais','merge'));favoritesMode.add(new Option('Restaurar a ordem do backup','restore'));favoritesField.append(favoritesMode);
  const volumeField=el('label','checkline'),volumeCheckbox=el('input');volumeCheckbox.type='checkbox';volumeCheckbox.id='importVolume';volumeField.append(volumeCheckbox,document.createTextNode('Restaurar também o volume do backup'));
  $('importPolicyHelp').before(favoritesField,volumeField);
  $('stop').onclick=()=>engine.stop();$('test').onclick=()=>{const sample=initial.find(i=>i.id==='builtin:sino'&&i.available);if(!sample){notice('Áudio de teste indisponível no pacote.');return;}void engine.toggle({...sample,id:'test:audio',name:'Teste de áudio',loop:false});};
  $('volume').oninput=()=>{const value=Number($('volume').value);$('volumeValue').textContent=value+'%';engine.setVolume(value/100);clearTimeout(volumeTimer);volumeTimer=setTimeout(()=>store?.setting('volume',value).catch(error=>report(error)),200);};
  $('favoritesTab').onclick=()=>{filter='favorites';$('search').value='';$('categoryFilter').value='all';render();};$('allTab').onclick=()=>{filter='all';$('categoryFilter').value='all';render();};$('categoryFilter').onchange=()=>{filter='all';render();};$('search').oninput=render;
  $('organize').onclick=()=>{editing=!editing;render();focusCatalog();};$('add').onclick=()=>{$('library').close();openEditor();};$('closeEditor').onclick=closeEditor;
  $('manageSounds').onclick=()=>{$('library').close();editing=true;filter='all';$('categoryFilter').value='all';render();focusCatalog();};
  $('soundColor').oninput=()=>{colorCustomized=true;refreshColorChoices();};$('soundCategory').onchange=()=>{if(!editingId&&!colorCustomized){$('soundColor').value=categoryColors[$('soundCategory').value]||categoryColors.other;refreshColorChoices();}};
  $('editor').addEventListener('cancel',event=>{event.preventDefault();closeEditor();});$('editor').addEventListener('close',()=>{if(engine.state.id?.startsWith('preview:'))engine.stop();});
  $('soundForm').onsubmit=saveSound;$('preview').onclick=preview;$('deleteSound').onclick=erase;$('addCategory').onclick=addCategory;
  $('soundIcon').onchange=()=>{setCustomIcon('');refreshIconChoices();};$('clearCustomIcon').onclick=()=>setCustomIcon('');
  $('svgFile').onchange=async()=>{const file=$('svgFile').files[0],session=editorSequence;if(!file)return;try{if(file.size>128*1024)throw Error('SVG acima de 128 KB.');const svg=sanitizeSvg(await file.text());if(session!==editorSequence)return;setCustomIcon(svg);$('editorMessage').textContent='Ícone conferido. Será salvo como imagem isolada.';}catch(error){$('svgFile').value='';report(error,'editorMessage');}};
  $('libraryButton').onclick=()=>{renderFavoriteOrder();$('libraryButton').setAttribute('aria-expanded','true');$('library').showModal();void storageStatus();void offline.check();};$('closeLibrary').onclick=()=>$('library').close();$('library').addEventListener('close',()=>$('libraryButton').setAttribute('aria-expanded','false'));
  $('export').onclick=exportLibrary;$('importFile').onchange=()=>inspectImport($('importFile').files[0]);$('cancelImport').onclick=()=>{pendingImport=null;$('importReview').close();};$('importReview').addEventListener('cancel',()=>{pendingImport=null;});$('confirmImport').onclick=confirmImport;
  $('conflictPolicy').onchange=()=>{$('importPolicyHelp').textContent=$('conflictPolicy').value==='replace'?'Ao confirmar, os efeitos com o mesmo identificador terão os metadados e o áudio substituídos. Os demais permanecem preservados.':$('conflictPolicy').value==='copy'?'Conflitos com áudio próprio serão copiados. Cadastros oficiais sem áudio local serão preservados.':'A biblioteca atual será preservada. Favoritos importados são acrescentados à ordem atual.';};
  $('downloadOffline').onclick=()=>offline.prepare().catch(error=>report(error));$('persistentStorage').onclick=async()=>{try{const ok=await navigator.storage?.persist?.();notice(ok?'Armazenamento persistente concedido.':'O navegador não concedeu persistência. Continue mantendo backups.');void storageStatus();}catch(error){report(error);}};
  $('applyUpdate').onclick=()=>{engine.stop();offline.applyUpdate();};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]'))engine.stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)engine.stop();else void offline.check();});window.addEventListener('pagehide',()=>engine.stop(false));
  let installPrompt;window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('install').hidden=false;});$('install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('install').hidden=true;}};
  window.addEventListener('online',()=>void offline.check());window.addEventListener('offline',()=>void offline.check());
}
async function boot(){
  fillCategories();fillIcons();bind();
  try{
    store=await openDatabase();const loaded=await Promise.all([store.read('sounds'),store.read('settings','favorites'),store.read('settings','volume'),store.read('settings','categories')]);
    records=loaded[0];favorites=Array.isArray(loaded[1])?[...new Set(loaded[1])]:[...defaultFavorites];
    customCategories=Array.isArray(loaded[3])?loaded[3].filter(c=>c&&/^category:[a-z0-9-]+$/.test(c.id)&&cleanName(c.name)).map(c=>({id:c.id,name:cleanName(c.name)})):[];
    if(typeof loaded[2]==='number'&&Number.isFinite(loaded[2]))$('volume').value=Math.max(0,Math.min(100,loaded[2]));
    engine.setVolume(Number($('volume').value)/100);$('volumeValue').textContent=$('volume').value+'%';mergeRecords();fillCategories();
  }catch(error){report(error);$('add').disabled=true;$('organize').disabled=true;$('manageSounds').disabled=true;$('export').disabled=true;$('importFile').disabled=true;}
  render();renderCredits();void offline.start();
  // Pré-carregamento limitado e adiado até a primeira interação de áudio.
  $('grid').addEventListener('click',()=>{setTimeout(()=>void engine.preload(favorites.map(getItem).filter(Boolean)),1200);},{once:true});
}
void boot();
