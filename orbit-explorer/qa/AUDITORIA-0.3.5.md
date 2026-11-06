# Auditoria do jogo existente — 0.3.5

## Correções reproduzidas

- A coleta podia avançar flora, balizas ou sistemas de uma aliança sem mostrar isso no recibo. A extração agora inclui o progresso real do povo, somente quando aumentou. A comparação usa o estado anterior à extração, não concede progresso a evacuações nem repete notificações sem avanço.
- Veyra aceitava pagamento para ler um planeta já analisado. A ação agora bloqueia com explicação, sem consumir Lumes/dados. Leituras de outros mundos continuam funcionando.

## Verificações

- 36 arquivos de testes de regras existentes passaram. Dois testes de campanha inicialmente esbarraram na permissão de gravar fixtures; reexecutados com acesso apropriado, passaram, incluindo 70 extrações de núcleos e final da campanha. Esses testes têm preparação artificial e não medem dificuldade humana.
- Novo audit-journey.test.cjs: cinco sementes, todas as extensões de regras carregadas, recursos iniciais intactos; saída, coleta, retorno, extração e restauração do save. Combustível e oxigênio diminuem. Não é simulação completa dos primeiros 60 minutos.
- O roteiro antigo de campanha usa apenas parte das extensões. Com todas carregadas, seu caminho fixo ignora o orçamento de retorno e falha. Não se alterou dificuldade para favorecer esse planejador; o novo teste cobre uma saída prudente com as regras reais.
- 78 verificações de rotas em duas telas: mercado, depósito, categorias, oficina, fabricação, módulos, cancelamentos, análise, exploração e extração.
- Tutorial completo por toque em 360 e 320 px, com recarregamento durante o fluxo: 98 e 91 toques.
- Recibo com carga variada, módulo, item único e progresso simultâneo de cultivo/aliança cabe em 320 e 390 px.
- Serviços das civilizações: bloqueio de leitura já analisada, compra de leitura válida, limite de recuperação e cartões em 320/390.
- APK real: introdução, partida zerada, primeira ação, salvamento e reload em duas telas.

## Desempenho observado

Chromium local, viewport 390×844: DOMContentLoaded 534 ms, load 537 ms, HTML 12.618.500 bytes, heap aproximadamente 44 MiB. Cinco ciclos de abrir/fechar menu: 87, 114, 66, 67 e 67 ms (incluem espera e cliques do Playwright). Não representa dispositivo Android, FPS ou toque físico. Nenhuma otimização especulativa aplicada.

## Entrega

0.3.5, versionCode 17. APK/AAB assinados com as chaves existentes; saves anteriores preservados. Sem mecânicas, artes ou missões novas. Permanece necessária a validação em aparelho físico, especialmente ciclo de vida, gesto Voltar e desempenho em hardware modesto.
