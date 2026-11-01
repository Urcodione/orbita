# Órbita — Fronteiras desconhecidas

Protótipo jogável de exploração espacial para navegador, em português, com interface de jogo de celular. No computador, ele aparece dentro de um aparelho emulado; no celular, ocupa a largura da tela. A tela se ajusta à altura disponível e permanece fixa, sem rolagem. Conteúdo extenso é dividido em páginas com Anterior/Próxima; comandos de ação ficam acessíveis no painel.

## Abrir e jogar

Abra **index.html** no Chrome, Edge ou Firefox. O arquivo é independente, funciona sem internet e não precisa de instalação. Você também pode usar um servidor local se preferir.

1. Na primeira abertura, acompanhe a introdução e toque em **Iniciar jornada**. A orientação inicial ensina scanner, pouso, coleta, recuperação do módulo e extração; você pode pulá-la. A campanha começa sem progresso e reabrir restaura a partida.
2. Escolha um local e pilote uma expedição. Toque em um setor vizinho ou use as setas/WASD; cada movimento consome energia. O topo mostra **Energia**, **Para voltar** e **Livre**. A última é a energia que sobra depois de reservar a rota conhecida até a nave. O scanner também gasta reserva.
3. Alcance o sinal antigo, alinhe o circuito de três rotores e recupere o núcleo. Girar um rotor também gira o próximo. A carga ainda é temporária: use **Voltar à nave**, confira o custo da rota e confirme. Ao chegar, **Extrair carga** guarda os recursos. Você também pode pilotar a volta manualmente.
4. Toque no foguete ou use **Nave → Abrir nave**. Toque em um compartimento para operar o sistema e comparar peças compatíveis. Confira os ganhos, perdas e mundos acessíveis; use **Confirmar troca** para instalar. A anterior volta ao armazém.
5. Na aba **Nave**, abra **Oficina de bordo** para abastecer e reparar a nave. No mapa, o painel de dobra também permite refinar cristais.
6. Volte à órbita. **Mapa → Sistema** mostra os mundos ao redor de uma estrela; **Galáxia** permite escolher outro sistema; **Dobra** oferece três sinais distantes, com nomes próprios e custos de salto. Os sistemas e planetas desses destinos só aparecem ao chegar.
7. Antes de explorar, consulte **Ambiente e equipamentos**. Um mundo de 320 °C exige blindagem térmica; um gigante gasoso precisa de sonda; um oceano requer equipamento de submersão. O painel compara cada exigência à proteção realmente instalada.
8. Use **Oficina → Construir módulos** e escolha um dos oito sistemas. A receita mostra os ingredientes disponíveis e necessários. Toque em uma peça que falta para fabricá-la; depois volte à receita do módulo. Uma boa primeira rota é explorar Auralis, analisar o mundo vulcânico e preparar o Escudo Cerâmica Solar.

Arraste a nave para mudar sua inclinação. Use a roda do mouse para aproximar. Toque nos indicadores superiores para ver os recursos. O menu no canto superior abre a ajuda e o som. Os botões funcionam com teclado; as teclas 1 a 4 alternam as áreas do jogo quando o foco está dentro dele. O som é opcional.

O casco abre para revelar os oito sistemas. O motor tem seu acoplador na base, o scanner fica perto da cabine e o depósito contém caixas de minérios e tanques de gases. Cada módulo tem uma forma própria. A seta superior e a tecla **Esc** retornam da peça ao interior, do interior ao exterior e do exterior à exploração. As aproximações, a abertura do casco e o afastamento das peças têm transições suaves; a preferência do sistema por movimento reduzido é respeitada.

O cartão de cada módulo mostra sua função, atributos e condição de instalado ou guardado. As setas laterais alternam peças compatíveis. Motor, dobra, suporte de vida e escudo oferecem abastecimento, refino, reposição de ar e reparo do casco, com custo e saldo visíveis. Escolher uma alternativa permite comparar antes de confirmar; cancelar não muda equipamentos nem recursos.

Na visão aproximada, você também pode **arrastar a própria peça para fora** e devolvê-la ao encaixe. Arrastar o fundo continua girando a nave. No **Depósito**, toque diretamente nas caixas, nos cristais ou no tanque para consultar o estoque. Os botões de conteúdo oferecem a mesma navegação por teclado. Cada painel permite usar seus recursos na oficina: abastecer, reparar, refinar células ou repor ar, sempre mostrando o custo antes da ação.

