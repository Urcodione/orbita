# Órbita 0.3.3 — viveiro Aural

Entrega: restauração com duas artes próprias e cultivo pago de samambaia-lume. Um canteiro custa 12 Lumes e 2 minérios, rende 3 plantas e exige duas extrações com coleta em locais distintos após o plantio. Evacuação e repetição não avançam. Colheita só ocorre com espaço, sem perder o cultivo. Partidas antigas migram preservando a restauração.

## Validação

- aural-garden.test.cjs: restauração, custos, coleta real, evacuação, repetição, migração, depósito cheio, colheita única e conversão em oxigênio.
- qa/aural-garden-browser-test.cjs: estados visuais e bloqueios em 320×568 e 390×844.
- qa/delivery-receipt.cjs: extração rica com progresso do viveiro, sem overflow em 320 e 390 px.
- Regressões civilization-activities, explorer-record e storage; atividades das civilizações no navegador.
- qa/android-first-run-test.cjs: conteúdo extraído do APK, campanha zerada, intro, início, ação e recarregamento em dois tamanhos.
- APK e AAB assinados; HTML empacotado idêntico ao build, acrescentando apenas a identificação Android.

Não testado em aparelho Android físico. Os testes de navegador não validam gestos e ciclo de vida nativos.
