# Check global — Órbita 0.2.2

Concluído em 21/10/2026. As correções estão no jogo completo, na prévia compacta e no APK 0.2.2.

## Correções verificadas

- Retomar a expedição glacial da campanha após recuperar o núcleo preserva carga, energia e progresso. A alteração de bioma da missão é restaurada antes da validação da expedição.
- Salvamentos em JSON preservam o estado do tutorial, inclusive a decisão de pulá-lo.
- Cancelar a comparação de um módulo retorna ao cartão de origem; o botão inferior do depósito segue o mesmo retorno da seta superior.
- Abrir estoque ou depósito para resolver a falta de espaço de uma receita retorna à mesma receita. Uma visita anterior ao estoque não altera esse destino.
- Inspecionar um módulo instalado a partir do estoque preserva a origem e a nave ao fundo.
- O botão Voltar do Android usa os pais funcionais do jogo. O invólucro reserva espaço para recortes da tela e barras visíveis.
- A prévia fica abaixo de 1 MB por compactação de código e compartilhamento de texto repetido nas imagens. Todos os 13 arquivos de imagem são reconstruídos com bytes idênticos aos originais compactos, incluindo transparência e perfis de cor.

## Testes concluídos

| Verificação | Resultado |
|---|---|
| 15 suítes de regras: engine, universe, energy-return, expedition, modules, economy, economy-balance, materials, biology, catalog, coherence, campaign-progression, campaign, tutorial, campaign-save | Passaram |
| Simulação da campanha completa | 144 extrações, oito capítulos |
| Progressão inicial sem conceder recursos | Cinco sementes passaram |
| route-consistency-test.cjs | 64 verificações em 390×844 e 320×568 |
| final-navigation-test.cjs | 68 verificações em 390×844 e 320×568 |
| tutorial-browser-test.cjs | Tutorial completo e retomada após recarregar em 360×740 e 320×568 |
| campaign-finale-test.cjs | Módulos cósmicos, proteção permanente, coleção e cinemática final em duas telas |
| android-first-run-test.cjs | Conteúdo real do APK: campanha zerada, intro, iniciar, análise e retomada em 360×740 e 412×915 |
| mobile-inline-test.cjs | Interação, salvamento e restauração no sandbox; sem erros de navegador |
| preview-assets-test.cjs | Fragmento de 997.962 bytes; 13 imagens preservadas byte a byte |
| APK | ZIP íntegro, assinatura v2/v3 válida e mesmo certificado da 0.2.1 |

## Pacote

- Arquivo: `android/dist/orbita-0.2.2.apk`
- Versão: 0.2.2, código 4, mínimo Android 8.0 / SDK 26, alvo SDK 35.
- Tamanho: 5.599.772 bytes.
- SHA-256: `96f724f7ac7639f40b70d64741ee99c09b71585f8d80285eaa66f8f54b882777`.
- Único asset: `assets/index.html`, igual ao jogo completo com a identificação do invólucro Android.
- Nenhuma partida pré-gravada, arquivo de teste ou permissão Android incluída.

## Limites

Os testes funcionais do APK executam seu conteúdo real no Chromium isolado. Não houve instalação em aparelho ou emulador Android; gestos nativos, recortes e pausa/retomada ainda precisam de teste físico. A simulação completa verifica progressão e requisitos, mas não mede cinco horas de duração por um jogador. Os testes não esgotam todas as combinações de estados e equipamentos.

As verificações usaram partidas descartáveis e não alteraram o progresso real do jogador.