## O que está funcionando

- Foguete com pintura e nome personalizáveis, casco que se abre e oito sistemas físicos selecionáveis.
- Motor, dobra, suporte de vida, proteção radiológica, scanner, braço coletor, armazém e kit de sobrevivência.
- Cinco raridades e níveis de potência que alteram consumo, proteção, coleta e capacidade.
- Dez biomas, incluindo gigantes gasosos, oceanos globais, mundos corrosivos, magma e planetas errantes congelados.
- Galáxias procedurais com 12–18 mundos em 3–4 sistemas, diferentes quantidades por sistema e estrelas amarelas, anãs vermelhas, gigantes azuis e pulsares.
- Locais de dificuldade crescente: requisitos, gasto de oxigênio, desgaste do casco e recompensas variam por expedição.
- Dezenove receitas de módulos especialistas nos oito sistemas. Proteções térmica, radiológica e de impactos; motores de economia ou tanque; scanners de alcance ou pesquisa; depósitos de capacidade ou submersão. As escolhas alteram regras reais de navegação e expedição.
- Seis componentes intermediários: liga estrutural, prisma, circuito, selo, núcleo de campo e célula energética. Componentes compostos usam outras peças; estoque e custos são mostrados em cada receita.
- Comparação com ganhos e perdas, mundos liberados/bloqueados e aviso quando uma capacidade menor descartaria recursos. A troca preserva o módulo antigo.
- Estrela de proteção contra desmontagem, persistente mesmo após trocar a peça. Desmontar exige revisão e destaca capacidades únicas entre todos os módulos a bordo.
- Nomes próprios distintos para galáxias, sistemas e planetas, sem sufixos numéricos. Três destinos de dobra renovados a cada viagem, mantendo seus sistemas e mundos em segredo até a chegada.
- Catálogo estelar com mundos desconhecidos, descobertos, completos e porcentagens de exploração por planeta, sistema e galáxia. As viagens anteriores mantêm um registro de suas descobertas.
- Combustível, oxigênio, integridade, minério, cristais, créditos e dados de pesquisa.
- Expedições táticas em terrenos 6 × 6: névoa, rotas, obstáculos, perigos e recursos opcionais; veículos distintos para superfície, água e atmosfera.
- Energia, integridade e capacidade de carga do veículo dependem dos módulos instalados. Scanner e coletor melhores alteram as decisões em campo.
- Circuitos com rotores acoplados, carga temporária, extração parcial e evacuação. É possível voltar só com recursos e retornar ao local para recuperar o núcleo; recursos já extraídos não reaparecem.
- Farol Horizonte: recuperar os sinais Origem, Brasa e Maré em ambientes distintos libera um Núcleo do Cartógrafo épico, que precisa ser instalado pelo jogador.
- Oficina, reciclagem e resgate de emergência. A aba Diário foi substituída pela Expedição jogável.
- Progresso salvo no navegador quando o armazenamento está disponível. A prévia na conversa usa a persistência oferecida pelo aplicativo.

A seta superior indica o local de retorno: nave aberta, módulos, receita, estoque ou mercado, conforme a origem do cartão. **Esc** e o botão Voltar do Android seguem essa mesma organização. O **×** fecha o painel; na inspeção, revela a nave aberta. **Anterior/Próxima**, nos painéis longos, troca apenas a página do conteúdo. As ações secundárias têm superfície de botão e resposta ao toque.

As decisões são por turno: deixar a aba aberta não gasta recursos. Oxigênio é gratuito quando a nave está ancorada em um planeta respirável; fora dele, a oficina converte 1 Samambaia-lume em até 12 de oxigênio, ou você compra oxigênio no entreposto. O resgate preserva seus módulos e cobra parte dos recursos.

Análises orbitais continuam possíveis sem o equipamento exigido pela superfície. Entrar em um sistema hostil também exige proteção contra a estrela. Nos gigantes gasosos, a nave opera com sondas atmosféricas; nos mundos líquidos, com módulos de submersão. Os requisitos são limites mínimos: tempestades e locais profundos ainda podem danificar o casco. Não há consumo quando uma ação é bloqueada. Trocar uma peça altera imediatamente os ambientes acessíveis, inclusive se você já estiver operando no planeta; retornar à órbita permanece disponível.

