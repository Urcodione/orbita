# Proposta: economia viva, expansões e retorno visual

Rascunho para decisão, de 31/10/2026. Os números vêm das simulações registradas em `qa/REVISAO-2026-10-31.md`: 20 campanhas completas jogadas por um bot e 50 mil ações aleatórias.

## 1. Diagnóstico da economia

| Medida | Valor |
|---|---|
| Lumes ao fim do capítulo 1 | ~245 |
| Lumes ao fim do capítulo 3 | 300 a 1.300 |
| Lumes ao fim da campanha | **3.700 a 9.800** |
| Dados de pesquisa no fim | 4.000 a 5.000, sem uso |
| Gasto total de Lumes na campanha | ~1.400 (fabricação ~900 + relíquia 480) |
| Material descartado por falta de espaço | 400 a 900 unidades |
| Espécies (6) | Só a Samambaia-lume tem uso (vira oxigênio). As outras cinco só são vendidas. |

Do capítulo 4 em diante, o dinheiro não compra nada que o jogador queira. Já o capítulo 2 é apertado: o bot chega à galáxia 1 sem minério e esperou o mercado em 9 de 16 partidas.

Princípio, conforme `CAMPANHA-RITMO.md`: não inflar preços nem cobrar taxas. É melhor criar **coisas desejáveis** para comprar, que gerem decisões e variedade.

## 2. Em que o jogador gastaria Lumes

### A. Estaleiro modular (sua ideia de customização da nave)

Hoje a nave tem 8 encaixes fixos. A proposta é um **casco em grade**, com:

- **Peças de estrutura:** seções de casco, nacelas, quilhas, antenas, tanques externos e baias de drones. Cada uma ocupa células da grade e tem massa, consumo de energia e um efeito pequeno.
- **Limites:** área da grade, massa máxima (mais massa piora a eficiência de voo) e energia do reator. Esses limites obrigam a escolher, e daí nascem naves diferentes.
- **Fontes das peças:** compradas com Lumes nos entrepostos (cada facção vende um estilo próprio), fabricadas com materiais ou recebidas como recompensa rara de núcleos.
- **Pinturas, decalques e rastros premium:** são gastos cosméticos; a pintura neon já existe.
- **Compartilhamento:** a nave vira um **código curto** (texto ou QR) e um **cartão-imagem** com nome, atributos e registro de exploração. Funciona offline: outro jogador cola o código para ver a nave ou usá-la como modelo de construção, pagando as peças.

O estaleiro gasta Lumes de forma contínua, porque sempre há uma peça melhor ou um visual novo. É também a base do compartilhamento.

### B. Xenobiologia: fauna e flora com propósito (sua ideia de mais animais)

- **Viveiro e laboratório de bordo:** estudar uma espécie custa **dados + Lumes** e gera um **traço permanente**. Exemplos:
  - Medusa de vidro: +1 de reserva em operação submersa.
  - Flor de brasa: +20 °C de proteção térmica.
  - Arraia celeste: sonda atmosférica gasta menos energia.
- **Ferramentas de captura (compráveis):** garra, rede de plasma, armadilha térmica e cápsula criogênica. Cada espécie exige uma ferramenta e tem um comportamento: foge, solta veneno, se camufla ou congela.
- **Mais espécies:** passar de 6 para cerca de 24, com 2 ou 3 por bioma e raridades diferentes.
- **Bestiário com marcos:** completar uma família rende peça do estaleiro, pintura ou traço.

### C. Civilizações e facções

Os três entrepostos já têm nome: Coletivo Aural, Nômades Veyra e Liga Thar. A proposta:

- Dar a cada um **reputação**, que sobe com encomendas, doações (gasto de Lumes) e missões em cadeia.
- A reputação libera **catálogo exclusivo**: peças de estaleiro, receitas e pinturas.
- **Postos alienígenas** em alguns planetas: povos com diálogo curto e trocas (espécie por tecnologia, por exemplo).

Isso é conteúdo de expansão: o "pacote de civilizações".

### D. Pequenos gastos opcionais, sem punição

- **Seguro de expedição:** pagar Lumes antes de descer para manter metade da carga se precisar evacuar.
- **Drones de coleta:** recolhem depósitos que sobraram num local já concluído; resolve os 4,5% inalcançáveis sem estabilizador.
- **Cartografia:** gastar dados para revelar a neblina de um local antes de descer.
- **Árvore de pesquisa:** dados acumulados viram melhorias de receita, como variantes de módulo ou nova rolagem de raridade.

### E. Ranking de exploração

Precisa de servidor, portanto custo, moderação e proteção contra trapaça. Sugiro duas etapas:

1. **Registro do explorador local, já:** espécies catalogadas, mundos visitados, núcleos, recordes por capítulo e conquistas. Vai no cartão compartilhável.
2. **Ranking online, depois:** a partida é determinística (seed + ações), então dá para validar um recorde reproduzindo-o no servidor. É uma decisão de produto e de infraestrutura.

### Capítulo 2 (ajuste pequeno)

