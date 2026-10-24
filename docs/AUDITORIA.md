# Auditoria inicial — 24/10/2026

Inspeção completa dos quatro arquivos originais e de todos os diretórios antes de qualquer alteração. Não havia Git, dependências, testes ou AGENTS.md no projeto.

| Área | Estado original e decisão |
|---|---|
| Estrutura | index.html (28.280 bytes), sw.js (852), manifest.webmanifest (176), LEIA-ME.txt (1.348), sons/ vazia. Cópia exata em work/original-v1.1/. |
| Catálogo | 72 registros, seis categorias e Memes e TV/Outros, IDs builtin:slug; preservar todos. Apenas o sino apontava para WAV; demais MP3 inexistentes. |
| sino-demo.wav | **Ausente**, inclusive em arquivos ocultos da pasta autorizada. Não foi criado nem substituído por arquivo com esse nome. O LEIA-ME afirmava sua presença incorretamente. |
| Ícones | 32 paths monocromáticos compartilhados entre efeitos; substituir os 72 por ilustrações locais próprias. |
| Favoritos | 12 sugeridos; IndexedDB preserva lista, sem reordenação acessível. |
| Importação | Arquivos Blob no banco soundboard-v11 versão 1, stores sounds/settings. Manter banco e dados; ampliar estrutura sem apagar stores. |
| Backups | JSON v1 contém base64; importação sobrescreve IDs, escreve parcialmente e aceita caminhos insuficientemente validados. Implementar validação integral e transação atômica com revisão de conflitos. Aceitar v1. |
| Reprodução | Web Audio/compressor/volume; token evita início antigo, mas segundo toque durante carregamento não cancela, cada toque decodifica novamente e preview não é limpo no fechamento. |
| Volume | 45% inicial, até 80%; compressor 6:1 excessivo. Preservar preferência existente, padrão novo conservador, compressor moderado e teste na mesma sessão de reprodução. |
| Offline | install addAll inclui sino inexistente: instalação falha. Cache de áudio somente após uso, sem inventário ou progresso; atualização automática pode interromper sessão. |
| PWA | Manifesto sem ícones, escopo ou descrição. Caminhos relativos existentes adequados. |
| Segurança | Nome escapado no DOM, mas SVG próprio não suportado; backup e áudio sem verificação de integridade. |
| Interface | Três colunas responsivas, mas textos STOP/loop/ícones técnicos em inglês, pouca diferenciação e sem estado inicial honesto de disponibilidade. |

O HTML monolítico será separado em módulos nativos, mantendo site estático, Web Audio, IndexedDB, sem frameworks/CDN/backend. Nenhum dado do navegador será limpo. Sem publicação ou alteração externa.