O progresso da versão anterior é migrado, preservando nave, equipamentos, recursos e descobertas. A prévia salva uma versão compacta do universo e reconstrói os dados procedurais ao abrir.

## Catálogo e descobertas

Abra **Mapa → Catálogo** ou **Menu → Catálogo estelar**. A análise orbital registra a descoberta de um planeta e revela seu nome no catálogo. A porcentagem mede locais concluídos: recupere o núcleo e extraia a carga com segurança para registrar a conclusão. Coletar recursos ou abandonar uma expedição não conclui o local. Planetas completos também estão incluídos no total de descobertos.

Cada sistema mostra quantos mundos ainda são desconhecidos. Toque em um planeta descoberto para abrir sua rota, ou em **Investigar um sinal** para selecionar um mundo ainda não analisado. Consultar o catálogo não gasta combustível nem inicia uma viagem. As páginas do catálogo são trocadas nos seus próprios controles.

**Galáxias visitadas** guarda o progresso registrado antes de cada dobra. As 48 passagens mais recentes mantêm resumos individuais; passagens anteriores são agregadas. Viagens feitas antes da existência do catálogo são indicadas como sem registro detalhado, pois o salvamento antigo não guardava esses dados. A migração preserva a exploração da galáxia atual e qualquer expedição em andamento.

A expedição é salva a cada ação, inclusive posição, terreno revelado, circuito e carga temporária. Enquanto o veículo está em campo, a nave não pode viajar nem trocar equipamentos. Você pode consultar outras telas e retomar pela aba **Expedição**. Energia não diminui com o tempo: há espaço para planejar. Antes de uma ação gastar a reserva de retorno ou deixar o veículo sem energia para voltar, o jogo mostra o custo, a energia restante e exige confirmação. A rota considera apenas setores conhecidos, obstáculos e dano do terreno. Se ainda assim a energia acabar fora da base, evacuar preserva a nave e seus equipamentos, mas perde a carga daquela saída. Chegar à base com energia zero ainda permite extrair.

O primeiro local oferece uma rota de aprendizado. Nos demais, o núcleo e os caminhos variam por semente. O desafio está em decidir quais recursos justificam um desvio e quanto reservar para voltar. Recuperar o núcleo usa 3 de energia; uma tentativa com circuito desalinhado gasta 2. As setas do alvo sempre mostram a solução desejada, e girar os rotores é gratuito.

## Xenobiologia: exemplares únicos e runas

**Exemplares únicos.** Cada galáxia da campanha esconde um animal e uma planta que existem em um único exemplar, em um dos locais de um mundo do seu bioma. São 16 ao todo. Em **Menu → Xenobiologia**, "Sinais vivos neste setor" indica o planeta. Depois de capturado, o exemplar nunca mais aparece.

**Comportamento e ferramenta.** Cada exemplar se comporta de um jeito e exige uma ferramenta, comprada uma única vez em qualquer entreposto (**Estação → Captura**):

| Comportamento | Ferramenta | Custo da captura |
|---|---|---|
| Foge | Garra de contenção | 3 de energia |
| Camufla-se (só aparece depois de um escaneamento na saída) | Rede de plasma | 2 de energia |
| Libera toxina | Casulo selado | 2 de energia e 2 de integridade |
| Flutua no vento | Laço gravitacional | 3 de energia |
| Congela ao toque | Cápsula criogênica | 2 de energia |
| Irradia calor | Coletor térmico | 2 de energia e 1 de integridade |

**Captura.** No terreno, o exemplar aparece com um anel violeta. A captura é recusada se deixar você sem energia para voltar. O exemplar só chega ao laboratório quando você **extrai** a carga; se evacuar, ele volta ao terreno.

**Laboratório.**

- **Estudar** custa dados e Lumes e revela a runa do exemplar.
- **Criar a runa** custa Lumes, minério e cristais.
- **Gravar** a runa custa 40 Lumes. Vale em qualquer módulo, instalado ou guardado, de qualquer raridade, e cada módulo aceita uma runa.
- **Remover** a runa é gratuito; depois ela pode ser gravada em outro módulo.
- **Reciclagem:** um módulo com runa não pode ser reciclado.

