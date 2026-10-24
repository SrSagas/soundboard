# Revisão dos ícones e da cor — Soundboard v1.3

Atualização de 24/10/2026 em resposta à revisão visual do usuário.

Os 72 efeitos agora combinam um contorno principal com um detalhe em segunda cor. Acentos ficam em peças do objeto, sinais de ação ou áreas secundárias; não foram adicionados fundos chamativos, gradientes, pele amarela ou ilustrações de emoji. A paleta continua discreta, com variações semânticas para ajudar a distinguir os efeitos.

Sete símbolos humanos foram substituídos: **Risadas, Aplausos, Vaia, Soco cômico, Mergulho, Terror e Perseguição**. A máscara teatral de comédia substitui o rosto circular de Risadas. Mãos, punho, figura na água, crânio e corredor usam geometrias da biblioteca Phosphor, incorporadas localmente sob MIT. A biblioteca mantém 28 bases Lucide, sete Phosphor e 37 próprias/adaptadas. Atribuições e texto integral das licenças estão em `docs/licencas/`.

A renderização usa dois SVGs locais por efeito: a arte principal e uma máscara de acento em `assets/icons/accents/`. O mapa `js/icon-tones.js` fornece as cores. Ambas as camadas entram no cache offline. Os SVGs personalizados do usuário continuam exibidos como imagens Blob isoladas; suas cores e arquivos não são alterados. A cor escolhida no cadastro permanece preservada, com ajuste de contraste somente na exibição quando necessário.

Esta revisão não escreveu nos MP3, no banco, em favoritos, backups ou núcleo de reprodução. O usuário confirmou as substituições de passos.mp3, explosao.mp3 e agua-espirrando.mp3 e declarou possuir licença de uso. As versões atuais foram integradas ao inventário, cache, pacote e prévia, sem recodificação. O inventário e as evidências originais de licença foram preservados como histórico; os arquivos substitutos não herdam as fontes anteriores. Consulte SUBSTITUICOES-AUDIO.md. Sem deploy ou instalação de dependência de execução.

Verificações: 144 vetores de efeitos/acento renderizados, 145 XMLs válidos incluindo a marca, 72 hashes principais e 72 de acento únicos e conferidos contra os bytes dos arquivos. As capturas foram inspecionadas no tamanho real dos cartões. Os testes de interface cobrem duas camadas com cores diferentes, contraste, foco e tamanhos de tela; os testes funcionais continuam cobrindo cadastro, backup e funcionamento offline. Não houve teste físico de áudio ou Safari/iOS.

Fontes e auditoria visual: [matriz e folha dos ícones](ICONES-V13.md), `work/icon-refinement/report.json`, `work/icon-refinement/validation.json` e `docs/VALIDACAO-V13.json`. O gerador foi ajustado para gravar bytes UTF-8 com quebras consistentes, de modo que os hashes documentados coincidam também no Windows.

O pacote estático e a prévia recebem os ícones novos e os MP3 atuais da pasta. O cache usa hashes atualizados para baixar as substituições e verificar sua integridade. A licença de uso declarada pelo usuário aparece nos créditos desses três efeitos. Na mesma origem do aplicativo, use **Atualizar agora** para ativar a interface; não limpe dados do site.

## Substituição de Pancada por Carregar arma

O cartão usa agora `sons/gun-load.mp3`, fornecido pelo usuário, sem recodificação. `sons/pancada.mp3` foi removido. A nova ilustração mostra arma de perfil e seta de recarga, em cinza claro e dourado discreto. Os dois SVGs mantêm o nome interno `pancada.svg`, assim como o ID `builtin:pancada`, para preservar favoritos e escolhas de ícone em backups anteriores. O nome padrão antigo é atualizado na exibição; nomes e áudios personalizados continuam preservados.

Inventário e hashes offline foram sincronizados também com as demais substituições fornecidas pelo usuário. Um arquivo chamado `carro-arrancando.mp3` contém WAV PCM: seu formato real está registrado no inventário, sem alteração de bytes. Os 71 áudios atuais foram decodificados no Chrome; 19 testes unitários, testes funcionais/offline e de interface passaram. O novo efeito foi reproduzido offline após reiniciar o navegador. Nenhum ZIP ou deploy foi criado.
