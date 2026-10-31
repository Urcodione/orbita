# Rotas de navegação — revisão 0.2.2

## Regra

A seta superior volta ao local funcional indicado pelo rótulo; a legenda da seta mostra o nome desse local (Menu, Oficina, Receita…). O X fecha o painel e revela o jogo por trás; cartões abertos pela inspeção da nave voltam à nave aberta. Abas trocam explicitamente o local principal. Paginação muda somente o conteúdo do painel, sem mudar seu local.

## Destinos após ações

| Ação | Destino |
|---|---|
| Analisar / ancorar | Mesmo planeta, controles atualizados |
| Iniciar expedição | Terreno da expedição |
| Coletar / mover / escanear terreno | Mesmo terreno |
| Interagir com núcleo | Circuito |
| Recuperar núcleo | Terreno, módulo ainda na carga |
| Pedir retorno | Confirmação com custo de energia |
| Confirmar retorno do veículo | Base no terreno; ainda requer extração |
| Extrair recursos ou módulo | Resumo da carga sobre a tela do planeta |
| Evacuar ou perder o veículo | Planeta; falha mostra resultado quando aplicável |
| Cancelar risco / evacuação / retorno | Terreno, sem executar a ação cancelada |
| Viajar / dobrar / resgate / retorno da campanha | Planeta atual, seleção e sistema sincronizados |
| Decolar | Fecha painel; preserva mapa se estava planejando rota |
| Comprar / vender / abastecer / reparar / refinar | Mesmo painel com saldo atualizado |
| Fabricar componente | Receita da peça; lote de ingrediente retorna à receita que o pediu |
| Fabricar módulo | Peça pronta; seta retorna à receita de fabricação |
| Receber recompensa Farol | Peça pronta; seta retorna à campanha |
| Instalar módulo | Permanece no local de origem: lista de módulos (para instalar outros), receita da oficina (para fabricar outros) ou painel da missão; peças escolhidas na nave aberta voltam à nave aberta. Um cartão translúcido lista os atributos que mudaram. |
| Cancelar desmontagem | Mesmo cartão e mesmo módulo |
| Desmontar | Módulos guardados ou módulo instalado do compartimento, conforme origem |
| Favoritar / pintar / renomear | Mesmo contexto, valores atualizados |
| Receber receita de missão | Painel da missão |
| Travessia final | Cinemática; retorno ao jogo preservando partida |
| Nova expedição | Planeta inicial, introdução e tutorial |

## Retornos contextuais corrigidos

- Recurso aberto pelo estoque volta ao estoque; recurso aberto pelo mercado volta ao mercado.
- Oficina aberta pela estação volta à estação; aberta pelo menu volta ao menu.
- Categorias da oficina voltam ao início da oficina de fabricação.
- Requisitos de um local voltam à seleção de locais.
- Peça recém-fabricada retorna ao resultado da fabricação. O resumo "Carga entregue" não oferece comparar/instalar: instalações são feitas pelo estoque ou pela oficina.
- Voltar de uma comparação não reaproveita a seleção de uma reciclagem anterior.
- Recursos do depósito voltam ao compartimento do depósito.
- Armazém acessado pela nave aberta volta à nave aberta.
- Cancelar uma comparação pelo botão inferior tem o mesmo destino da seta superior.
- Liberar espaço ou examinar o depósito durante uma receita permite retornar à mesma receita, sem herdar um destino de uma visita anterior ao estoque.
- Inspecionar um módulo instalado pelo estoque mantém o estoque como origem, sem mudar a nave ao fundo.
- Voltar ao depósito pelo botão inferior retorna ao compartimento, assim como a seta superior.
- O botão Voltar do Android usa os mesmos pais funcionais. Na raiz, abre a confirmação de saída; durante intro/tutorial, os controles próprios e Pular continuam disponíveis.

## Validação

`qa/route-consistency-test.cjs` percorre menus, operações e cancelamentos em 390×844 e 320×568. `qa/route-consistency-report.json` registra cada asserção executada. `qa/cargo-return-test.cjs` verifica os retornos da inspeção do depósito. O tutorial completo também tem teste de ida, extração e instalação com retomada após recarregar.

`qa/final-navigation-test.cjs` acrescenta 68 verificações dos retornos de cartões, receitas com estoque cheio, depósito e da função de retorno usada pelo Android, nas mesmas duas dimensões.

A inspeção de código cobre os despachos de ações e seus destinos. Os testes não constituem prova de todas as combinações de estados; a execução nativa em aparelho Android continua sendo uma etapa de validação.
