# Revisão da pasta Soundboard v1.3

Revisão realizada em 24/10/2026, em `C:\Users\vitor\Downloads\soundboard-v1.3`.

## Resultado

Nenhum arquivo necessário ao funcionamento ou à manutenção atual do aplicativo está ausente. O núcleo da aplicação, os áudios atuais e os documentos de licença permanecem íntegros. Nenhum MP3 foi escrito ou recodificado nesta revisão.

A comparação inicial com os 7.954 arquivos registrados antes da renomeação encontrou quatro ausências: os ZIPs de publicação v1.2 e v1.3 e dois arquivos de sessão do perfil de testes do Chrome. As 41 alterações detectadas estavam somente nesse perfil de testes; fora dele, nenhum arquivo existente diferia do registro. Perfis de testes são artefatos temporários, separados dos dados do navegador do usuário.

## Correções

- Recriado `soundboard-v1.3-publicacao.zip` a partir dos arquivos atuais. Antes da inclusão deste relatório, o pacote recriado teve exatamente o mesmo SHA-256 do pacote anterior: `35f0fef23c212474a8102ed7a0b934ddcdc15caa1b8c68faaf68eaf28a4109e9`.
- O ZIP histórico v1.2 não foi recriado: não é necessário para executar, manter ou publicar a v1.3. Seus documentos de origem e licenças continuam preservados no projeto.
- Corrigidos os caminhos absolutos antigos de seis utilitários históricos, para resolver a raiz pela localização do próprio script: `work/v13-icons/generate.cjs`, `validate.cjs`, `preview-refinements.cjs`, `work/audio/process-ambientes.py`, `fetch-ambientes.py` e `research_efeitos.py`. Os originais desses scripts foram guardados em `work/folder-audit/original-utilities/`.

## Verificações

- 72 cadastros, com 71 MP3 e a ação Silêncio dramático; hashes e tamanhos conferidos.
- 72 ícones principais, 72 máscaras de acento e o SVG da marca: 145 XMLs válidos.
- 163 referências locais conferidas em HTML, módulos, estilos e manifesto.
- 164 recursos essenciais e 71 referências de áudio do Service Worker com hashes corretos.
- 13 arquivos JavaScript e nove scripts Python verificados quanto à sintaxe.
- 19 testes unitários aprovados.
- Testes funcionais no Chrome aprovados: reprodução única, troca, PARAR, loop, volume, cadastro, edição, substituição, favoritos, migração, backup/importação, persistência e operação offline após reiniciar o navegador.
- Os 71 MP3 foram decodificados no Chrome e comparados com os hashes/tamanhos do inventário.
- Interface verificada de 280 a 1440 px, sem rolagem horizontal.
- Prévia local responde em `http://127.0.0.1:57210/soundboard/`, mantendo a mesma origem.
- O pacote contém apenas os arquivos estáticos e documentação; não inclui perfis de testes, ferramentas executáveis ou backups de trabalho.

## Organização adequada

| Local | Finalidade |
|---|---|
| `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll` | Aplicação estática, aparência, PWA e publicação |
| `js/`, `audio-library.json` | Lógica e inventário atual |
| `assets/`, `sons/` | Ícones locais e os 71 áudios |
| `docs/`, `LEIA-ME.txt` | Uso, atribuições, histórico de licença e instruções |
| `tests/`, `package.json` | Verificações de manutenção |
| `work/` | Ferramentas, fontes, evidências, snapshots e perfis temporários de teste |
| `soundboard-v1.3-publicacao.zip` | Pacote pronto para publicação estática |

Os arquivos em `work/` são adequados ao histórico e à manutenção, embora muitos não sejam necessários para executar o site. A pasta ocupa aproximadamente 1 GiB, incluindo fontes, ferramentas e caches de testes. Nenhum desses arquivos de trabalho foi excluído nesta revisão.

Para novas substituições manuais em `sons/`, mantenha os nomes e use `work/sync-audio.py` e `work/cache-v13.py`, nessa ordem, e envie os arquivos diretamente ao GitHub, sem gerar ZIP. Os geradores antigos são históricos e não devem substituir esse procedimento.

A validação automatizada não equivale a escuta física em alto-falantes/fones/Bluetooth ou a teste em Chrome Android e Safari iOS reais. Nenhum deploy foi realizado.

Registros técnicos: `work/folder-audit-initial.json`, `work/folder-runtime-check.json`, `work/folder-audit-results.json` e `work/package-report.json`.
