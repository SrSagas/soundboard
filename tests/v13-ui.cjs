// Contratos observáveis do redesenho; mantém os testes funcionais existentes separados.
const {chromium}=require('C:/Users/vitor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg'};
(async()=>{
 const server=http.createServer(async(req,res)=>{try{const p=new URL(req.url,'http://a').pathname;if(!p.startsWith('/soundboard/'))throw Error();const file=path.resolve(root,decodeURIComponent(p.slice(12))||'index.html');if(!file.startsWith(root+path.sep))throw Error();const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/soundboard/');await page.waitForSelector('[data-sound-id]');
  assert.match(await page.locator('.version').textContent(),/1\.3/);
  assert.ok((await page.locator('.transport').boundingBox()).height<=104,'Transporte móvel compacto, até104px');
  assert.ok((await page.locator('[data-sound-id]').first().boundingBox()).y<=300,'Favoritos acessíveis sem cabeçalho excessivo');
  assert.equal(await page.locator('#add').isVisible(),false,'Cadastro fica subordinado em Biblioteca');
  assert.equal(await page.locator('#organize').isVisible(),false,'Modo normal não expõe edição');
  assert.equal(await page.locator('#now').textContent(),'Nenhum efeito em reprodução');
  assert.equal(await page.locator('nav[aria-label="Navegação principal"]').getByRole('button').count(),3);
  const metrics=await page.evaluate(()=>({version:document.querySelector('.version').textContent,transportHeight:document.querySelector('.transport').getBoundingClientRect().height,firstFavoriteTop:document.querySelector('[data-sound-id]').getBoundingClientRect().top,cardHeight:document.querySelector('[data-sound-id]').getBoundingClientRect().height,font:getComputedStyle(document.querySelector('.sound-name')).fontFamily,nameFontSize:getComputedStyle(document.querySelector('.sound-name')).fontSize}));
  await page.screenshot({path:path.join(root,'work','v13-favorites-mobile.png')});
  for(const width of [280,320,360,390,768,1440]){
   await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Sem rolagem horizontal '+width);
   const cols=await page.locator('#grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);if(width===320)assert.equal(cols,2);if(width===390)assert.equal(cols,3);
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#allTab').click();
  assert.equal(await page.locator('[data-sound-id]').count(),72);
  const colors=await page.locator('[data-sound-id]').evaluateAll(nodes=>nodes.map(n=>{const glyph=n.querySelector('.glyph'),base=getComputedStyle(glyph,'::before'),accent=getComputedStyle(glyph,'::after');return {category:n.dataset.category,primary:base.backgroundColor,secondary:accent.backgroundColor,primaryMask:base.maskImage||base.webkitMaskImage,secondaryMask:accent.maskImage||accent.webkitMaskImage};}));
  assert.ok(colors.every(c=>c.primaryMask!=='none'&&c.secondaryMask!=='none'),'Todos os efeitos têm duas camadas vetoriais');
  assert.ok(colors.every(c=>c.primary!==c.secondary),'O detalhe usa uma segunda cor distinta');
  assert.ok(new Set(colors.map(c=>c.primary+'|'+c.secondary)).size>=12,'Combinações ajudam a distinguir efeitos sem cores aleatórias');
  const iconNodes=await page.locator('[data-sound-id] .glyph').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width})));
  assert.equal(new Set(iconNodes.map(n=>n.width)).size,1);
  await page.screenshot({path:path.join(root,'work','v13-mobile.png'),fullPage:true});await page.screenshot({path:path.join(root,'work','v13-mobile-first-screen.png')});
  await page.setViewportSize({width:1440,height:960});await page.screenshot({path:path.join(root,'work','v13-desktop.png')});await page.setViewportSize({width:390,height:844});
  await page.locator('#libraryButton').click();assert.equal(await page.locator('#add').isVisible(),true);await page.locator('#library').getByRole('button',{name:'PARAR',exact:true}).click();
  await page.locator('#manageSounds').click();assert.equal(await page.locator('#organize').isVisible(),true);await page.locator('[data-sound-id="builtin:sino"]').click();assert.equal(await page.locator('#editor').evaluate(e=>e.open),true);
  await page.locator('#editor').getByRole('button',{name:'PARAR',exact:true}).click();await page.locator('#closeEditor').click();await page.locator('#organize').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#organize').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-sound-id')),true,'Concluir edição mantém foco útil no catálogo');
  await page.locator('#libraryButton').click();await page.locator('#add').click();await page.locator('#soundName').fill('Ícone de contraste');await page.locator('#soundFile').setInputFiles(path.join(root,'sons','sino.mp3'));await page.locator('#soundColor').fill('#202630');await page.locator('#saveSound').click();await page.waitForFunction(()=>!document.querySelector('#editor').open);
  const dark=page.getByRole('button',{name:'Reproduzir Ícone de contraste',exact:true});await page.keyboard.press('Tab');await dark.focus();
  const contrast=await dark.evaluate(async node=>{
   const {openDatabase}=await import('./js/storage.js'),store=await openDatabase();const record=await store.read('sounds',node.dataset.soundId);
   const c=getComputedStyle(node),g=getComputedStyle(node.querySelector('.glyph'),'::before');
   return {background:c.backgroundColor,outline:c.outlineColor,glyph:g.backgroundColor,keyboard:node.matches(':focus-visible'),stored:record.color};
  });
  const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(n=>Number(n)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
  const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  assert.equal(contrast.keyboard,true);assert.equal(contrast.stored,'#202630','A cor escolhida não é reescrita no armazenamento');
  assert.ok(ratio(contrast.outline,contrast.background)>=3,'Foco independe da cor do usuário');assert.ok(ratio(contrast.glyph,contrast.background)>=3,'Ícone personalizado de biblioteca mantém contraste mínimo');
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(root,'work','v13-ui-results.json'),JSON.stringify({...metrics,overflowWidths:[280,320,360,390,768,1440],duotoneEffects:72,colorPairs:new Set(colors.map(c=>c.primary+'|'+c.secondary)).size,effectCards:72,adminSeparated:true,keyboardFocusRestored:true,customColorPreserved:true,focusContrast:ratio(contrast.outline,contrast.background),customGlyphContrast:ratio(contrast.glyph,contrast.background),errors},null,2));console.log('PASS v1.3: 72 ícones em duas cores, transporte compacto, administração em Biblioteca, modais/PARAR, foco/contraste preservados e sem overflow em 280–1440 px.');
 }finally{await context.close();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
