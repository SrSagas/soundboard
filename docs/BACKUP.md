# Formato de backup

`soundboard-backup`, versão 2, JSON UTF-8. A versão 1 da aplicação anterior continua aceita. Nenhum backup é interpretado como código.

- `sounds`: registros com `id`, `name`, `category`, `icon`, `color`, `loop` e `builtin`.
- Áudio personalizado/substituição: `blobBase64`, `blobType`, `byteLength` e `sha256` SHA-256 dos bytes. O arquivo inteiro está no backup.
- `iconSvg`: SVG permitido pela lista fechada de elementos/atributos. É novamente validado na importação e renderizado como imagem Blob isolada.
- `favorites`: identificadores na ordem escolhida; `categories`: categorias personalizadas; `volume`: percentual salvo; `createdAt`: instante ISO.
- `part`, quando necessário: `{id, index, total}`; todos os arquivos com o mesmo `id` pertencem ao mesmo conjunto.

Bibliotecas grandes são divididas automaticamente em partes estimadas em até 64 MB. Cada parte é baixada com seu botão para evitar bloqueio de múltiplos downloads. Guarde **todas as partes** e importe-as na ordem indicada. Na última parte, escolha **Restaurar a ordem do backup** se desejar restaurar a ordem completa dos favoritos. Cada parte contém categorias e referências de favoritos do conjunto inteiro. Uma importação individual é limitada a 250 MB para controlar o uso de memória no celular.

Arquivos oficiais não são duplicados no backup; os metadados alterados desses efeitos são incluídos. Seus caminhos são reconstruídos pelo catálogo da aplicação receptora. Arquivos oficiais substituídos localmente levam o novo áudio no backup.

Na importação, todos os metadados, hashes, SVGs e áudios são validados antes de qualquer gravação. A confirmação oferece preservar conflitos, criar cópias (com novos IDs) ou substituir os mesmos IDs. Cópias precisam de áudio próprio; metadados oficiais sem áudio local são preservados nesse modo. Favoritos podem ser mesclados ou restaurados na ordem do backup; volume só é restaurado quando marcado. A escrita de áudios e configurações usa uma única transação IndexedDB: uma falha provoca rollback integral da parte atual. Partes já importadas permanecem intactas.

O banco continua `soundboard-v11`, agora versão 2. Os stores `sounds` e `settings` não são apagados; o upgrade acrescenta apenas `meta`. Blobs, IDs, favoritos e volume antigos são lidos sem transferência para outro banco. Aliases antigos de ícones são traduzidos para os novos SVGs, inclusive na exportação.

Um backup contém seus arquivos particulares. A aplicação não o envia nem publica automaticamente. O armazenamento do navegador pode ser removido pelo sistema ou pelo usuário: mantenha uma cópia externa.
