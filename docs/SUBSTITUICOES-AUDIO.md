# Substituições de áudio fornecidas pelo usuário

O usuário confirmou em 24/10/2026 que substituiu gravações e possui licença de uso de todos os arquivos fornecidos. Os MP3 são mantidos byte a byte, sem normalização, cortes ou recodificação.

O inventário atual está em `audio-library.json`. As fontes e licenças das gravações anteriores permanecem em `licencas/inventario-original-v12.json`, `BIBLIOTECA-AUDIO.md` (v1.2) e `licencas/evidencias.json`; essas atribuições históricas não são aplicadas aos arquivos substitutos. Os termos específicos e a abrangência de redistribuição das substituições não foram informados.

| Efeito | Arquivo atual | Duração | SHA-256 |
|---|---|---|---|
| Passos | `sons/passos.mp3` | 18.024 s | `6be0a0028cccdfc6357dc26e0b6057f8da692caa4f3f94183b7a11ee899a3cd1` |
| Explosão | `sons/explosao.mp3` | 2.821 s | `aca0d73a429c99709c42d3f310a4a2baecaab2bf962c4c973e6540a7c313a7ae` |
| Água espirrando | `sons/agua-espirrando.mp3` | 4.512 s | `ab3e3d531eda3c00a5353a21e1e83fea1a3542c5c690ac17cf21325481e15430` |

Após novas trocas manuais, mantenha os mesmos nomes e execute, na raiz do projeto:

```text
python work/sync-audio.py
python work/cache-v13.py
```

A sincronização usa o FFmpeg já disponível em `work/tools/ffmpeg/bin/` apenas para inspeção e decodificação. O aplicativo pronto continua sem essa dependência. Envie diretamente os arquivos atualizados ao GitHub, conforme PUBLICACAO.md; não gere ZIP. O cache é atualizado sem apagar IndexedDB ou arquivos particulares. Na PWA, use **Atualizar agora** e refaça **Preparar uso offline**. Não execute o pipeline histórico `work/build.py` para esta operação.
