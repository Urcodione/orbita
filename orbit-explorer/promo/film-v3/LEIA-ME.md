# Órbita — filme de apresentação

`orbita-filme-1080p.mp4`: filme promocional animado, 36 segundos, horizontal 1920 × 1080, 30 fps, H.264 e áudio AAC estéreo.

Uma travessia contínua acompanha a Andorinha entre mundos florestais, glaciais, vulcânicos, gasosos e cristalinos. A nave tem movimento e propulsão independentes; estrelas e planetas passam em profundidades diferentes. O portal encerra a travessia com a assinatura do jogo. Não há sequência de cartazes ou transições de slides.

É uma representação artística promocional com as artes existentes, não uma gravação de gameplay nem uma simulação 3D de todos os lados da nave. A trilha original do projeto foi adaptada à duração, com novos efeitos sintetizados de motor, passagem e portal. Sem locução.

Produção local: a geração de vídeo do Canva não estava disponível no plano conectado. Nenhuma arte foi enviada ao serviço.

Para reproduzir, na raiz do jogo:

```
node promo/film-v3/sound.cjs
node promo/film-v3/render.cjs
```

`--preview` gera somente os seis quadros de revisão. Requer o Chrome, Playwright já usado pelo projeto e FFmpeg. As imagens PNG/WebP originais permanecem intactas.
