# Soundboard v1.3 — reformulação visual

Registro da entrega original. A revisão posterior de rostos, mãos e segunda cor está documentada em [REFINAMENTO-ICONES.md](REFINAMENTO-ICONES.md); consulte esse registro para a composição atual dos ícones.

Implementada em 24/10/2026, diretamente em `C:\Users\vitor\Downloads\soundboard-v1.1`. Sem deploy, instalações, dependências remotas, alterações de infraestrutura ou nova arquitetura de execução.

## Resultado visual

- Sistema de tokens CSS com fundo `#111318`, superfícies `#1A202A`, cartões `#202630`, bordas `#323B49`, texto `#E5EAF1`, secundário `#96A2B3`, destaque `#8EADC5`, reprodução `#86C8AD` e PARAR `#A83E48`.
- Tipografia do sistema, hierarquia funcional, fundo uniforme, sem gradientes, neon, sombras decorativas ou animações de acionamento.
- Cabeçalho simples com marca de três faders, nome, v1.3 e PARAR fixo. Barra de reprodução **93 px** no celular, com efeito, estado, volume e teste, sem o painel decorativo da versão anterior.
- Favoritos começam em **288 px** de altura na tela de 390 px, sem controles administrativos à frente da grade. Todos os efeitos reúne pesquisa/categoria. Biblioteca reúne cadastro, edição, backups, ordenação, armazenamento, offline, instalação e créditos.
- Cartões de **112 px** no celular, ícones padronizados, nomes de 12 px em até duas linhas com nome completo acessível, favorito discreto e borda de reprodução sem mudança de dimensões. Três colunas a partir de 360 px; duas abaixo disso; até oito no desktop dentro de largura máxima.
- PARAR permanece no cabeçalho e no topo fixo de todos os diálogos. Áreas seguras, foco visível, teclado e redução de movimento preservados.

## Iconografia

Os **72 SVGs dos efeitos foram substituídos**. Grade 24 × 24, traço 1,75, extremidades/junções arredondadas, sem raster, sombras ou fundos. São **31 ícones do Lucide local 1.8.0 e 41 desenhos próprios**, sem biblioteca de ícones em tempo de execução. A licença integral ISC e a parcela Feather MIT estão em `docs/licencas/ICONES-V13.txt`.

Cada conceito foi confrontado com seu efeito. Campainha, sino e sinal escolar são distintos; buzina representa um carro com ondas; aplausos usa mãos de perfil; grilo tem antenas, corpo e perna traseira; freada usa pneu/piso; torneira fechando tem giro de válvula sem água; encerramento tem cortinas fechadas. A matriz individual em `docs/ICONES-V13.md` documenta os 72 símbolos e suas fontes. A folha `docs/ICONES-V13.png` permite revisar todos em conjunto.

Cores padrão por categoria: dourado dessaturado, azul acinzentado, terracota, sálvia, azul-petróleo, lavanda e rosa antigo. A cor fica no símbolo. Efeitos personalizados mantêm a cor salva e o editor oferece a paleta do sistema. Tons que desapareceriam no cartão recebem ajuste de luminosidade somente na exibição da máscara, com contraste mínimo de 3:1, sem reescrever os dados. SVG personalizado continua como imagem Blob isolada e conserva sua própria arte. O foco usa um token global independente da cor do usuário.

## Arquivos modificados e criados

Modificados:

- `index.html`: cabeçalho/transporte compactos, três destinos de navegação, administração em Biblioteca, rótulos/ajuda e identificação v1.3.
- `styles.css`: design system, responsividade, cartões, máscaras, formulários, estados e foco.
- `js/app.js`: apresentação de ícones, navegação, exposição dos controles de edição, paleta, contraste e retorno do foco. O fluxo de áudio e transações é chamado da mesma forma.
- `js/catalog.js`: somente cores padrão por categoria; mesmos nomes, IDs, associações e configurações de áudio.
- `assets/icons/*.svg`: 72 efeitos e marca. Atualizados os PNGs PWA 192/512 e maskable.
- `manifest.webmanifest`, `package.json`, `sw.js`: v1.3/tema e novos hashes de recursos essenciais.
- `LEIA-ME.txt`, `docs/PUBLICACAO.md`, `.gitignore` e auxiliares locais de pacote/prévia.
- `tests/browser.cjs` e `tests/advanced.cjs`: caminhos de navegação adaptados ao novo local do cadastro/edição; mesmas verificações funcionais preservadas.

Criados:

- `tests/v13-ui.cjs`: contratos visuais, navegação, cores, contraste de personalização e foco.
- `docs/ICONES-V13.md`, `docs/ICONES-V13.png`, `docs/licencas/ICONES-V13.txt`.
- `docs/VALIDACAO-V13.json` e este relatório.
- `work/cache-v13.py`: regeneração somente do cache, sem reconstruir a curadoria.
- `work/verify-v13.cjs`, auxiliares de iconografia e baseline em `work/v13-baseline/`.
- `soundboard-v1.3-publicacao.zip`: pacote estático para publicação manual, sem perfis ou backups particulares.

## Preservação comprovada

**80 arquivos protegidos mantêm SHA-256 idêntico ao baseline**, incluindo os **71 MP3**, inventário, documentação original de áudio/licenciamento e os módulos `audio.js`, `storage.js`, `backup.js`, `validation.js` e `offline.js`.

Continuam os 72 IDs, um efeito por vez, toque repetido para parar, cancelamento de cargas antigas, loops, volume/compressor/teste, silêncio dramático, favoritos/ordem, cadastro/edição/substituição, IndexedDB/migração, backup com bytes de áudio, importação atômica, SVG seguro, PWA/offline e caminhos relativos de subdiretório. Nenhum MP3 foi recodificado, renomeado ou removido; condições de licença e atribuições de áudio permanecem intactas.

O novo build armazena o shell e os ícones novos e reutiliza o contêiner de mídia existente. O identificador técnico `soundboard-v12-media-*` é mantido por compatibilidade, para não descartar os downloads da v1.2; o hash de build e a versão pública são novos. O banco `soundboard-v11` também mantém seu nome e sua versão de esquema.

## Verificações

- **19 testes Node** de sessão, concorrência, cache PCM, backup, integridade, conflitos, entradas hostis e cache offline passaram.
- `tests/browser.cjs`: reprodução/segundo toque/PARAR/repetição, teste de áudio, cadastro, SVG próprio, edição/substituição, exclusão, persistência, backup com áudio, cópia de conflito, restauração de volume/ordem, offline oficial/local e reinício do navegador sem rede.
- `tests/advanced.cjs`: migração v1, Blobs/favoritos/volume, SVG hostil, rollback de transação, prévia cancelável, ação de silêncio substituída, criação concorrente de categoria e atualização PWA aguardando confirmação.
- `tests/v13-ui.cjs`: 280/320/360/390/768/1440 px sem rolagem horizontal; duas/três colunas móveis; 72 máscaras uniformes; seis cores das categorias oficiais; administração subordinada; PARAR nos modais; retorno útil do foco; cor escura preservada no banco com ícone/foco legíveis.
- XML válido em 73 SVGs, 72 geometrias únicas e 72 efeitos diferentes do baseline. PNGs/maskable e renderização sem corte verificados; folha individual inspecionada.
- Revisão independente encontrou a regressão do foco associado à cor e a perda de foco ao concluir edição. Ambas foram reproduzidas antes das correções e passaram nas regressões seguintes. Não houve alteração no núcleo para resolvê-las.
- Sintaxe dos módulos e hashes finais de todos os recursos essenciais conferidos. Site servido sob `/soundboard/`, mantendo compatibilidade com GitHub Pages.

As capturas de QA estão em `work/v13-favorites-mobile.png`, `work/v13-mobile-first-screen.png` e `work/v13-desktop.png`; medidas em `work/v13-ui-results.json`. O relatório de preservação e hashes está em `docs/VALIDACAO-V13.json`.

## Limitações

Chrome no Windows com viewport/toque emulados foi o navegador disponível. Não se afirma teste em Chrome Android físico, Safari/iOS real, instalação física da PWA, fones ou Bluetooth. A escuta perceptual e a qualidade auditiva dos loops da biblioteca permanecem pendentes como na v1.2; esta atualização visual não as recertifica. Nenhum site público foi usado para validar deploy, pois a publicação foi proibida.

## Publicação e atualização

Nada foi publicado. Extraia `soundboard-v1.3-publicacao.zip` na raiz do destino e preserve diretórios e créditos. No GitHub Pages: **Settings → Pages → Deploy from a branch → branch desejada → /(root)**. Detalhes em `docs/PUBLICACAO.md`.

Na mesma origem da v1.2, abra online e use **Atualizar agora** quando oferecido; o aplicativo interrompe o som antes de ativar o shell novo. Fechar todas as abas e reabrir também permite ativar uma versão aguardando. **Não limpe os dados do site**: isso apagaria arquivos personalizados. Depois da atualização, confira **Biblioteca → Preparar uso offline** e o estado dos 71 áudios. Outro domínio/origem exige transferência dos personalizados por backup.
