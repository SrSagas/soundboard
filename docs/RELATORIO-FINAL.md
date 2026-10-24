# Entrega — Soundboard v1.2

Atualização executada em 24/10/2026 dentro de `C:\Users\vitor\Downloads\soundboard-v1.1`. Não houve deploy, criação de repositório, alteração de configurações externas nem instalação global de dependências.

## Implementação entregue

Modificados os quatro arquivos existentes: **index.html, sw.js, manifest.webmanifest e LEIA-ME.txt**. Originais preservados em `work/original-v1.1/`.

Criados:

- `styles.css`: tema escuro, grade móvel de três colunas, cartões estáveis, áreas seguras, foco visível e redução de movimento.
- `js/app.js`: apresentação/edição, pesquisa sem dependência de acentos, categorias, cadastro, substituição, prévia, favoritos e gerência.
- `js/audio.js`: sessão única cancelável, segundo toque para parar, invalidação de carregamentos, cache PCM limitado a 24 MiB, volume sem amplificação, compressor moderado e tratamento de interrupções.
- `js/storage.js`: mesmo banco `soundboard-v11`, upgrade sem apagar stores/dados e transações atômicas.
- `js/backup.js` e `js/validation.js`: backups com bytes/SHA256, compatibilidade v1, conflitos revisáveis, exportação em partes, nomes seguros e SVG isolado por imagem.
- `js/catalog.js`: 72 identificadores oficiais preservados, seis categorias originais, Memes e TV e Outros.
- `js/audio-library.js` e `audio-library.json`: inventário completo, proveniência, licença, processamento, duração, hashes e situação por efeito.
- `js/offline.js`: inventário real do cache, progresso, solicitação de persistência e atualização mediante comando.
- `assets/icons/`: **72 SVGs de efeitos inéditos**, marca `app.svg` e três PNGs PWA. XMLs e geometrias exclusivos verificados; sem imagens raster embutidas ou scripts.
- `sons/`: **71 MP3 reais**, todos associados ao respectivo efeito.
- `.nojekyll`, `.gitignore`, `package.json`, testes e documentação em `docs/`.
- `soundboard-v1.2-publicacao.zip`: site estático e documentação pública, sem perfis, backups pessoais, ferramentas ou downloads originais de trabalho.

Preservados os IDs oficiais, favoritos sugeridos, personalização por cor/categoria/repetição, sons locais em IndexedDB e compatibilidade estática/desktop. A migração foi verificada com uma base v1 de teste contendo Blob, nomes/ícones antigos, favoritos e volume. Não foi necessário ler nem modificar o perfil real de navegador do usuário.

Correções confirmadas: segundo toque durante carregamento, prévia que começava após PARAR, controle PARAR inacessível em modais, reutilização de PCM de outro Blob, prévia da ação de silêncio com arquivo substituto, criação de categoria por dois toques, exportação de aliases antigos de ícone, mensagens nativas em inglês e cache corrompido contado como pronto. Importações inválidas não deixam gravações parciais.

## Biblioteca de áudio

| Situação | Quantidade |
|---|---:|
| Efeitos cadastrados | 72 |
| Arquivos reais obtidos e integrados | 71 |
| Validação técnica independente de arquivos | 71 |
| Ação de silêncio sem arquivo | 1 |
| Downloads pendentes | 0 |
| Escuta perceptual pendente | 71 |
| Arquivos CC0 1.0 | 59 |
| Arquivos CC BY 4.0 | 12 |

Total de áudio: **14.299.315 bytes** (aproximadamente 14,3 MB / 13,6 MiB). Os 71 hashes são distintos. Fontes individuais Freesound e Incompetech; evidências originais arquivadas dentro de `work/audio/`, índice público de evidências em `docs/licencas/evidencias.json`.

Todos os arquivos foram novamente decodificados integralmente com FFmpeg e também com o decodificador real do Chrome. A inspeção independente das amostras finais encontrou **zero amostras em clipping**; maior pico de amostra: **−3,377 dBFS**. Isso não prova ausência de distorção na fonte nem qualidade perceptual: não houve escuta humana ou por ferramenta de audição apropriada. Os níveis foram tratados de acordo com a função; ambientes continuam mais suaves. Trilhas receberam recorte e final suave, com repetição desativada por padrão. Ambientes usam sobreposição de amostras reais; fluidez auditiva dos loops permanece a conferir.

**Silêncio dramático** interrompe a sessão atual e não simula uma gravação. **sino-demo.wav estava ausente** desde a auditoria inicial; não foi inventado nem substituído por arquivo com esse nome. O efeito Sino utiliza uma gravação independente documentada em `sons/sino.mp3`.

Detalhes que afetam a escolha de cena: Contagem regressiva é uma voz inglesa de cinco a um; Rebobinar é fita física; Explosão usa fogo de artifício real; Queda cômica usa assobio descendente autoral. Fontes/edições de cada um estão registradas. Nenhum trecho de TV/meme protegido foi baixado para a categoria Memes e TV.

