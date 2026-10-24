// Executar com o Node e Playwright já instalados no ambiente; nenhum pacote do site é necessário.
const {chromium}=require('C:/Users/vitor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const siteRoot=process.argv.includes('--package')?path.join(root,'work','package-preview-check'):root;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg','.wav':'audio/wav','.txt':'text/plain; charset=utf-8'};
async function serve(req,res){
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/fixture.html'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Fixture</title>');return;}
    if(!url.pathname.startsWith('/soundboard/')){res.writeHead(404);res.end();return;}
    let rel=decodeURIComponent(url.pathname.slice('/soundboard/'.length))||'index.html';
    const file=path.resolve(siteRoot,rel);if(!file.startsWith(siteRoot+path.sep)){res.writeHead(403);res.end();return;}
    const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  }catch{res.writeHead(404);res.end('Ausente');}
}
(async()=>{
  const server=http.createServer(serve);await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browserOptions={headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',viewport:{width:390,height:844},args:['--autoplay-policy=no-user-gesture-required']};
  let context=await chromium.launchPersistentContext(path.join(root,'work','browser-tests'),browserOptions);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'/soundboard/');
    await page.getByRole('button',{name:'PARAR',exact:true}).waitFor({timeout:5000});
    if(process.argv.includes('--smoke')){console.log('PARAR disponível em subdiretório');return;}
    await page.waitForSelector('[data-sound-id]');
    for(const width of [320,390,768,1440]){
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Sem rolagem horizontal em '+width);
      const cols=await page.locator('#grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
      if(width===390)assert.equal(cols,3);
    }
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Todos os sons',exact:true}).click();
    assert.equal(await page.locator('[data-sound-id]').count(),72);
    const icons=await page.locator('[data-sound-id] img').evaluateAll(imgs=>imgs.map(i=>i.getAttribute('src')));
    assert.equal(new Set(icons).size,72,'Cada efeito tem SVG próprio');
    await page.setViewportSize({width:1440,height:960});await page.screenshot({path:path.join(root,'work','interface-desktop.png')});await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(root,'work','interface-mobile.png'),fullPage:true});
    await page.screenshot({path:path.join(root,'work','interface-mobile-first-screen.png')});
    const sino=page.locator('[data-sound-id="builtin:sino"]');
    await sino.click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
    await sino.click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Pronto');
    await page.locator('[data-sound-id="builtin:fogo"]').click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
    await page.getByRole('button',{name:'PARAR',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Pronto');
    await page.getByRole('button',{name:'Testar áudio',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
    await page.getByRole('button',{name:'PARAR',exact:true}).click();
    await page.locator('#libraryButton').click();
    await page.getByRole('button',{name:'Adicionar som',exact:true}).first().click();
    await page.locator('#soundName').fill('Efeito de teste local');
    await page.locator('#soundFile').setInputFiles(path.join(root,'sons','campainha.mp3'));
    await page.locator('#svgFile').setInputFiles({name:'icone-local.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#a6edce"/><path d="M22 32h20" stroke="#122a25" stroke-width="5"/></svg>')});
    await page.waitForFunction(()=>document.querySelector('#editorMessage').textContent.includes('Ícone conferido'));
    await page.locator('#soundFavorite').check();
    await page.getByRole('button',{name:'Salvar efeito',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('#editor').open);
    await page.locator('#search').fill('Efeito de teste local');assert.equal(await page.locator('[data-sound-id]').count(),1);
    await page.locator('[data-sound-id]').click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
    await page.getByRole('button',{name:'PARAR',exact:true}).click();
    await page.reload();await page.locator('#allTab').click();await page.locator('#search').fill('Efeito de teste local');assert.equal(await page.locator('[data-sound-id]').count(),1,'Persistência após recarregar');
    await page.locator('#libraryButton').click();await page.locator('#manageSounds').click();await page.locator('[data-sound-id]').click();
    await page.locator('#soundName').fill('Efeito editado');await page.locator('#soundFile').setInputFiles(path.join(root,'sons','sino.mp3'));
    await page.getByRole('button',{name:'Salvar efeito',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#editor').open);
    await page.getByRole('button',{name:'Concluir edição',exact:true}).click();
    await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
    const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar biblioteca',exact:true}).click();const download=await downloadEvent;
    const backupFile=path.join(root,'work','backup-test.json');await download.saveAs(backupFile);
    const backup=JSON.parse(await fs.readFile(backupFile,'utf8'));assert.ok(backup.sounds.some(x=>x.name==='Efeito editado'&&x.blobBase64&&x.sha256));
    await page.locator('#importFile').setInputFiles(backupFile);await page.waitForFunction(()=>document.querySelector('#importReview').open);
    await page.locator('#conflictPolicy').selectOption('copy');await page.getByRole('button',{name:'Confirmar importação',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('#importReview').open);
    const restoreFile=path.join(root,'work','backup-restore-test.json');await fs.writeFile(restoreFile,JSON.stringify({...backup,volume:22,favorites:[...backup.favorites].reverse()}));
    await page.locator('#importFile').setInputFiles(restoreFile);await page.waitForFunction(()=>document.querySelector('#importReview').open);await page.locator('#importFavoritesMode').selectOption('restore');await page.locator('#importVolume').check();await page.locator('#confirmImport').click();await page.waitForFunction(()=>!document.querySelector('#importReview').open);
    await page.locator('#closeLibrary').click();assert.equal(await page.locator('#volume').inputValue(),'22','Volume restaurado por escolha explícita');
    await page.locator('#allTab').click();await page.locator('#search').fill('Efeito editado');assert.equal(await page.locator('[data-sound-id]').count(),2,'Cópia não sobrescreve original');
    await page.locator('#libraryButton').click();await page.locator('#manageSounds').click();await page.locator('[data-sound-id]').last().click();page.once('dialog',d=>d.accept());await page.locator('#deleteSound').click();await page.waitForFunction(()=>!document.querySelector('#editor').open);
    assert.equal(await page.locator('[data-sound-id]').count(),1,'Exclusão da cópia preserva o original');await page.locator('#organize').click();
    await page.locator('#search').fill('');await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
    await page.getByRole('button',{name:/Preparar uso offline/}).click();
    await page.waitForFunction(()=>document.querySelector('#offlineDetail').textContent.includes('Conferido:'),{},{timeout:180000});
    await page.screenshot({path:path.join(root,'work','biblioteca.png'),fullPage:true});
    await page.locator('#closeLibrary').click();await context.setOffline(true);await page.reload();await page.waitForSelector('[data-sound-id]');await page.locator('#allTab').click();
    await page.locator('#search').fill('Efeito editado');await page.locator('[data-sound-id]').first().click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
    await page.getByRole('button',{name:'PARAR',exact:true}).click();await page.locator('#search').fill('Sino');await page.locator('[data-sound-id="builtin:sino"]').click();await page.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
    await context.close();context=await chromium.launchPersistentContext(path.join(root,'work','browser-tests'),browserOptions);await context.setOffline(true);
    const restarted=await context.newPage();restarted.on('pageerror',e=>errors.push(e.message));await restarted.goto(base+'/soundboard/');await restarted.waitForSelector('[data-sound-id]');
    await restarted.locator('#allTab').click();await restarted.locator('#search').fill('Efeito editado');await restarted.locator('[data-sound-id]').first().click();await restarted.waitForFunction(()=>document.querySelector('#playState').textContent==='Tocando');
    assert.deepEqual(errors,[],'Nenhum erro de JavaScript');
    console.log('PASS: layouts 320/390/768/1440, 72 SVGs, reprodução/toggle/PARAR/repetição, cadastro/edição/substituição/persistência, backup com bytes, importação com cópia, subdiretório, uso offline oficial e personalizado, reinício do navegador sem rede.');
  }finally{await context.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
