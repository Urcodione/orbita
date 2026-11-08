# Correções de coerência — civilizações e mercado

- Encomendas pendentes verificam ocorrência real de materiais na galáxia; a mera presença do bioma não basta. Pedidos válidos existentes permanecem. Pedidos concluídos preservam item e pagamento, sem liberar recompensa repetida. Minério e cristal têm depósitos básicos em todos os mundos.
- Dados ambientais continuam gratuitos para segurança do planejamento. O serviço Veyra passa a destacar um depósito especial real e o ponto onde é encontrado. Mundo sem depósito especial não permite cobrança. Nenhuma descoberta ou coleta é concedida pela leitura. O relatório aparece também em Ambiente e continua sujeito ao estoque restante do local.
- As pistas usam E.deposits, a mesma ocorrência dos recursos de exploração; localização segue a distribuição determinística dos depósitos especiais por ponto.
- Thar explica que desmontagem rende minério/Lumes, e que a liga é fabricada na oficina. Mostra recuperação (1 liga + 12 Lumes), custo partindo do zero (3 minérios + 16 Lumes) e fabricação normal de cada componente, deixando visível a troca de pesquisa/cristais por Lumes e liga. Sem alteração de preço ou limite.
- Setas do mercado percorrem somente a categoria do item atual e preservam compra/venda. Quantidade volta a 1 para uma nova cotação; preço e confirmação continuam explícitos.

## Validação

- civ-market-coherence.test.cjs: 60 sementes × 8 galáxias, 3.408 encomendas com fontes reais, 5.460 localizações coerentes; entrega histórica impossível já paga continua paga; comparação de custos de Thar deriva das receitas.
- Regressões civilization-services.test.cjs, voyage.test.cjs, civilizations.test.cjs e economy-balance.test.cjs passaram.
- qa/civilization-services-browser-test.cjs: leitura real, bloqueios, recuperação, limite e liga ausente em 320×568 e 390×844, sem rolagem interna.
- qa/civ-market-coherence-browser-test.cjs: navegação real até a estação, categoria preservada, venda mantida e compra mantida em ambas as telas.

Build offline atualizado; APK/AAB não regenerados nesta entrega. Partidas antigas e valores comerciais preservados.

## Revisão 0.3.7 — estabilidade das encomendas

A geração das ofertas não depende mais de quais slots foram entregues. Um recibo persistido guarda recurso, quantidade e recompensa de cada nova entrega. Entregar uma encomenda não altera a outra nem muda o histórico.

408 entregas testadas nos dois sentidos, com retorno ao entreposto, save/load, tentativa de pagamento repetido e rejeição de recibos inválidos. Os contratos anteriores sem recibo mantêm a identificação legada e o estado pago. A versão intermediária de navegador não registrava o recurso entregue: não é possível reconstruir com certeza esses históricos; nenhum contrato concluído é reaberto ou pago novamente.
