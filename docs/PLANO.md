# Soundboard v1.2 — plano de implementação

Objetivo: mesa móvel de uso imediato, 72 IDs preservados, SVGs individuais, gravações licenciadas verificáveis e expansão local segura. Especificação: ESPECIFICACAO.txt. Execução autônoma autorizada pelo usuário, sem perguntas intermediárias.

Arquitetura: HTML/CSS locais; js/catalog.js para definições; audio-library.json e js/audio-library.js para proveniência e disponibilidade; js/audio.js para sessão única e cache PCM limitado; js/storage.js para transações IndexedDB; js/backup.js e js/validation.js para fronteiras de entrada; js/app.js para interface; js/offline.js e sw.js para cache verificável e atualização consentida.

Restrições: modificar somente esta pasta; sem deploy, backend, CDN, gravações falsas ou downloads protegidos; pt-BR; manter IDs, banco soundboard-v11, blobs e favoritos antigos; não inventar sino-demo.wav ausente.

- [x] 1. Inspecionar todos os arquivos, registrar auditoria e preservar originais.
- [x] 2. Curar áudios reais (tarefas independentes 1–42 e 43–72), guardar evidências, medir e registrar pendências.
- [x] 3. Produzir 72 SVGs exclusivos e identidade PWA local.
- [x] 4. Escrever testes de sessão/concorrência e importação; observar falhas antes da implementação.
- [x] 5. Implementar áudio, armazenamento compatível e validação/backup atômico.
- [x] 6. Implementar interface pt-BR, apresentação/edição, cadastro, categorias e reordenação acessível.
- [x] 7. Implementar cache com inventário/progresso e atualização sem interromper apresentação.
- [x] 8. Integrar curadoria, créditos e documentação por registro.
- [x] 9. Validar em navegador: larguras 320/390/768/1440, áudio, concorrência, CRUD, persistência, backup v1/v2, SVG hostil, offline e subdiretório; revisar código e corrigir achados.
- [x] 10. Relatar resultados reais, pendências e instruções Pages/PWA, sem publicação.

Riscos que guiam os testes: carregamento antigo terminar depois de PARAR; falha no meio de importação; migração dos Blobs v1; SVG/caminho malicioso; indicador offline afirmar completude sem bytes armazenados.
