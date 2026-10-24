# Uso local, GitHub Pages e PWA

Nenhuma publicação foi realizada durante esta implementação.

## Usar agora

Sirva a pasta por um servidor estático em localhost ou HTTPS. Não abra `index.html` diretamente por `file://`: navegadores bloqueiam módulos e Service Worker nesse modo. Se já tiver Python instalado, abra um terminal nesta pasta, execute `python -m http.server 8080 --bind 127.0.0.1` e visite `http://localhost:8080`. Para celular, use um endereço HTTPS; localhost no computador não é o localhost do telefone.

## Publicar por conta própria

1. Use diretamente os arquivos de `C:\Users\vitor\Downloads\soundboard-v1.3`. O projeto é mantido nessa pasta, sem geração de ZIP.
2. Para publicar o site, envie `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, `audio-library.json`, `LEIA-ME.txt`, `.nojekyll` e as pastas `js/`, `assets/`, `sons/` e `docs/`. Coloque `index.html` na raiz do repositório. Preserve os caminhos, créditos e documentos de licença.
3. No GitHub, abra **Settings → Pages → Build and deployment → Source → Deploy from a branch**. Selecione sua branch e a pasta **/(root)** e salve. Não selecione `/docs`, que contém somente documentação.
4. Visite o endereço HTTPS fornecido pelo Pages. Todos os caminhos da aplicação são relativos e o funcionamento em `/soundboard/` foi testado.

Referência oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Mantenha `work/` no computador: essa pasta guarda ferramentas, fontes, evidências e perfis de teste, e concentra mais de 8 mil arquivos e aproximadamente 1,1 GB. O site completo tem cerca de 256 arquivos e 16 MB. `tests/` e `package.json` são úteis no repositório para manutenção, mas não são exigidos para executar o site.

Recomenda-se enviar por Git ou GitHub Desktop. O arquivo `.gitignore` existente já exclui `work/`, dependências, logs e backups locais do versionamento. Essa exclusão se aplica ao Git; o envio manual pelo navegador exige selecionar os arquivos corretos. Não é necessário apagar `work/` do computador.

Pelo navegador, o GitHub permite até 100 arquivos por envio e 25 MiB por arquivo. A pasta `assets/` sozinha tem 148 arquivos, portanto precisa ser dividida. Mantenha os diretórios do repositório correspondentes aos locais ao enviar:

| Remessa | Conteúdo do site | Quantidade nesta revisão |
|---|---|---:|
| 1 | Sete arquivos da raiz, `js/` e `docs/` | 37 |
| 2 | `sons/` | 71 |
| 3 | Arquivos diretamente em `assets/icons/`, sem a subpasta `accents/` | 76 |
| 4 | `assets/icons/accents/` | 72 |

Os nomes das pastas precisam ser preservados; enviar ícones ou MP3 soltos na raiz quebra seus caminhos. Git/GitHub Desktop simplifica esse envio, mantendo a estrutura completa.

Referências oficiais: [limites do envio pelo navegador](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [envio de um projeto local por Git ou GitHub Desktop](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).

A aplicação grava personalizados em IndexedDB, sem backend nem envio para o repositório. Exporte esses dados pela Biblioteca para guardá-los; não envie perfis de navegador ou backups particulares.

## Preparar e conferir offline

Abra **Biblioteca → Preparar uso offline** com internet e aguarde a conferência de todos os 71 arquivos. O aplicativo e os ícones são armazenados na instalação; o sino do teste já faz parte dos recursos essenciais. Os demais áudios são obtidos mediante esse comando ou quando reproduzidos.

O indicador conta recursos presentes com hashes conferidos. Uma entrada inválida é excluída e não conta como pronta. Downloads interrompidos preservam o que já foi armazenado; repita o comando para concluir. Feche e reabra o navegador sem rede e teste os favoritos antes da apresentação. O sistema pode remover caches/dados locais por falta de espaço; a solicitação de armazenamento persistente depende da decisão do navegador.

No Android, use Instalar aplicativo quando oferecido. No Safari/iPhone, use **Compartilhar → Adicionar à Tela de Início**. A instalação não substitui a preparação dos arquivos offline.

## Atualizações

`work/cache-v13.py` gera `sw.js` a partir do inventário atual e confere os hashes dos MP3 antes de atualizar o cache. Execute-o após alterar HTML, CSS, JavaScript ou ícones. Ele não reprocessa áudios nem reescreve o inventário ou as condições de licença. A fonte do Service Worker está em `work/sw.template.js`.

Após substituir arquivos manualmente em `sons/`, mantenha os nomes e execute `python work/sync-audio.py` e `python work/cache-v13.py`, nessa ordem. Envie diretamente os arquivos atualizados ao repositório, incluindo inventário, módulos e Service Worker; não gere ZIP. A sincronização registra os arquivos fornecidos pelo usuário, valida a decodificação usando o FFmpeg local e atualiza hashes/durações sem escrever nos MP3. As fontes anteriores ficam preservadas como histórico, sem serem atribuídas aos arquivos novos. Consulte `SUBSTITUICOES-AUDIO.md`. Não execute o pipeline histórico `work/build.py` para sincronizar essas trocas. A execução do site pronto não depende de Python, Node ou FFmpeg.

Publique todos os arquivos atualizados juntos. Uma versão nova fica aguardando e mostra **Atualizar agora**; o comando interrompe o áudio antes de ativar e recarregar. O cache novo só é instalado se todos os seus recursos essenciais corresponderem aos hashes. Caches de outras pastas do mesmo domínio não são apagados. O IndexedDB permanece intacto. Refaça a conferência offline após atualizar.

Mantenha a mesma origem/endereço para continuar usando o banco local existente. Outro domínio ou origem possui outro armazenamento; transfira personalizados pelo backup. Não use Limpar dados do site como procedimento de atualização, pois isso apaga áudios particulares.
