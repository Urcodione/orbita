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

## Revisão complementar após 0.3.7

- Troca de qualquer módulo verifica o volume do módulo retirado, não apenas trocas do depósito. Reproduzido com Casco Bastião: a troca permitia passar de 250/250 para 253/250. Comparação e instalação agora rejeitam a mesma operação, sem gastar nem alterar inventário; com 3 unidades livres a troca funciona.
- Negociar um recurso registra sua descoberta permanentemente. Em partidas antigas com material em estoque mas sem registro de descoberta, vender a última unidade não volta a ocultá-lo.
- Histórico inválido de recibos é rejeitado sem lançar exceção. A consulta usa um conjunto de identificadores pagos, evitando procurar toda a lista novamente para cada recibo.
- A prévia de ações sem impacto no depósito não recalcula seu volume. O registro global de descobertas é consultado para dobra, em vez de repetir a busca a cada ação; o aviso de sobrecarga calcula o volume uma só vez.
- Testes: `followup-coherence.test.cjs`, depósito, módulos, economia, encomendas, carga explícita, salvamento de campanha, viveiro Aural, civilizações, atividades, serviços e rotas de estação. Interface de mercado e serviços verificada em 320 e 390 px.
- Jogo de navegador atualizado. Os pacotes Android 0.3.7 anteriores não contêm esta revisão complementar.

## Revisão de habilidades da frota após 0.3.8

Antes das correções foram reproduzidos cinco problemas: previsão de combustível da Beija-flor divergente da cobrança, resgate oferecido apesar de viagem gratuita disponível, Pelicano descartando recursos especiais ao evacuar, depósitos que forneciam carga resgatada voltando a disponibilizá-la, e viajante mantendo a estadia da fronteira no retorno ao Véu de Íris.

- Custos de viagem, previsão e verificação de alcance do resgate usam o mesmo cálculo, incluindo habilidades da nave.
- Pelicano salva a metade inteira de cada recurso comum ou especial; módulos e relíquias não entram nessa recuperação. Depósitos que contribuíram recursos salvos são registrados como coletados. Evacuação comum continua perdendo a carga e permitindo tentar novamente.
- A estadia e o povo do viajante consideram a galáxia real durante o retorno da campanha, sem renovar ofertas em repetidas atracagens.
- `fleet-consistency.test.cjs`: dez naves, custos reais versus previsão, resgate da Beija-flor, recuperação comum/nativa, revisita e reload, retorno via ação da campanha e oferta estável.
- Passaram também testes de frota, viagem, atividades das três civilizações, viveiro, carga explícita, revisitas e locais persistentes; mais 43 testes de motor, universo, estações, energia e expedições.
- Jogo de navegador atualizado; APK/AAB 0.3.8 permanecem os anteriores a esta revisão.