Proposta: começar com **2 células de dobra**, ou incluir minério e cristais na recompensa do capítulo 1. Mexe em um número; é preciso validar de novo com o bot.

## 3. Retorno visual: "as ações são silenciosas"

**Já implementado nesta entrega:**

- Painel translúcido com todos os atributos da nave na tela da Nave.
- Ao instalar um módulo, um cartão animado lista o que mudou (+/−, verde/vermelho), e as linhas alteradas ficam destacadas no painel.
- A seta de voltar mostra o nome do destino.

**Próximos passos, em ordem de custo:**

1. **Sem arte nova:**
   - Recompensas "voando" até a barra de recursos ao coletar e extrair (+8 minério, +2 cristais).
   - A barra pulsa quando um recurso muda.
   - Custos aparecem descendo, em vermelho.
2. **Primeira descoberta de espécie:** ao extrair uma espécie nova, um cartão "Nova espécie" com a arte do atlas de biologia, **para que serve**, onde vender e o que o estudo libera. Usa arte existente.
3. **Cinemáticas curtas** (3 a 6 s, puláveis; versão completa na primeira vez, curta depois):

   | Cena | O que mostra |
   |---|---|
   | Captura de fauna | Comportamento por espécie: a raposa-musgo foge e a garra persegue; a medusa solta uma nuvem tóxica e o escudo absorve; a arraia escapa no vento e a sonda a alcança. |
   | Colheita de flora singular | A orquídea congela na cápsula; a flor de brasa irradia calor na armadilha térmica. |
   | Atracagem no entreposto | A nave se aproxima, braços de doca encaixam, as luzes do mercado acendem. |
   | Encaixe de módulo | A peça entra no compartimento, com faíscas e ajuste. |

**Abordagem técnica:**

- **Sem vídeo:** o jogo continua um arquivo offline leve. As cenas são feitas com canvas/CSS animando camadas pintadas (parallax, partículas, recortes).
- **Arte necessária:** quadros de garra, rede e criaturas em 2 ou 3 poses, gerados no mesmo pipeline das artes atuais (`assets/ARTE.md`).
- **Orçamento:** ~100 a 200 KB por cena em WebP.
- **Acessibilidade:** respeita o movimento reduzido; cada cena guarda no save que já foi vista.

## 4. Reação após evacuar: explicação e opções

**Como funciona hoje:**

- Ao recuperar um núcleo, o planeta "reage" seis ações depois, por exemplo com uma tempestade de cinzas.
- A partir daí, cada passo naquele local custa +1 de energia, para sempre, até instalar o estabilizador (8 minério + 2 cristais).
- Se o jogador **evacua** com o núcleo na carga, perde o núcleo, mas a reação fica ativa.
- Ao tentar de novo, ele enfrenta a reação desde o primeiro passo. Em cerca de metade dos locais a ida e volta passa então de 24 de energia, e o estabilizador vira obrigatório.

Antes, o próprio jogo induzia essa evacuação, com o falso "Livre −1". Isso já foi corrigido. Sobra a pergunta: é justo que perder o núcleo também deixe o local mais caro?

| Opção | O que muda | Prós | Contras |
|---|---|---|---|
| A. Manter | Nada; só um aviso claro no cartão do local ("Reação ativa · +1 por passo · estabilizar: 8 minério + 2 cristais") | Fiel ao design atual | Quem falha paga duas vezes |
| **B. A reação só fica se a tecnologia sair do planeta** | Se o jogador evacuar e perder o núcleo, o local se acalma | Coerente com a história ("o planeta reage ao que levamos"); justo; não abre brecha, porque evacuar já perde toda a carga | Muda uma regra documentada em `OPERACOES-PERSISTENTES.md` |
| C. Reiniciar o aviso | A reação continua, mas volta a dar 6 ações de antecedência a cada nova recuperação | Meio-termo | Menos clara para o jogador |

**Recomendação: B, com o aviso de A** nos locais em que a reação estiver ativa.

## 5. Fases sugeridas

| Fase | Conteúdo | Arte nova | Gasto que cria |
|---|---|---|---|
| 1 | Recompensas animadas; cartão "Nova espécie"; reação opção B; ajuste do capítulo 2; Registro do explorador; estudo de espécies (dados + Lumes → traços) | Não | Dados e Lumes desde o capítulo 2 |
| 2 | Ferramentas de captura; cinemáticas de captura, colheita e atracagem; +6 espécies | Sim | Ferramentas e estudos |
| 3 | Estaleiro modular (grade, massa, energia); cosméticos; código e cartão compartilháveis | Sim (peças) | Contínuo, até o fim do jogo |
| 4 | Pacote de civilizações: reputação, postos alienígenas, missões em cadeia, catálogos exclusivos | Sim | Doações, catálogos |
| 5 | Ranking online validado por repetição da partida | Servidor | — |

Cada fase deve passar pelo bot de campanha para medir as curvas de Lumes e dados, mirando um saldo que oscile em vez de crescer sem parar.
