const {chromium,webkit}=require('C:/Users/vitor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const siteRoot=process.argv.includes('--package')?path.join(root,'work','package-preview-check'):root;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg'};
(async()=>{
 let updateWorker=false;
 const server=http.createServer(async(req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://a').pathname);if(p==='/fixture.html'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Teste</title>');return;}if(!p.startsWith('/soundboard/'))throw Error();const file=path.resolve(siteRoot,p.slice(12)||'index.html');if(!file.startsWith(siteRoot+path.sep))throw Error();let b=await fs.readFile(file);if(updateWorker&&path.basename(file)==='sw.js')b=Buffer.from(b.toString().replace(/const BUILD="[a-z0-9]+";/,'const BUILD="test-update";'));res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(b);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const context=await chromium.launchPersistentContext(path.join(root,'work','browser-advanced'),{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/fixture.html');
  const raw=Array.from(await fs.readFile(path.join(root,'sons','campainha.mp3')));
  await page.evaluate(async bytes=>{
    await new Promise((resolve,reject)=>{const request=indexedDB.open('soundboard-v11',1);request.onupgradeneeded=()=>{request.result.createObjectStore('sounds',{keyPath:'id'});request.result.createObjectStore('settings');};request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction(['sounds','settings'],'readwrite');tx.objectStore('sounds').put({id:'builtin:sino',name:'Sino antigo',category:'humor',icon:'bell',color:'#f5c34c',loop:false,builtin:true,file:'sons/sino-demo.wav'});tx.objectStore('sounds').put({id:'custom:preservado',name:'Áudio <img onerror=alert(1)>',category:'memes',icon:'tv',color:'#f5c34c',loop:false,builtin:false,blob:new Blob([new Uint8Array(bytes)],{type:'audio/mpeg'})});tx.objectStore('settings').put(['builtin:sino','custom:preservado'],'favorites');tx.objectStore('settings').put(41,'volume');tx.oncomplete=()=>{db.close();resolve();};};});
  },raw);
  await page.goto(base+'/soundboard/');await page.waitForSelector('[data-sound-id="custom:preservado"]');
  assert.equal(await page.locator('#volume').inputValue(),'41');assert.equal(await page.locator('[data-sound-id]').count(),2);
  await page.locator('[data-sound-id="custom:preservado"]').click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
  await page.locator('#libraryButton').click();
  await page.locator('#library').getByRole('button',{name:'PARAR',exact:true}).click({timeout:1000});
  await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Pronto');
  const event=page.waitForEvent('download');await page.locator('#export').click();const download=await event;const backupFile=path.join(root,'work','migration-backup.json');await download.saveAs(backupFile);
  const backup=JSON.parse(await fs.readFile(backupFile,'utf8'));
  assert.equal(backup.sounds.find(r=>r.id==='builtin:sino').icon,'sino','Backup da migração precisa usar um ícone válido na v2');
  assert.equal(backup.sounds.find(r=>r.id==='custom:preservado').icon,'abertura-de-programa');
  await page.locator('#favoriteOrder').getByRole('button',{name:'Subir Áudio <img onerror=alert(1)>',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#favoriteOrder li')?.textContent.includes('Áudio'));
  assert.match(await page.locator('#favoriteOrder li').first().innerText(),/Áudio/);
  await page.locator('#closeLibrary').click();
  // PARAR durante a decodificação de uma pré-escuta invalida o resultado pendente.
  await page.locator('#libraryButton').click();await page.locator('#add').click();await page.locator('#soundName').fill('Prévia cancelada');await page.locator('#soundFile').setInputFiles(path.join(root,'sons','sino.mp3'));
  await page.evaluate(()=>{const handler=document.querySelector('#preview').onclick;document.querySelector('#preview').onclick=()=>window.previewRun=handler();const original=AudioContext.prototype.decodeAudioData;AudioContext.prototype.decodeAudioData=function(...args){AudioContext.prototype.decodeAudioData=original;window.decodeStarted=true;return new Promise(resolve=>{window.finishDecode=async()=>resolve(await original.apply(this,args));});};});
  await page.locator('#preview').click();await page.waitForFunction(()=>window.decodeStarted);
  await page.locator('#editor').getByRole('button',{name:'PARAR',exact:true}).click();await page.evaluate(async()=>{await window.finishDecode();await window.previewRun;});
  assert.notEqual(await page.locator('#playState').textContent(),'Tocando','Pré-escuta antiga não pode iniciar depois de PARAR');
  // Dois toques rápidos ao criar categoria não podem gerar IDs divergentes entre UI e banco.
  await page.locator('#newCategoryName').fill('Categoria de palco');
  await page.evaluate(async()=>{const {LibraryStore}=await import('./js/storage.js');const original=LibraryStore.prototype.setting;window.categoryReleases=[];LibraryStore.prototype.setting=function(key,value){if(key!=='categories')return original.call(this,key,value);window.categoryStarted=true;return new Promise(resolve=>{window.categoryReleases.push(async()=>{await original.call(this,key,value);resolve();});});};window.releaseCategory=()=>Promise.all(window.categoryReleases.map(fn=>fn()));const button=document.querySelector('#addCategory');button.click();button.click();});
  await page.waitForFunction(()=>window.categoryStarted);await page.evaluate(()=>window.releaseCategory());
  await page.waitForFunction(()=>document.querySelector('#soundCategory').selectedOptions[0]?.textContent==='Categoria de palco');
  assert.equal(await page.locator('#soundCategory option').filter({hasText:'Categoria de palco'}).count(),1,'Categoria deve ser criada uma vez');
  await page.locator('#closeEditor').click();
  await page.locator('#allTab').click();await page.locator('#search').fill('Silêncio dramático');await page.locator('#libraryButton').click();await page.locator('#manageSounds').click();await page.locator('[data-sound-id="builtin:silencio-dramatico"]').click();
  await page.locator('#soundFile').setInputFiles(path.join(root,'sons','sino.mp3'));await page.locator('#preview').click();
  await page.waitForFunction(()=>document.querySelector('#playState').textContent!=='Carregando');
  assert.equal(await page.locator('#playState').textContent(),'Tocando','Arquivo escolhido substitui a ação de silêncio na prévia');
  await page.locator('#editor').getByRole('button',{name:'PARAR',exact:true}).click();await page.locator('#closeEditor').click();await page.locator('#organize').click();await page.locator('#search').fill('');await page.locator('#favoritesTab').click();
  // Sanitização real com DOMParser e renderização como imagem isolada.
  const security=await page.evaluate(async()=>{
    const {sanitizeSvg}=await import('./js/validation.js');let rejected=0;
    for(const source of ['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>','<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>','<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/x"/></svg>','<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(https://a)"/></svg>','<!DOCTYPE svg [<!ENTITY a "x">]><svg xmlns="http://www.w3.org/2000/svg"/>'])try{sanitizeSvg(source);}catch{rejected++;}
    return {rejected,safe:sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="#ff0000"/></svg>')};
  });assert.equal(security.rejected,5);assert.match(security.safe,/<circle/);
  // Cada MP3 passa no decodificador real do navegador, sem reprodução física.
  const audioCheck=await page.evaluate(async()=>{
    const {audioLibrary}=await import('./js/audio-library.js'),ctx=new AudioContext(),results=[];
    for(const row of audioLibrary.filter(r=>r.available)){const response=await fetch(row.file+'?v='+row.sha256.slice(0,12)),bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes),sha256=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');if(!response.ok||sha256!==row.sha256||bytes.byteLength!==row.bytes){results.push({id:row.id,hashMatches:false,bytesMatch:false});continue;}const buffer=await ctx.decodeAudioData(bytes);let energy=0;for(let c=0;c<buffer.numberOfChannels;c++)for(const value of buffer.getChannelData(c))energy+=value*value;results.push({id:row.id,duration:buffer.duration,energy,hashMatches:sha256===row.sha256,bytesMatch:true,userProvided:!!row.userProvided});}
    await ctx.close();return results;
  });assert.equal(audioCheck.length,71);assert.deepEqual(audioCheck.filter(r=>!r.hashMatches||!r.bytesMatch),[],'Os MP3 servidos precisam corresponder ao inventário e aos hashes do cache');assert.ok(audioCheck.every(r=>r.duration>0&&r.energy>0));
  for(const row of audioCheck.filter(r=>r.userProvided)){const {name}=await page.evaluate(async id=>(await import('./js/audio-library.js')).audioLibrary.find(r=>r.id===id),row.id);const credit=page.locator('#credits .credit').filter({has:page.locator('strong',{hasText:name})});assert.match(await credit.innerText(),/Licença de uso declarada pelo usuário/);assert.equal(await credit.locator('a').count(),0,'A substituição não pode herdar a fonte ou licença do áudio anterior');}
  // Uma transação inválida não deixa a primeira gravação aplicada.
  const atomic=await page.evaluate(async()=>{
    const {openDatabase}=await import('./js/storage.js'),db=await openDatabase();const original=await db.read('sounds','custom:preservado');let rejected=false;
    try{await db.import({sounds:[{...original,name:'NÃO PERSISTIR'},{name:'Sem keyPath'}]},{favorites:[],categories:[]});}catch{rejected=true;}
    const after=await db.read('sounds','custom:preservado');return {rejected,name:after.name};
  });assert.equal(atomic.rejected,true);assert.equal(atomic.name,'Áudio <img onerror=alert(1)>');
  await page.reload();await page.waitForSelector('[data-sound-id]');assert.equal(await page.locator('[data-sound-id]').first().getAttribute('data-sound-id'),'custom:preservado','Ordem dos favoritos persiste');
  // Atualização de Service Worker espera confirmação e não interrompe uma apresentação.
  await page.locator('#libraryButton').click();await page.locator('#manageSounds').click();await page.locator('[data-sound-id="custom:preservado"]').click();await page.locator('#soundLoop').check();await page.locator('#saveSound').click();await page.waitForFunction(()=>!document.querySelector('#editor').open);await page.locator('#organize').click();
  await page.locator('[data-sound-id="custom:preservado"]').click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
  await page.waitForFunction(()=>navigator.serviceWorker.controller);updateWorker=true;
  await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});
  await page.waitForFunction(()=>!document.querySelector('#updateNotice').hidden);
  assert.equal(await page.locator('#playState').textContent(),'Tocando','Atualização aguardando não pode parar apresentação');
  await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.locator('#applyUpdate').click()]);await page.waitForSelector('[data-sound-id="custom:preservado"]');
  assert.equal(await page.locator('#playState').textContent(),'Pronto');assert.equal(await page.locator('#volume').inputValue(),'41');
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(root,'work','advanced-results.json'),JSON.stringify({migration:true,maliciousSvgRejected:5,browserDecoded:audioCheck.length,atomicRollback:true,touchEmulation:true,previewCancel:true,modalStop:true,categoryRace:true,previewActionOverride:true,updateWaitsForConsent:true,errors},null,2));
  console.log('PASS: migração v1 com Blob/ícones/volume/favoritos, backup migrado, reordenação persistida, 5 SVGs hostis, 71 MP3 decodificados no Chrome, rollback atômico, toque móvel emulado, PARAR nos modais/prévia, categoria concorrente, atualização PWA aguardando confirmação.');
 }finally{await context.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
