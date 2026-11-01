# Proposta: economia viva, expansões e retorno visual

Rascunho para decisão, de 31/10/2026. **Atualização:** a xenobiologia com runas, a regra B da reação, as recompensas animadas e o cartão "Nova espécie" já foram implementados. Veja a seção 6. Os números vêm das simulações registradas em `qa/REVISAO-2026-10-31.md`: 20 campanhas completas jogadas por um bot e 50 mil ações aleatórias.

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

### A. Naves prontas à venda (substitui o estaleiro modular)

A primeira versão foi um estaleiro de peças presas por cima da Andorinha. Depois veio um protótipo de montagem livre, tipo Lego. Os dois foram descartados em 01/11/2026: peças avulsas nunca encaixam com o acabamento de uma nave pintada inteira.

A direção agora é de **naves prontas**:

- **Viajante:** às vezes aparece numa estação vendendo uma nave sorteada. Se o jogador não comprar, na próxima visita pode ser outra.
- **Hangar:** guarda as naves compradas. A troca de nave é feita numa estação, e os 8 módulos, as runas, a pintura e o rastro passam para a nave nova.
- **Personalidade:** cada nave tem um jeito próprio de jogar, como mais carga, mais velocidade, proteção para um tipo de mundo ou dobra mais barata.

São 10 naves: a Andorinha e mais 9. O briefing de arte está em `assets/BRIEFING-NAVES-CODEX.md`. É um gasto de Lumes contínuo e desejado: sempre há uma nave que ainda não apareceu.

### B. Xenobiologia: fauna e flora com propósito (sua ideia de mais animais)

- **Viveiro e laboratório de bordo:** estudar uma espécie custa **dados + Lumes** e gera um **traço permanente**. Exemplos:
  - Medusa de vidro: +1 de reserva em operação submersa.
  - Flor de brasa: +20 °C de proteção térmica.
  - Arraia celeste: sonda atmosférica gasta menos energia.
- **Ferramentas de captura (compráveis):** garra, rede de plasma, armadilha térmica e cápsula criogênica. Cada espécie exige uma ferramenta e tem um comportamento: foge, solta veneno, se camufla ou congela.
- **Mais espécies:** passar de 6 para cerca de 24, com 2 ou 3 por bioma e raridades diferentes.
- **Bestiário com marcos:** completar uma família rende pintura, traço ou desconto com o viajante de naves.

### C. Civilizações e facções

Os três entrepostos já têm nome: Coletivo Aural, Nômades Veyra e Liga Thar. A proposta:

- Dar a cada um **reputação**, que sobe com encomendas, doações (gasto de Lumes) e missões em cadeia.
- A reputação libera **catálogo exclusivo**: naves, receitas e pinturas.
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
| 3 | Naves prontas: viajante, hangar e troca de nave; cosméticos | Sim (9 naves) | Contínuo, até o fim do jogo |
| 4 | Pacote de civilizações: reputação, postos alienígenas, missões em cadeia, catálogos exclusivos | Sim | Doações, catálogos |
| 5 | Ranking online validado por repetição da partida | Servidor | — |

Cada fase deve passar pelo bot de campanha para medir as curvas de Lumes e dados, mirando um saldo que oscile em vez de crescer sem parar.

## 6. Status da implementação (31/10/2026)

**Feito:**

- **Exemplares únicos e runas** (sua versão da xenobiologia): 16 exemplares, ferramentas, captura por comportamento, estudo, runas gravadas em módulos, bloqueio de reciclagem e validação de save. Testado em `xenobiology.test.cjs` e no navegador, em 390 e 320 px.
- **Reação após evacuar:** opção B, mais o aviso no cartão do local.
- **Retorno visual:**
  - recompensas sobem em verde e custos descem em vermelho;
  - cartão "Nova espécie" na primeira vez em que cada espécie chega à nave;
  - cenas curtas de captura e de chegada ao laboratório;
  - painel de atributos e cartão "Nave atualizada" também ao gravar ou remover runas.
- **Resgate:** passa a valer quando a nave fica sem condições de operar, isto é, quando nem convertendo tudo o que tem paga a expedição mais barata.
- **Capítulo 2:** o primeiro arquivo devolve uma célula de dobra. No bot de 20 campanhas, 18 terminam (antes 13). As esperas por mercado no capítulo 2 continuam em cerca de metade das partidas. O aperto diminuiu mas não sumiu; vale observar com jogadores antes de ajustar mais.

**Próximo:**

- **Arte dedicada:** dos 16 exemplares, das ferramentas e dos quadros de garra e rede.
- **Cinemáticas completas:** atracagem no entreposto e colheita de flora.
- **Registro do explorador.**
- **Naves prontas** (viajante e hangar).
- **Pacote de civilizações.**

### Atualização seguinte

- **Exemplares únicos:**
  - cinemática de captura exclusiva para cada um dos 16, sem opção de pular;
  - avisos da caçada no topo da tela, no planeta, na Ajuda e no tutorial;
  - coleção "Únicos" no Catálogo, com sombras até a captura;
  - ilustrações provisórias das ferramentas e encaixe pronto para a arte pintada (`assets/XENO-ARTE.md`).
### Naves e backlog (01/11/2026)

- **Estaleiro aposentado:** as peças de casco saíram do jogo. Saves que tinham peças recebem o valor de volta em Lumes ao carregar, com um aviso no registro.
- **Arte dos exemplares e das ferramentas:** pinturas dedicadas instaladas (`assets/BRIEFING-XENO-CODEX.md`).
- **Naves prontas:** briefing das 9 naves novas em `assets/BRIEFING-NAVES-CODEX.md`. A mecânica (viajante, hangar e troca de nave) é o próximo passo.
- **Backlog sem definição:** ranking de exploração e cartão-imagem compartilhável. Ainda não está decidido o que mediriam nem se precisam de servidor.
