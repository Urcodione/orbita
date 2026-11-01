# Divulgação do Órbita

Dois kits, com papéis diferentes na Google Play:

| Pasta | O que tem | Uso recomendado |
|---|---|---|
| `2026-10-playstore/` | capturas reais do jogo (1080 × 1920), as mesmas com frases, capa 1024 × 500, teaser de 30 s com gameplay | **ficha da Google Play**: capturas de tela, imagem de destaque e vídeo |
| `cinematic-v2/` | seis pôsteres ilustrados "O Coro do Limiar" (1080 × 1920), as pinturas sem texto e um curta ilustrado de 32 s | **redes sociais**, campanha, trailer de lançamento, capa de vídeo |

## Por que separar

A Google Play pede que as capturas de tela mostrem a experiência real do app ou do jogo. Os pôsteres de `cinematic-v2/` são arte promocional, não capturas, como o próprio LEIA-ME deles avisa. Por isso, use-os fora da área de capturas (redes sociais, site, anúncios). Na ficha, use as capturas de `2026-10-playstore/`. O vídeo da ficha também deve mostrar o jogo de verdade: o teaser com gameplay é a escolha mais segura, e o curta ilustrado funciona melhor em redes sociais e no lançamento.

## Checklist da ficha

- **Ícone:** 512 × 512 PNG (já está no projeto Android).
- **Imagem de destaque:** `2026-10-playstore/capa-google-play-1024x500.jpg`.
- **Capturas de telefone (2 a 8):** `2026-10-playstore/images/` (com frases) ou `captures/` (sem frases), todas em 1080 × 1920. A Play aceita até 8, e há 9. Sugestão de 8: 01 nave, 02 módulos, 03 mundos, 04 expedição, 07 xenobiologia, 08 captura, 09 estaleiro e 06 história, deixando 05 mercado de fora.
- As capturas 07–09 mostram as novidades: o laboratório com a coleção de exemplares únicos, a cinemática de captura do Leviatã de vidro e a planta do Estaleiro estelar. Para refazê-las depois de um build novo, rode a partir de `orbit-explorer/`: `node promo/2026-10-playstore/source/capture-novidades.cjs [index.html]`.
- **Vídeo:** a Play aceita só um link do YouTube. Envie o MP4 como público ou não listado, com incorporação habilitada e sem anúncios, e cole a URL na ficha.

## Arquivos grandes

`cinematic-v2/orbita-campanha-cinematica.zip` (55 MB) repete os pôsteres, as pinturas e o vídeo que já estão nas pastas. Passa do limite recomendado pelo GitHub (50 MB). Se o repositório ficar pesado, ele pode sair do Git e ser guardado só no Drive.