**Efeitos das runas.** Algumas somam atributos à nave: energia, oxigênio, casco, alcance do scanner, eficiência de voo ou de dobra, carga e coleta. Outras reforçam a proteção do próprio módulo gravado, como +40 °C de proteção térmica numa blindagem. A gravação mostra o que mudou na nave.

**Onde acompanhar a caçada.**

- **Topo da tela:** o botão de xenobiologia mostra um ponto violeta quando há um exemplar não capturado no setor atual.
- **Planeta:** a tela do planeta avisa "Sinal vivo único".
- **Catálogo → Coleções → Únicos:** mostra os 16 como sombras até serem capturados.
- **Ajuda:** tem o tópico "Caça aos únicos".
- **Tutorial:** o fim do tutorial e o aviso ao pular explicam a caçada.

**Cinemáticas.** Cada exemplar tem uma cinemática de captura própria, de cerca de 7 segundos, que não pode ser pulada.

**Arte.** Ferramentas e exemplares são pinturas dedicadas (`assets/xeno-tools.webp` e `assets/xeno-specimens.webp`), montadas a partir de `assets/src/` por `qa/prepare-xeno-art.py`. O briefing de cada item está em `assets/BRIEFING-XENO-CODEX.md`.

## Naves e hangar

Além da Andorinha, existem 9 naves prontas. Elas não são vendidas em loja: em cada galáxia, um **viajante** pode esperar no entreposto com uma nave sorteada (75% de chance por galáxia, com preferência pelas naves do povo daquela galáxia). A primeira atracagem depois do tutorial sempre o encontra. Ele fica no entreposto até você comprar ou partir para outra galáxia; atracar de novo não sorteia outra nave.

**Hangar.** As naves compradas ficam no Hangar (Nave aberta → Hangar, ou pela Estação). A troca é feita atracado: módulos, runas, pintura e rastro passam para a nave escolhida. Se o armazém da nova nave for menor que o número de módulos guardados, o jogo pede para liberar espaço antes.

| Nave | Papel | Raridade | Preço |
|---|---|---|---|
| Beija-flor | batedora: +25% voo, +10% dobra; −20 casco, −1 carga na expedição | comum | 1.300 |
| Albatroz | longo curso: +40 tanque, +15% ar; −10% coleta | comum | 1.500 |
| Pelicano | cargueira: +3 armazém, +1 carga na expedição, +20 casco; −15% voo | comum | 1.400 |
| Coruja | observatório: +1 alcance do scanner, +15% pesquisa; −15 combustível | rara | 2.900 |
| Martim-pescador | mineradora: +15% coleta, +3 energia na expedição; −10% ar | rara | 2.700 |
| Pinguim | gelo e profundezas: +60 °C frio, +3 atm; −10% voo, −20 °C calor | rara | 2.500 |
| Carcará | mundos ardentes: +60 °C calor, +60 rad; −10% dobra | rara | 2.600 |
| Garça | pântanos e gás: +25% filtragem tóxica, +2 integridade; −1 armazém | rara | 2.400 |
| Fênix | dobra lendária: +40% dobra, +2 integridade, +3 energia na expedição | lendária | 6.000 |

Preços calibrados pelo bot de campanha (12 campanhas, 01/11/2026). Comprando sempre que sobram 600 Lumes, o jogador leva de 1 a 3 naves na campanha: a primeira entre os capítulos 5 e 6, as raras entre o 5 e o 8. A Fênix fica para depois do fim. Mesmo comprando sem reserva, todas as campanhas que o bot termina continuam terminando, com menos esperas por recurso. A arte das naves vem de `assets/src/ships/` (briefing em `assets/BRIEFING-NAVES-CODEX.md`) e é convertida por `qa/prepare-ships-art.py`. Cada nave tem a pintura fechada, a aberta com os 8 encaixes e a posição dos bocais para as chamas.

## Escolher uma configuração