Os 12 créditos CC BY trazem título, compositor, fonte, licença e indicação da edição; estão disponíveis na interface e na documentação. Ao utilizar essas músicas numa apresentação, conserve o crédito também no programa ou na descrição do evento. As licenças de áudio permanecem as de seus respectivos autores.

## Interface e armazenamento

Auditoria da interface padrão em pt-BR concluída: idioma do documento, controles, formulários, modais, mensagens, acessibilidade, ajuda e manifesto. O efeito cujo ID antigo é `builtin:record-scratch` aparece como **Disco arranhando**. Títulos originais das obras nos créditos são mantidos para atribuição correta; nomes personalizados pertencem ao usuário.

PARAR fica fixo no cabeçalho e em todos os modais. Edição é um modo separado e não reorganiza cartões durante a reprodução. Favoritos têm setas acessíveis para reordenar. O cadastro aceita ícones existentes ou SVG simples conferido; nunca injeta SVG importado no DOM. Arquivos personalizados não são enviados à internet. Há limites técnicos de 30 MiB por áudio e 64 MiB de PCM decodificado por efeito para preservar memória; não há limite artificial de 72 cadastros. Cota/erros de armazenamento são apresentados na Biblioteca.

Backups incluem os próprios áudios particulares, ícones, categorias, favoritos, ordem e configuração de repetição. Conflitos podem ser preservados, copiados ou substituídos após revisão. Ordem dos favoritos e volume podem ser restaurados explicitamente. Bibliotecas grandes oferecem partes para download; leia `docs/BACKUP.md`.

## Verificações realizadas

- **19/19 testes Node**: concorrência, cancelamento, término de sessão, cache/versionamento de Blob, ganho, backup íntegro, v1, caminhos/IDs inválidos, conflitos, partes, ordem, cache corrompido, cabeçalhos e tradução de erros nativos.
- **Fluxo Chrome completo** em 320, 390, 768 e 1440 px: sem rolagem horizontal, três colunas em 390 px, 72 ícones diferentes, reprodução/segundo toque/PARAR/repetição, teste de áudio, cadastro, edição, substituição e persistência.
- Exportação com áudio/hash; importação criando cópia sem sobrescrever; restauração opcional de volume/ordem; áudio oficial e local sem rede; **fechamento e reinício do Chrome sem rede** mantendo o áudio local.
- Migração real IndexedDB v1→v2 em perfil isolado, Blob preservado, aliases de ícone, volume e ordem. Uma transação com segundo registro inválido reverteu integralmente a primeira gravação.
- Cinco SVGs hostis rejeitados no DOMParser real: script, evento, imagem externa, referência externa e entidade XML. Arquivo de texto renomeado como áudio foi rejeitado antes da decodificação.
- PARAR dentro de diálogos, prévia com decodificação adiada cancelada, substituição de Silêncio dramático, dois cliques na criação de categoria e atualização PWA aguardando confirmação sem interromper um som contínuo.
- Sintaxe dos **9 arquivos JavaScript**, manifesto, 72 XMLs SVG, 71 hashes/decodificações/licenças e ausência de clipping final conferidos. Uso servido em `/soundboard/`, comprovando caminhos em subdiretório.

Revisão independente de código concluída; seis defeitos concretos foram reproduzidos e corrigidos com regressões. As verificações finais passaram após as correções. Evidências: `docs/VALIDACAO-AUDIO.json`, `work/advanced-results.json`, testes executáveis e capturas `work/interface-mobile-first-screen.png`, `work/interface-desktop.png` e `work/biblioteca.png`.

## Limitações e pendências explícitas

- **71 escutas perceptuais pendentes**, registradas individualmente no inventário; não se declara a curadoria auditiva concluída.
- Sem reprodução física em telefone, alto-falante, fone ou caixa Bluetooth; sem medição real de latência.
- Sem Safari/iOS físico ou WebKit disponível neste ambiente. Foram usados Chrome no Windows e emulação de viewport/toque; isso não equivale à certificação em aparelhos reais.
- A permanência dos dados offline depende de espaço, permissões e política do sistema. Bluetooth pode acrescentar latência; para marcação extremamente precisa, cabo pode ser preferível.
- Não houve teste público de GitHub Pages porque publicação foi expressamente proibida; o site foi validado localmente em subdiretório.

## Publicação e cache

Nenhuma publicação foi feita. Extraia o ZIP estático no destino escolhido e siga `docs/PUBLICACAO.md`: GitHub **Settings → Pages → Deploy from a branch**, selecione branch e **/(root)**. Preserve os créditos, o manifesto e todos os caminhos relativos.

No primeiro acesso online, use **Biblioteca → Preparar uso offline** e aguarde os 71 arquivos conferidos. Para instalar: menu/Instalar no Android; Compartilhar → Adicionar à Tela de Início no Safari. Uma atualização fica aguardando **Atualizar agora**; a ativação interrompe a reprodução e recarrega sem apagar IndexedDB. Ao atualizar de uma instalação v1.1 que não mostre o aviso novo, feche todas as abas depois de abrir online e reabra para permitir a ativação. Não limpe dados do site como método de atualização.