A raridade não decide tudo. A Cerâmica Solar tolera 1.400 °C, mas a Malha Magnetar chega a 450 rad com apenas 220 °C de proteção térmica. A Dobra Âncora Pulsar oferece blindagem radiológica em outro encaixe; combiná-la com um escudo térmico pode abrir rotas que cada peça sozinha não permite. Um scanner de alcance ajuda a revelar o terreno; o Arquivista prioriza pesquisa. Guarde alternativas para preparar a próxima rota.

A fabricação segue **materiais → componentes → módulo**. Por exemplo, minério vira liga estrutural; cristais e pesquisa viram prismas; dois prismas e um circuito entram em um núcleo de campo. No detalhe da receita, cada linha mostra estoque / quantidade necessária. Produzir consome apenas os ingredientes indicados, e módulos fabricados ficam no armazém até a troca ser confirmada.

## Direção visual e escopo

A direção visual atual é cartoon com volume e iluminação suave. A nave usa camadas ilustradas com materiais cerâmicos e metálicos, reflexos e motores luminosos. Dez biomas e três famílias de galáxias possuem artes próprias; nomes, condições ambientais e progresso continuam procedurais. A resolução acompanha a densidade da tela, mantendo curvas, texto e detalhes nítidos. A vista exterior usa uma ilustração original com cabine panorâmica, cerâmica e propulsores de cobre. O casco aberto e os oito módulos usam ilustrações da mesma família visual, com aproximação, retirada e retorno das peças aos encaixes. A inclinação conserva a arte, sem trocar para o modelo geométrico anterior. A pintura continua personalizável. Planetas possuem costas iluminadas e nuvens sutis em movimento, respeitando a preferência por movimento reduzido. A exploração local usa veículos comandados por setores e circuitos interativos. O protótipo ainda não oferece voo livre contínuo, personagem caminhando, combate, multiplayer ou arte final ultrarrealista.

## Evolução

O jogo está separado em regras (`engine.js`), cena da nave (`scene.js`, `illustrated-scenes.js`), terreno de expedição (`expedition-scene.js`) e interface (`ui.js`, `styles.css`, `shell.html`), com o laboratório em `workshop-ui.js` e `workshop.css` e o catálogo em `catalog-ui.js` e `catalog.css`; `panel-pager.js` divide os painéis e `navigation.css` controla a tela fixa. Depois de alterar os arquivos, execute `python3 build.py` para atualizar o arquivo independente. Os arquivos sincronizados em `sources/` não são usados nem alterados.

A ilustração está em `assets/andorinha-illustrated.png`; o build incorpora a versão WebP otimizada no próprio jogo, que continua funcionando sem internet. A origem e o prompt estão em `assets/ARTE.md`.

As verificações das regras estão em `engine.test.cjs`, `engine-universe.test.cjs`, `expedition.test.cjs`, `modules.test.cjs`, `energy-return.test.cjs` e `catalog.test.cjs`; as verificações de navegador estão em `qa/illustrated-art-test.cjs`, `qa/catalog-browser-test.cjs`, `qa/navigation-browser-test.cjs`, `qa/modules-browser-test.cjs`, `qa/expedition-browser-test.cjs`, `qa/universe-browser-test.cjs`, `qa/rocket-game-test.cjs`, `qa/module-manipulation-test.cjs` e `qa/mobile-inline-test.cjs`.

A primeira versão com painel de desktop foi preservada em `desktop.html` e seus arquivos de interface em `desktop-source/`. A versão atual é `index.html`.

### Estação e mercado regional

Abra **Mapa → Galáxia → Entreposto local**, ou **menu → Estação**. O entreposto corresponde ao sistema em que a nave está fisicamente; selecionar outra estrela no mapa não permite negociar remotamente. Transações exigem órbita e nenhuma expedição ativa.

A moeda é Lumes (o saldo existente de créditos foi preservado). Minério, cristais, oxigênio e combustível têm preços por unidade conforme a abundância dos biomas locais. Estoque abundante reduz preço, escassez aumenta. Compras e vendas pressionam a cotação; lotes são calculados unidade a unidade e o total aparece antes de confirmar. Há diferença entre preço de compra e venda. Estoques se recompõem a cada 10 minutos em ciclos do relógio local. Progresso e alterações de estoque ficam salvos; uma nova galáxia inicia novos mercados.

**Estoque** mostra materiais e capacidade; **Módulos** usa cartões com detalhes, comparação para instalar e revisão de desmontagem. **Oficina** separa construção de módulos, componentes, manutenção e estoque. Receitas continuam consumindo materiais imediatamente, sem fila temporal. A bancada mostra as peças necessárias e o estoque disponível. Oxigênio representa gases e combustível representa líquidos nesta primeira versão do mercado.

### Navegação e fabricação por estoque

Cartões abertos pela nave mantêm a saída Nave aberta, inclusive ao alternar para alternativas guardadas. Cartões abertos pelo inventário retornam aos Módulos. Não há projetos ativos ou fila de montagem: fabricar componentes os adiciona ao estoque, e cada receita verifica os materiais e o espaço disponíveis no momento da fabricação.

Reposição, reparo e refino mostram a quantidade recebida, o recurso usado, seu estoque atual e o saldo após a operação. O pagamento exibido é enviado explicitamente à operação.

### Catálogo de materiais

Catálogo → Recursos separa minerais, líquidos e gases. As seis especialidades comerciais são identificadas por análise orbital: Ferronita (vulcânico), Prismalita (cristalino), Salmoura iridescente (oceânico), Criogel (gelo), Héliox (gasoso), Xenônio âmbar (tóxico). Seus nomes ficam ocultos até a descoberta. Fontes mostram somente mundos analisados da galáxia atual.

Uma extração bem-sucedida concede uma amostra por setor coletado, até três, da especialidade local. É uma amostra adicional da coleta: não ocupa outro espaço. Abortar não concede amostras. O estoque comercial e a descoberta persistem ao viajar. Materiais exclusivos só são repostos em sistemas com o bioma de origem; entrepostos de outros sistemas podem comprar a carga importada. As especialidades são mercadorias; não substituem os ingredientes das receitas existentes.

### Flora e fauna

O catálogo agora inclui três plantas e três animais, coletáveis e comerciáveis. Samambaia-lume e Raposa-musgo são comuns em florestas úmidas. Flor de brasa é exótica em desertos e vulcões; Medusa de vidro é exótica em oceanos. Orquídea de geada é rara em gelo; Arraia celeste é rara em gigantes gasosos. Espécies exóticas aparecem em aproximadamente metade dos mundos adequados, raras em um terço, com distribuição determinística pela semente planetária.

A análise identifica espécies presentes. Uma extração com coleta traz exemplares adicionais: até três comuns, dois exóticos ou um raro; abortar não entrega exemplares. Os requisitos ambientais existentes continuam obrigatórios. O entreposto só repõe espécies presentes em seu sistema e em volume menor que minerais. Os exemplares são cargas comerciais e não substituem ingredientes de fabricação.

### Comércio equilibrado

Referências em Lumes: minério 3, cristais 10, Ferronita 14, Prismalita 30, Salmoura 12, Criogel 22, Héliox 16, Xenônio 26; Samambaia 10, Flor de brasa 24, Orquídea 55; Raposa 14, Medusa 32, Arraia 70. Oxigênio e combustível têm referência 1 e são reservas operacionais compráveis, sem revenda, evitando conversão lucrativa de reabastecimento gratuito ou subsidiado.

O preço regional varia de 75% a 130% da referência conforme presença de fontes locais; compras e vendas movimentam essa cotação em no máximo ±8%. A compra pelo jogador aplica 112% e a venda 78%, com arredondamento conservador por unidade. Dividir lotes não reduz o custo. Valores mostrados no cartão e total confirmado usam a mesma regra.

Cada entreposto dispõe de 400 Lumes para comprar cargas por ciclo de dez minutos. A demanda máxima por item no ciclo é 40 para recursos básicos, 20 para especialidades minerais/líquidas/gasosas, 15 para espécies comuns, 8 para exóticas e 3 para raras. Venda consome demanda e caixa; recomprar não os recupera. O cartão mostra os limites restantes. Reposição renova estoque, demanda e caixa; não altera o saldo do jogador. Rotas entre sistemas continuam possíveis, mas escassez não produz preços ilimitados.

### Campanha: O Coro do Limiar

A introdução ilustrada aparece uma vez por partida, pode ser pausada/pulada e fica disponível no menu. A aba Missão e o símbolo ✦ no cabeçalho mostram a investigação atual, as relíquias protegidas e o Olho de Íris. A história completa está em HISTORIA.md; os critérios de ritmo e a estimativa de duração estão em CAMPANHA-RITMO.md.

São oito capítulos em galáxias sucessivas, com 70 recuperações de núcleo previstas, investigação de diferentes mundos/sistemas e um ingrediente singular por capítulo. Concluir a investigação entrega uma receita exclusiva à oficina. A peça especial dos Aural custa 480 Lumes no entreposto indicado. As outras descobertas vêm das expedições-alvo. A criação do módulo revela a próxima frequência.

Os oito módulos cósmicos têm arte própria, benefícios normais e uma contribuição individual de 12,5% à resistência dimensional. Itens de missão ficam separados das mercadorias; módulos têm proteção permanente. O retorno à origem é habilitado com as oito tecnologias construídas. A travessia final exige as oito instaladas e 100% de resistência dimensional.

A meta é uma primeira campanha de aproximadamente cinco a sete horas, sem espera artificial. Os testes automatizados verificam regras, salvamento e navegação; não substituem medir uma partida humana completa.

## Revisão e Android 0.2.2

O pacote de teste está em `android/dist/orbita-0.2.2.apk`; instalação e atualização estão descritas em `android/LEIA-ME.md`. O resumo do check final está em `qa/CHECK-GLOBAL-0.2.2.md` e os destinos de navegação em `ROTAS.md`.

Para gerar a prévia compacta, use Node.js com Terser disponível, instale as dependências locais com `npm ci --prefix qa --ignore-scripts` e use `python3 build.py --preview CAMINHO_ABSOLUTO`. A compactação conserva os bytes de todas as imagens e seus perfis de cor; o APK usa as artes completas.

## Jornada e custo das saídas — 0.2.3

Cada lançamento da expedição cobra combustível, inclusive uma nova tentativa no mesmo ponto após evacuar ou recarregar a partida. A preparação repõe a bateria, mas não devolve combustível consumido. O custo depende da dificuldade e da eficiência do motor; o painel mostra custo e saldo antes de sair. Em gigantes gasosos, o bônus de combustível exige recuperar o núcleo; extrair apenas recursos não concede esse bônus.

O painel usa ícones e nomes completos para casco, oxigênio e combustível. Na exploração, **Salvar Íris** mostra as oito tecnologias da jornada e o progresso local. Toque para consultar um próximo passo opcional. A carga extraída distingue suprimentos de avanços narrativos: recuperar e extrair núcleos em mundos e sistemas necessários contribui para as receitas da campanha. A Aurora comenta os marcos sem desviar o jogador para missões automaticamente.

### Decisões e conquistas locais

A primeira tecnologia exige quatro núcleos em dois mundos. O painel de objetivo acompanha cinco marcos dentro do capítulo, e a metade da transmissão concede um componente para a oficina. Achados únicos têm operações ambientais próprias, com pistas visíveis: acertar é gratuito, errar consome dois pontos de energia e um de integridade. A extração mostra o que mudou e conserva os custos já pagos.

Durante uma saída, abra Retornar → Descarga de emergência para converter 12 de casco em até seis de energia, uma única vez. A confirmação mostra os saldos. Não elimina a necessidade de planejar a volta nem permite pousar sem as proteções essenciais.

## Áudio, segurança e novas atividades (26/10/2026)

**Menu → Som e efeitos** ativa as trilhas originais offline, com identidade por bioma, nave, espaço e entreposto. Música, ambiente/motor e ações têm controles separados; as preferências permanecem após reabrir. Efeitos leves reduzem animações.

**Menu → Partida segura** permite guardar um ponto de recuperação, exportar e importar. Importar pede confirmação; arquivos inválidos não substituem a jornada. Exporte antes de desinstalar ou limpar os dados. O backup local não sobrevive à limpeza do armazenamento.

**Estação → Encomendas** oferece duas entregas únicas por entreposto, com quantidade e pagamento definidos. A missão informa o benefício da próxima tecnologia; estilos especiais registram conquistas, mas continuam livres nesta fase de teste. Locais comuns também podem oferecer estabilização de reservatórios, observação e preservação de amostras, mantendo o custo de recuperar o núcleo e a necessidade de voltar e extrair.
