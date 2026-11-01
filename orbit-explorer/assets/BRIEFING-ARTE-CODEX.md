# Briefing de arte: Xenobiologia e Estaleiro estelar

Para quem vai pintar (Codex, com a mesma ferramenta de imagens usada em `ARTE.md`). São **34 ilustrações**: 6 ferramentas de captura, 16 exemplares únicos (animais e plantas) e 12 peças de nave. O código já está pronto. Basta entregar as imagens no formato da seção 3, sem mudar nenhum código.

Este documento substitui os prompts curtos de `XENO-ARTE.md` e `ESTALEIRO-ARTE.md`. Cada item traz: o que é, o que faz no jogo, onde vive, qual o clima e o que **não** pode parecer.

---

## 1. O jogo e o clima geral

Órbita é um jogo mobile de exploração espacial. O jogador pilota a **Andorinha**, um foguete retrofuturista de cerâmica marfim, cabine de vidro turquesa e propulsores de cobre. Ele viaja entre galáxias, desce em planetas, coleta recursos e agora **caça exemplares únicos**: cada animal ou planta existe **uma única vez** no jogo. O exemplar capturado vira uma **runa**, gravada num módulo da nave.

O tom é de **maravilhamento e aventura contemplativa**, com algo de filme de animação de alto nível: calor, curiosidade e beleza. Não é terror, não é militar, não é fofo infantil. Os animais são **majestosos e raros**, como encontrar uma lenda viva. As ferramentas e peças são **equipamento de explorador**: bem-feito, um pouco gasto pelo uso e com vontade de ser tocado.

## 2. Padrão visual obrigatório (o mesmo da arte aprovada)

**Referências que devem estar abertas ao gerar**, como imagem de referência ou de estilo:

- `andorinha-illustrated.png`: materiais e luz da nave. É a referência principal das ferramentas e peças.
- `modules-atlas.png`: família direta das ferramentas e peças (radar, garra, caixas, cilindros, escudo, motor, dobra).
- `biology-atlas.png`: família direta dos exemplares (samambaia, orquídea de gelo, suculenta de brasa, raposa de musgo, água-viva, arraia do céu).
- `cosmic-atlas.png`: brilho violeta "cósmico", para os itens mais raros.

**Frase de estilo usada em toda a arte do jogo** (repetir em todo prompt):
> premium hand-painted dimensional realistic cartoon, animated-film concept art, rich organic brushwork, warm upper-left key light, cool teal shadows, soft cyan rim light, truly transparent alpha background, no text, no frame, no background

**Materiais da família da nave:**
- Cerâmica marfim, com realces quentes e sombras azuladas.
- Cobre e cobre alaranjado escovado.
- Juntas de metal teal escuro.
- Vidro turquesa com reflexo branco nítido.
- Pequenas lâmpadas quentes, desgaste leve de uso e painéis de serviço plausíveis.

**Câmera:** três-quartos frontal leve, um pouco de cima, como no `modules-atlas.png`.

**Nunca:**
- vetor chapado ou clip-art (esse foi o problema da tentativa em SVG);
- low-poly, pixel art, wireframe ou contorno preto grosso de cartum;
- fotografia realista, terror, sangue ou dentes à mostra de forma agressiva;
- estilo chibi ou brinquedo;
- texto, letras, logotipos ou moldura;
- chão grande ou cenário (as plantas podem ter só um pequeno torrão de raiz ou rocha, como no `biology-atlas.png`);
- sombra projetada no chão, ou brilho que atravesse a célula vizinha.

## 3. Entrega técnica

### Como gerar (recomendado)
Gere **uma ilustração por item** (quadrada, 1024×1024, objeto centralizado, fundo transparente). A qualidade fica muito maior do que pedir 16 itens numa única imagem. Também vale gerar folhas de 2×2 e recortar.

Salve em:

```
assets/src/xeno-tools/<id>.png          (6 arquivos)
assets/src/xeno-specimens/<id>.png      (16 arquivos)
assets/src/yard-parts/<id>.png          (12 arquivos)
```

Os `<id>` estão em cada item abaixo. Depois, rode a partir de `orbit-explorer/`:

```bash
python3 qa/prepare-xeno-yard-art.py
```

O script monta `assets/xeno-tools.webp` (2×3), `assets/xeno-specimens.webp` (4×4) e `assets/yard-parts.webp` (4×3), além das versões `-inline` para a prévia compacta, na ordem exata que o jogo espera. O `build.py` incorpora esses arquivos sozinho. Se preferir gerar o atlas inteiro de uma vez, salve como `assets/src/xeno-tools.png` (e equivalentes) na ordem da grade. O script aceita os dois formatos.

### Enquadramento por item
- Objeto **centralizado**, ocupando cerca de **70–75% do quadrado** (ferramentas e peças) ou **75–80%** (animais e plantas), com margem transparente em volta.
- Nada encostando na borda: o glow precisa sumir antes da borda.
- Fundo **realmente transparente** (alfa), nada de branco ou xadrez desenhado.

### Onde cada arte aparece (por isso a silhueta importa)

| Arte | Onde aparece | Tamanho na tela |
|---|---|---|
| Ferramentas | loja de ferramentas, laboratório, botão de captura no mapa da expedição; fecham sobre o animal na cinemática | 30–52 px no painel; grande na cinemática |
| Exemplares | ícone no mapa da expedição (flutuando), laboratório, ficha do exemplar (120 px), catálogo "Únicos" | 44–120 px |
| Exemplares (sombra) | **catálogo antes da captura**: a mesma imagem vira silhueta preta (brightness 0) com um "?" | 48 px, só a silhueta |
| Exemplares (cinemática) | cinemática exclusiva de 7 s, sem pular, sobre a paisagem pintada do bioma, com partículas e movimento | ocupa boa parte da tela do celular (~256 px de origem) |
| Peças | planta do estaleiro, hangar, loja e **montadas por cima da nave pintada** na tela principal | 30–60 px |

Consequências:
- Cada exemplar precisa de uma **silhueta única e reconhecível só pelo contorno preto**. Exemplo: raposa com cauda de fitas, urso volumoso, mariposa de asas abertas, arraia em losango, samambaia com espirais, cacto em colunas.
- Ferramentas e peças precisam ser lidas a **48 px**: 2 a 4 formas grandes, com detalhe só de acabamento.
- As peças ficam **em cima do casco marfim da Andorinha**: precisam ter a mesma luz, os mesmos materiais e a mesma câmera da nave.

---

## 4. Ferramentas de captura (`xeno-tools`, grade 2 colunas × 3 linhas)

Cada comportamento de animal ou planta pede uma ferramenta. O jogador compra no entreposto e leva para a expedição. As seis são **parentes do `modules-atlas.png`**: equipamento de explorador em marfim, cobre e teal, cada uma com uma **cor de energia própria**, para não se confundirem pequenas.

### 4.1 Garra de contenção — `garra` (linha 1, coluna 1)
- **O que é:** braço mecânico articulado com garra de três dedos.
- **O que faz:** alcança criaturas **que fogem** (Raposa-aurora, Salamandra de brasa, Urso-geada). Custa 160 Lumes.
- **Clima:** rápida, precisa, confiável. Uma ferramenta de agarrar no ar.
- **Forma:** braço telescópico curto em diagonal, de baixo à direita para cima à esquerda; pulso redondo de cobre com **lâmpada ciano**; três garras marfim com pontas de cobre, **abertas**, prontas para fechar.
- **Cor de energia:** ciano.
- **Diferenciar de:** a garra coletora do `modules-atlas.png` é gorda e laranja. Esta é **mais esguia, com três dedos e um cabo telescópico**, e lê como ferramenta de mão.
- **Prompt:** `GARRA DE CONTENÇÃO: articulated three-talon containment claw on a short telescopic arm, ivory ceramic talons with copper tips, round copper wrist hub with a glowing cyan lamp, talons open ready to snap shut, diagonal pose, sleek explorer tool, slimmer and more elegant than the module collector claw.`

### 4.2 Rede de plasma — `rede` (linha 1, coluna 2)
- **O que é:** lançador em forma de aro com uma rede de energia dobrada.
- **O que faz:** revela e envolve organismos **camuflados** (Mariposa de cristal, Escaravelho-ferro, Coral cantor). Só aparecem depois de um escaneamento. Custa 140 Lumes.
- **Clima:** tecnologia de revelar o invisível. Uma rede que acende.
- **Forma:** anel lançador de cobre (aro largo com empunhadura curta), de onde sai uma **malha hexagonal ciano luminosa**, meio aberta como um leque.
- **Cor de energia:** ciano esverdeado, em malha hexagonal.
- **Diferenciar de:** não pode parecer escudo (o escudo do `modules-atlas.png` é uma esfera hexagonal). A rede é **aberta, em leque, saindo do aro**.
- **Prompt:** `REDE DE PLASMA: circular copper launcher ring with a short ivory grip, a folded hexagonal net of glowing cyan plasma filaments bursting out of the ring and fanning open, light sparks along the net knots.`

### 4.3 Casulo selado — `casulo` (linha 2, coluna 1)
- **O que é:** cápsula de vidro estanque, em pé.
- **O que faz:** guarda organismos **que liberam toxina** (Leviatã de vidro, Lesma ácida, Samambaia-mãe, Trepadeira prisma). Na expedição, a toxina custa integridade do traje. Custa 180 Lumes.
- **Clima:** contenção de laboratório, segura e um pouco perigosa por dentro.
- **Forma:** casulo de vidro vertical e arredondado, tampas marfim em cima e embaixo, **duas cintas de cobre**, uma **névoa verde-limão tóxica** presa dentro.
- **Cor de energia:** verde-limão.
- **Diferenciar de:** a cápsula criogênica é deitada, marfim e azul-gelo. O casulo é **em pé, transparente, com névoa verde**.
- **Prompt:** `CASULO SELADO: upright transparent glass cocoon capsule with ivory end caps and two copper bands, faint toxic lime-green mist swirling sealed inside, small teal valve, laboratory containment feel.`

### 4.4 Laço gravitacional — `laco` (linha 2, coluna 2)
- **O que é:** emissor de mão que projeta um laço de gravidade.
- **O que faz:** ancora criaturas que **flutuam nas correntes** (Arraia-tempestade, Alga nebular). Custa 220 Lumes.
- **Clima:** tecnologia mais rara, quase mágica. É a ferramenta "cósmica" do grupo.
- **Forma:** empunhadura compacta de cobre e marfim com cabeça emissora, projetando à frente um **anel violeta luminoso** (laço de energia girando).
- **Cor de energia:** violeta (família do `cosmic-atlas.png`).
- **Diferenciar de:** a dobra do `modules-atlas.png` tem anéis ciano em volta de um cilindro. Aqui é **um único laço violeta projetado para fora**, a partir de uma ferramenta de mão.
- **Prompt:** `LAÇO GRAVITACIONAL: compact copper and ivory handheld emitter with a pistol-like grip, projecting in front of it a single luminous violet gravitational loop ring with faint distortion, cosmic violet glow like the cosmic atlas.`

### 4.5 Cápsula criogênica — `crio` (linha 3, coluna 1)
- **O que é:** recipiente de transporte refrigerado.
- **O que faz:** carrega flora que **congela ao toque** e só vive no gelo (Orquídea eterna, Flor do vazio). Custa 200 Lumes.
- **Clima:** frio, silencioso, cuidado extremo.
- **Forma:** cilindro marfim arredondado, **levemente deitado**, com janela de vidro azul-gelo fosco (com geada nas bordas), anéis de cobre e **vapor frio** escorrendo.
- **Cor de energia:** azul-gelo e branco.
- **Diferenciar de:** os cilindros de oxigênio do `modules-atlas.png` são verticais, aos pares, com manômetros verdes. Esta cápsula é **única, deitada, com janela de gelo e vapor**.
- **Prompt:** `CÁPSULA CRIOGÊNICA: single rounded ivory cryo canister lying slightly tilted, frosted ice-blue window with frost crystals on its rim, copper rings, cold white vapour spilling down, tiny blue status lamp.`

### 4.6 Coletor térmico — `termico` (linha 3, coluna 2)
- **O que é:** sino coletor isolante.
- **O que faz:** isola plantas **que irradiam calor** ao serem tocadas (Lírio solar, Cacto de magma). O calor custa integridade do traje. Custa 200 Lumes.
- **Clima:** forja portátil, calor contido.
- **Forma:** sino de cobre em forma de campânula, com **aletas radiadoras marfim** em volta e um **núcleo laranja-âmbar incandescente** na boca do sino.
- **Cor de energia:** laranja-âmbar.
- **Diferenciar de:** o motor do `modules-atlas.png` tem um bocal teal escuro grande. Aqui o sino é **de cobre, com aletas marfim e brilho laranja por dentro**.
- **Prompt:** `COLETOR TÉRMICO: copper bell-shaped heat-insulating collector with radiating ivory cooling fins around it, a glowing orange-amber core visible at the bell mouth, gentle heat shimmer.`

**Prompt-base para cada ferramenta (prefixo):**
`Use case: stylized-concept. Single production game sprite of a capture tool for a mobile space exploration game, matching the referenced Andorinha spaceship and module atlas exactly: premium hand-painted dimensional realistic cartoon, animated-film concept art, ivory ceramic, brushed copper, dark teal metal joints, turquoise glass, warm upper-left key light, cool teal shadows, soft cyan rim light, slight front three-quarter camera from slightly above. Centered, occupying ~70% of a square 1024x1024 canvas, truly transparent alpha background. No text, no labels, no frame, no background, no hands, no ship. Readable at 48 px.` + o prompt do item.

---

## 5. Exemplares únicos (`xeno-specimens`, grade 4 colunas × 4 linhas)

São os **16 seres mais raros do jogo**, e cada um existe uma única vez. Precisam parecer **lendas vivas**: mais majestosos, luminosos e detalhados que as espécies comuns do `biology-atlas.png`, na mesma família de pintura. O "nível" vai de 1 a 3 (3 = mais raro): quanto maior, mais espetacular e mais brilho.

**Prompt-base (prefixo):**
`Use case: stylized-concept. Single production game sprite of ONE unique legendary alien creature/plant for a mobile space exploration game, matching the referenced biology atlas exactly: premium hand-painted dimensional realistic cartoon, animated-film concept art, rich organic brushwork, luminous bioluminescent accents, warm upper-left key light, cool teal shadows, soft rim light. Majestic and one-of-a-kind, more spectacular than the common species. Full body visible, centered, occupying ~78% of a square 1024x1024 canvas, strong distinctive silhouette, truly transparent alpha background. No text, no frame, no scenery, no ground except a tiny root clump or rock for plants.` + o prompt do item.

### 5.1 Raposa-aurora — `raposa-aurora` (linha 1, coluna 1)
- **Tipo:** fauna · nível 1 · vive na **Floresta bioluminescente**.
- **Comportamento:** **foge** ao ser avistada (captura com a Garra).
- **Lore:** "A última de uma linhagem que seguia as auroras de Íris. Seus olhos guardam o caminho das trilhas mais curtas."
- **Runa:** Runa do Faro (+3 de energia em cada expedição): é a guia, a que encontra caminhos.
- **Cinemática:** auroras dançam sobre o bosque luminoso e a raposa **dispara** entre elas, deixando um rastro de luz.
- **Clima:** saudade, elegância, velocidade. A última da espécie.
- **Aparência:** raposa esguia e alongada, pelagem azul-meia-noite, **cauda e colar formados por longas fitas de aurora** (violeta e teal) que ondulam como luz; olhos claros como estrelas; postura de alerta ou no meio de um salto.
- **Silhueta:** corpo de raposa + **cauda enorme em fitas** ondulando para trás.
- **Diferenciar de:** a raposa de musgo do `biology-atlas.png` é verde, fofa e folhosa. Esta é **escura, esguia, adulta, com luz de aurora**.
- **Prompt:** `RAPOSA-AURORA: slender graceful alien fox with deep midnight-blue fur, its tail and neck ruff made of long flowing ribbons of aurora light in violet and teal, star-bright pale eyes, caught mid-leap, elegant and melancholic, last of its kind.`

### 5.2 Salamandra de brasa — `salamandra-brasa` (linha 1, coluna 2)
- **Tipo:** fauna · nível 2 · **Mundo vulcânico** e **Oceano de magma**.
- **Comportamento:** **foge** (Garra).
- **Lore:** "Corre sobre a lava sem queimar as patas. Sua pele troca calor com o ar em silêncio."
- **Runa:** Runa da Brasa (+40 °C de proteção térmica no módulo gravado).
- **Cinemática:** a lava estala, ela corre sobre a lava e some e reaparece entre as fissuras, num ar tremeluzente de calor.
- **Clima:** perigo calmo, brasa viva.
- **Aparência:** salamandra de corpo baixo e cauda longa, **pele de obsidiana negra e brilhante** rachada por **veios de lava laranja**, babados (franjas) de brasa no pescoço, pontos de brasa nas costas.
- **Silhueta:** lagarto baixo e comprido, em movimento, com franjas no pescoço.
- **Prompt:** `SALAMANDRA DE BRASA: long low-bodied salamander with glossy obsidian-black skin cracked by glowing molten-orange lava veins, ember frills around the neck, ember spots along the spine, running pose, faint heat shimmer.`

### 5.3 Urso-geada — `urso-geada` (linha 1, coluna 3)
- **Tipo:** fauna · nível 2 · **Geleiras eternas**.
- **Comportamento:** **foge** (Garra).
- **Lore:** "Um gigante solitário das geleiras. Hiberna dentro de bolhas de ar que nunca congelam."
- **Runa:** Runa da Geada (+40 °C de isolamento criogênico).
- **Cinemática:** uma bolha de ar trinca o gelo eterno e o gigante desperta da hibernação.
- **Clima:** gigante sereno, solidão gelada, respeito.
- **Aparência:** urso enorme e robusto, pelagem branca densa, **placas de cristal de gelo translúcido** sobre ombros e costas, hálito de geada, uma **bolha de ar** grudada no pelo ou em volta da cabeça, detalhes azul-claros.
- **Silhueta:** massa grande e arredondada, de quatro patas, com espinhos de cristal nas costas.
- **Prompt:** `URSO-GEADA: huge solitary white bear with dense fur, translucent ice-crystal plates growing on its shoulders and back, frosty breath, a shimmering air bubble clinging to its fur, pale blue accents, calm and majestic.`

### 5.4 Mariposa de cristal — `mariposa-cristal` (linha 1, coluna 4)
- **Tipo:** fauna · nível 2 · **Deserto de cristais**.
- **Comportamento:** **camufla-se** (Rede de plasma). Só aparece depois de escanear.
- **Lore:** "Suas asas refratam a luz até desaparecer entre os prismas. Enxerga ecos que nenhum scanner capta."
- **Runa:** Runa do Prisma (+1 setor de alcance do scanner).
- **Cinemática:** a luz se parte em mil reflexos violeta e as asas de vidro **esvoaçam**, quase invisíveis.
- **Clima:** delicado, mágico, quase invisível.
- **Aparência:** mariposa vista de cima em três-quartos, **asas grandes de vidro prismático** que partem a luz em pequenos arco-íris, bordas quase invisíveis, corpo peludo claro, antenas plumosas.
- **Silhueta:** quatro asas abertas, largas: forma de borboleta inconfundível.
- **Prompt:** `MARIPOSA DE CRISTAL: moth with large open prismatic glass wings refracting light into small rainbows, nearly invisible crystal wing edges, soft pale fuzzy body, feathery antennae, seen from slightly above, delicate and magical.`

### 5.5 Escaravelho-ferro — `escaravelho-ferro` (linha 2, coluna 1)
- **Tipo:** fauna · nível 1 · **Dunas de cobre** e **Mundo errante**.
- **Comportamento:** **camufla-se** (Rede).
- **Lore:** "Enterra-se sob as dunas com uma carapaça mais dura que o casco de muitas naves."
- **Runa:** Runa da Carapaça (+25 de resistência do casco).
- **Cinemática:** as dunas tremem por baixo e a carapaça de ferro **rompe a areia**, com poeira.
- **Clima:** robusto, teimoso, blindado.
- **Aparência:** besouro pesado de **carapaça de ferro e cobre** (aspecto metálico natural, com pátina verde-teal nas bordas), chifre grosso, patas fortes, **areia escorrendo** da carapaça.
- **Silhueta:** cúpula oval com chifre: besouro-rinoceronte.
- **Prompt:** `ESCARAVELHO-FERRO: heavy rhinoceros beetle with a natural iron-and-copper metallic carapace with teal patina on the edges, thick horn, strong legs, copper sand grains pouring off its shell, sturdy and stubborn.`

### 5.6 Leviatã de vidro — `leviata-vidro` (linha 2, coluna 2)
- **Tipo:** fauna · nível 3 (raríssimo) · **Oceano de safira**.
- **Comportamento:** **libera toxina** (Casulo selado).
- **Lore:** "Uma medusa do tamanho de um entreposto. Seus filamentos dissolvem metal, mas ela canta antes de atacar."
- **Runa:** Runa das Profundezas (+3 atm de resistência à pressão).
- **Cinemática:** no fundo, uma canção atravessa a água, e o leviatã **deriva** e acende os filamentos antes de atacar, com anéis de som.
- **Clima:** colossal, sagrado, belo e perigoso.
- **Aparência:** medusa gigantesca de **vidro translúcido**, sino amplo com nervuras, **núcleo ciano luminoso** dentro, longos filamentos em fita que brilham, **anéis concêntricos de som** saindo do sino. Escala de criatura enorme (pequenas bolhas e partículas ajudam a dar o tamanho).
- **Silhueta:** sino + cortina de filamentos longos.
- **Diferenciar de:** a água-viva comum do `biology-atlas.png` é **violeta e perolada**. O leviatã é **vidro cristalino ciano-safira**, maior e mais imponente, com núcleo de luz e anéis de canto.
- **Prompt:** `LEVIATÃ DE VIDRO: colossal translucent glass jellyfish leviathan, crystal-clear bell with delicate ribs and a glowing cyan heart inside, long luminous ribbon filaments, faint concentric sound rings radiating from the bell as it sings, sapphire and cyan palette, sacred and dangerous.`

### 5.7 Lesma ácida — `lesma-acida` (linha 2, coluna 3)
- **Tipo:** fauna · nível 1 · **Pântano corrosivo**.
- **Comportamento:** **libera toxina** (Casulo).
- **Lore:** "Deixa trilhas que neutralizam as nuvens corrosivas do próprio mundo."
- **Runa:** Runa do Filtro (+20% de filtragem tóxica).
- **Cinemática:** a névoa corrosiva cobre o pântano e, por onde a lesma passa, **o ar fica limpo**.
- **Clima:** curiosa, humilde e útil. Ácida, mas purificadora.
- **Aparência:** lesma gorda e **luminosa, verde-limão translúcida**, dois olhos em pedúnculos, brilho úmido, deixando uma **trilha curta e limpa brilhante** atrás.
- **Silhueta:** corpo alongado e baixo com dois pedúnculos.
- **Prompt:** `LESMA ÁCIDA: plump translucent luminous lime-green slug, two eye stalks, glossy wet acidic sheen, inner glowing veins, leaving a short shining clean trail behind it, curious and gentle.`

### 5.8 Arraia-tempestade — `arraia-tempestade` (linha 2, coluna 4)
- **Tipo:** fauna · nível 3 (raríssimo) · **Gigante gasoso**.
- **Comportamento:** **flutua nas correntes** (Laço gravitacional).
- **Lore:** "Plana dentro de furacões sem bater as asas. Conhece cada corrente do gigante gasoso."
- **Runa:** Runa do Vento (+15% de eficiência de voo).
- **Cinemática:** o furacão ruge entre ilhas de nuvens e ela **plana** dentro dele sem bater as asas, entre relâmpagos.
- **Clima:** poder tranquilo, dona da tempestade.
- **Aparência:** arraia manta do céu, **asas com textura de nuvem de tempestade** (cinza-violeta), bordas crepitando com **pequenos relâmpagos**, ventre claro azul-branco luminoso, cauda longa.
- **Silhueta:** losango largo de manta com cauda fina.
- **Diferenciar de:** a arraia do céu comum é **ciano com marcas douradas**. A tempestade é **escura, de nuvem, com raios**.
- **Prompt:** `ARRAIA-TEMPESTADE: majestic sky manta ray gliding, wings textured like dark violet-grey storm clouds, small lightning arcs crackling along the wing edges, luminous pale blue-white underside, long thin tail, calm power.`

### 5.9 Samambaia-mãe — `samambaia-mae` (linha 3, coluna 1)
- **Tipo:** flora · nível 1 · **Floresta bioluminescente**.
- **Comportamento:** **libera toxina** (Casulo): esporos que ardem.
- **Lore:** "A planta de onde todas as samambaias-lume nasceram. Seus esporos ardem na pele."
- **Runa:** Runa do Fôlego (+30 de reserva de oxigênio).
- **Cinemática:** as frondes **se desenrolam**, e ao toque ela solta esporos ardentes.
- **Clima:** ancestral, matriarcal, sagrada.
- **Aparência:** samambaia antiga e gigante, tronco curto e musgoso, **grandes frondes desenrolando em espiral** (báculos), verde-esmeralda profundo com nervuras luminosas, **esporos cor de brasa** subindo em pontos alaranjados.
- **Silhueta:** leque de frondes com espirais no topo.
- **Diferenciar de:** a samambaia comum é verde-turquesa, com esporos turquesa. A mãe é **mais velha e maior, com tronco e esporos de brasa**.
- **Prompt:** `SAMAMBAIA-MÃE: ancient giant mother fern with a short mossy trunk, huge emerald fronds unfurling in spiral fiddleheads, faintly glowing veins, glowing ember-orange spores drifting upward, ancestral and sacred, small mossy root clump.`

### 5.10 Orquídea eterna — `orquidea-eterna` (linha 3, coluna 2)
- **Tipo:** flora · nível 2 · **Geleiras eternas**.
- **Comportamento:** **congela ao toque** (Cápsula criogênica).
- **Lore:** "Floresce há mil invernos sem murchar. Morre em segundos fora do frio."
- **Runa:** Runa da Constância (+2 de integridade nas expedições).
- **Cinemática:** **floresce** com um anel de geada; mil invernos e nenhuma pétala caída.
- **Clima:** eterno, frágil, solene.
- **Aparência:** orquídea de **pétalas de cristal de gelo azul-claro**, facetadas e translúcidas, labelo com brilho interno, haste coberta de geada, poucas folhas, raiz presa a um pequeno bloco de gelo.
- **Silhueta:** haste curva com flor de orquídea (labelo e pétalas laterais) bem definida.
- **Diferenciar de:** a orquídea de gelo comum parece um lírio aberto de cima. A eterna é uma **orquídea de verdade** (forma assimétrica), facetada como joia.
- **Prompt:** `ORQUÍDEA ETERNA: true orchid shape with faceted translucent ice-crystal petals in pale ice blue, softly glowing lip, frost-covered curved stem, a few frozen leaves, rooted in a small ice block, eternal and fragile, jewel-like.`

### 5.11 Flor do vazio — `flor-vazio` (linha 3, coluna 3)
- **Tipo:** flora · nível 3 (raríssima) · **Mundo errante** e **Deserto de cristais**.
- **Comportamento:** **congela ao toque** (Cápsula criogênica).
- **Lore:** "Cresce em planetas sem estrela. Suas pétalas dobram a luz como uma pequena dobra espacial."
- **Runa:** Runa da Dobra (+30% de eficiência de dobra).
- **Cinemática:** num mundo sem estrela, a flor **se fecha e se abre** dobrando a própria luz (lente gravitacional).
- **Clima:** mistério cósmico, silêncio do espaço profundo.
- **Aparência:** flor de **pétalas negro-violeta** com bordas de luz violeta, centro escuro como um pequeno buraco negro, **anéis de luz curvada** ao redor (efeito de lente), poeira de estrelas.
- **Silhueta:** flor aberta de pétalas pontiagudas, com halo em anel.
- **Prompt:** `FLOR DO VAZIO: dark black-violet flower with pointed petals rimmed in glowing violet light, a tiny dark core like a miniature black hole, rings of bent light curving around it like gravitational lensing, faint stardust, cosmic mystery, palette of the cosmic atlas.`

### 5.12 Lírio solar — `lirio-solar` (linha 3, coluna 4)
- **Tipo:** flora · nível 1 · **Dunas de cobre**.
- **Comportamento:** **irradia calor** (Coletor térmico).
- **Lore:** "Acumula a luz do dia e a devolve à noite. Respira por toda a planta."
- **Runa:** Runa do Sol (+15% de eficiência do ar).
- **Cinemática:** o dia inteiro guardado em pétalas, e à noite o lírio **devolve o sol** num clarão de raios.
- **Clima:** caloroso, generoso, esperança.
- **Aparência:** lírio dourado em trombeta, pétalas douradas e cor de mel que **irradiam raios suaves de sol**, estames laranja quentes, haste verde-dourada e folhas finas.
- **Silhueta:** trombeta de lírio com pétalas para fora e haste.
- **Prompt:** `LÍRIO SOLAR: radiant golden trumpet lily with honey-gold petals emitting soft sun rays, warm orange stamens, green-gold stem and slender leaves, glowing like stored sunlight, warm and generous.`

### 5.13 Cacto de magma — `cacto-magma` (linha 4, coluna 1)
- **Tipo:** flora · nível 2 · **Oceano de magma** e **Mundo vulcânico**.
- **Comportamento:** **irradia calor** (Coletor térmico).
- **Lore:** "Bebe rocha derretida. Quem o toca sente o pulso do planeta."
- **Runa:** Runa da Colheita (+15% de rendimento de coleta).
- **Cinemática:** a rocha derretida sobe pelas raízes e o cacto **pulsa** como um coração no ritmo do planeta.
- **Clima:** força geológica, batimento.
- **Aparência:** cacto de **basalto cinza-escuro** em colunas sulcadas, rachaduras revelando **núcleo de magma laranja** que pulsa, espinhos incandescentes, uma flor de brasa no topo.
- **Silhueta:** colunas verticais tipo candelabro, diferente do cacto comum, que é redondo.
- **Diferenciar de:** a suculenta de brasa comum é **cobre e arredondada**. O cacto de magma é **pedra escura em colunas, com fendas de magma**.
- **Prompt:** `CACTO DE MAGMA: columnar candelabra cactus made of dark grey ribbed basalt, deep cracks revealing a pulsing molten orange magma core, glowing incandescent spines, one ember flower on top, geological power.`

### 5.14 Alga nebular — `alga-nebular` (linha 4, coluna 2)
- **Tipo:** flora · nível 2 · **Gigante gasoso** e **Oceano de safira**.
- **Comportamento:** **flutua nas correntes** (Laço gravitacional).
- **Lore:** "Uma floresta que flutua entre nuvens, presa por nada."
- **Runa:** Runa da Leveza (+1 espaço de carga na expedição).
- **Cinemática:** uma floresta inteira **flutua** entre as nuvens, e o laço a amarra pela primeira vez.
- **Clima:** leveza, sonho, liberdade.
- **Aparência:** **alga-floresta flutuante**: bexigas de gás luminosas no topo (como balões pequenos), de onde pendem **longas fitas de alga onduladas** em rosa e teal de nebulosa, com névoa leve.
- **Silhueta:** cachos de balões em cima e fitas pendendo, como um candelabro vivo.
- **Prompt:** `ALGA NEBULAR: floating cloud-forest kelp, a cluster of small glowing gas bladders on top with long wavy kelp ribbons hanging below in nebula pink and teal, wisps of mist, drifting weightlessly, dreamy.`

### 5.15 Coral cantor — `coral-cantor` (linha 4, coluna 3)
- **Tipo:** flora · nível 2 · **Oceano de safira**.
- **Comportamento:** **camufla-se** (Rede de plasma).
- **Lore:** "Imita a cor do fundo do mar e canta em frequências que guiam cardumes."
- **Runa:** Runa do Eco (+15% de bônus de pesquisa).
- **Cinemática:** o fundo do mar muda de cor e canta, e o coral se **revela** com ondas de sonar.
- **Clima:** musical, comunitário, escondido.
- **Aparência:** coral ramificado de **galhos tubulares rosa e teal**, pólipos luminosos nas pontas, **anéis concêntricos de som** saindo das pontas, sobre uma pequena rocha.
- **Silhueta:** arbusto ramificado de galhos tubulares em leque.
- **Prompt:** `CORAL CANTOR: branching coral with tubular branches in pink and teal, glowing polyps at the tips, faint concentric sound rings rising from the tips like song, on a small rock, musical and secretive.`

### 5.16 Trepadeira prisma — `trepadeira-prisma` (linha 4, coluna 4)
- **Tipo:** flora · nível 3 (raríssima) · **Deserto de cristais** e **Pântano corrosivo**.
- **Comportamento:** **libera toxina** (Casulo selado): espinhos de veneno lento.
- **Lore:** "Envolve cristais inteiros e os faz crescer. Seus espinhos guardam um veneno lento."
- **Runa:** Runa do Abrigo (+2 espaços no armazém de módulos).
- **Cinemática:** os cristais **crescem** onde ela se enrosca e os espinhos brilham.
- **Clima:** beleza perigosa, paciente.
- **Aparência:** trepadeira **violeta com espinhos** enrolada num aglomerado de **cristais prismáticos transparentes** que refletem pequenos arco-íris; algumas folhas e uma flor discreta.
- **Silhueta:** cristais pontudos verticais com uma vinha em espiral.
- **Prompt:** `TREPADEIRA PRISMA: violet thorny vine coiling around a cluster of clear prismatic crystals that it makes grow, crystals casting tiny rainbow glints, glowing thorn tips, a few leaves and one small bloom, dangerous beauty.`

---

## 6. Peças do Estaleiro estelar (`yard-parts`, grade 4 colunas × 3 linhas)

O Estaleiro é uma grade de **5×7 com forma de foguete**, sobreposta à Andorinha. O jogador compra peças em entrepostos (cada galáxia tem uma facção que vende 4 peças) e as monta por cima do casco, com limite de **massa** e **energia**. As peças aparecem **desenhadas sobre a nave pintada** na tela principal. Por isso precisam ser **acessórios aparafusáveis da mesma nave**: mesma cerâmica marfim, mesmo cobre, mesmas juntas teal e a mesma luz da `andorinha-illustrated.png`. A câmera deve ser **quase frontal** (como a nave), para encaixar na vista da nave.

**Formato da peça na grade:** a célula da imagem é quadrada, mas a peça ocupa 1×1, 1×2 (alta), 2×1 (larga) ou 2×2. Desenhe o objeto **com a proporção do encaixe** e centralizado no quadrado: peça alta = objeto alto e estreito; peça larga = objeto largo e baixo.

**Sotaque de cada facção** (sutil, sem fugir dos materiais da nave):
- **Coletivo Aural:** civil e solar. Formas arredondadas e lisas, mais marfim, acentos azul-solar.
- **Nômades Veyra:** viajantes de propulsão. Formas varridas e aerodinâmicas, mais cobre, remendos e desgaste de longa viagem, brilho âmbar.
- **Liga Thar:** ciência e sensores. Geometria precisa, lentes e vidros turquesa, linhas técnicas finas.

**Prompt-base (prefixo):**
`Use case: stylized-concept. Single production game sprite of ONE external bolt-on hull part for the referenced Andorinha retrofuturist rocket, same materials and lighting exactly: premium hand-painted dimensional realistic cartoon, animated-film concept art, ivory ceramic panels, brushed copper and orange-copper trims, dark teal metal joints, turquoise glass, tiny warm lamps, gentle travel wear, warm upper-left key light, cool teal shadows. Near-front view matching the ship's front view so it can be attached on top of it. Centered on a square 1024x1024 canvas with transparent margins, truly transparent alpha background. No text, no labels, no frame, no background, no complete ship, no hands. Readable at 40 px.` + o prompt do item.

### 6.1 Tanque externo — `tanque-externo` (linha 1, coluna 1) · Coletivo Aural · **1×2 (alta)**
- **O que faz:** +20 de tanque de combustível. Massa 4, sem consumo de energia. 140 Lumes.
- **Clima:** autonomia para ir mais longe.
- **Aparência:** **cápsula de combustível alta**, de pontas arredondadas, marfim, com **duas cintas de cobre** e uma janelinha de nível turquesa; suportes teal de fixação nas costas.
- **Prompt:** `TANQUE EXTERNO (tall, 1x2): tall rounded ivory capsule fuel tank standing vertical, two copper straps, a small turquoise fuel gauge window, dark teal mounting brackets, smooth Aural civilian design.`

### 6.2 Reservatório de O₂ — `reservatorio-o2` (linha 1, coluna 2) · Coletivo Aural · **1×1**
- **O que faz:** +15 de reserva de oxigênio. Massa 2. 120 Lumes.
- **Clima:** fôlego extra, segurança.
- **Aparência:** **esfera marfim** de oxigênio com anel equatorial de cobre, válvula teal no topo e uma luzinha verde-turquesa.
- **Diferenciar de:** os cilindros de oxigênio dos módulos, que são verticais e aos pares. Aqui é **uma esfera**.
- **Prompt:** `RESERVATÓRIO DE O₂ (1x1): compact round ivory oxygen sphere with a copper equator band, a dark teal valve on top and a small turquoise indicator light, mounting collar.`

### 6.3 Placas de casco — `placas-casco` (linha 1, coluna 3) · Coletivo Aural · **1×1**
- **O que faz:** +10 de resistência do casco. Massa 3. 110 Lumes. Pode-se montar várias.
- **Clima:** proteção sólida.
- **Aparência:** **placa de blindagem em forma de escudo**, levemente curva, cerâmica marfim sobre base teal, borda de cobre rebitada, marcas de desgaste.
- **Prompt:** `PLACAS DE CASCO (1x1): slightly curved shield-shaped ivory ceramic armour plate layered over a dark teal backing plate, riveted copper rim, subtle scratches and wear.`

### 6.4 Vela solar — `vela-solar` (linha 1, coluna 4) · Coletivo Aural · **2×1 (larga)**
- **O que faz:** +5% de eficiência do ar e **gera 2 de energia** para outras peças. Massa 1. 260 Lumes.
- **Clima:** leveza, energia limpa.
- **Aparência:** **par de painéis solares azul-profundo** (células em grade, reflexo brilhante), molduras de cobre, abertos para os dois lados de um pequeno eixo marfim.
- **Prompt:** `VELA SOLAR (wide, 2x1): wide pair of glossy deep-blue photovoltaic solar panels with fine cell grid, copper frames, unfolded left and right from a small ivory hinge hub, sparkling reflections.`

### 6.5 Quilha estabilizadora — `quilha` (linha 2, coluna 1) · Nômades Veyra · **1×2 (alta)**
- **O que faz:** +6% de eficiência de voo. Massa 3, consome 1 de energia. 180 Lumes.
- **Clima:** voo estável, viajante experiente.
- **Aparência:** **aleta varrida para trás**, alta, marfim, com **espinha de cobre** no bordo de ataque, base teal e uma lâmpada teal pequena; leves remendos de viagem.
- **Prompt:** `QUILHA ESTABILIZADORA (tall, 1x2): tall swept-back ivory stabiliser fin with a copper spine along its leading edge, dark teal root mount, tiny teal lamp, travel-worn patches, Veyra nomad aerodynamic style.`

### 6.6 Nacela auxiliar — `nacela` (linha 2, coluna 2) · Nômades Veyra · **1×2 (alta)**
- **O que faz:** +10% de voo e +5% de dobra. Massa 4, consome 2 de energia. 300 Lumes.
- **Clima:** impulso extra, velocidade.
- **Aparência:** **nacela de propulsão esguia de cobre**, alta, nariz marfim, bocal teal escuro embaixo com **brilho âmbar** suave.
- **Diferenciar de:** os propulsores laterais da própria Andorinha. A nacela é **mais fina e alta, um propulsor acoplável**.
- **Prompt:** `NACELA AUXILIAR (tall, 1x2): slim tall copper auxiliary booster nacelle, ivory nose cap, dark teal bell nozzle at the bottom with a faint warm amber glow, small intake vents, Veyra nomad style.`

### 6.7 Baia de drones — `baia-drones` (linha 2, coluna 3) · Nômades Veyra · **2×2**
- **O que faz:** +10% de coleta e +1 de carga na expedição. Massa 5, consome 3 de energia. 420 Lumes.
- **Clima:** pequenos ajudantes, colmeia útil.
- **Aparência:** **caixa-hangar marfim** robusta com **escotilha aberta**, mostrando dois **drones teal** pequenos (um saindo), luzes turquesa dentro da baia, acabamento de cobre.
- **Prompt:** `BAIA DE DRONES (2x2): sturdy ivory hangar box module with an open hatch, two tiny teal survey drones (one flying out), turquoise bay lights inside, copper trim, chunky square proportion.`

### 6.8 Reator compacto — `reator-compacto` (linha 2, coluna 4) · Nômades Veyra · **1×1**
- **O que faz:** **gera 4 de energia** para outras peças. Massa 3. 240 Lumes.
- **Clima:** coração quente, pulsante.
- **Aparência:** **cápsula marfim arredondada** com janela redonda mostrando um **núcleo âmbar-laranja brilhante**, anéis de refrigeração de cobre.
- **Diferenciar de:** o reservatório de O₂, que é uma esfera fria com luz turquesa. O reator é **quente, âmbar, com janela de núcleo**.
- **Prompt:** `REATOR COMPACTO (1x1): rounded ivory reactor pod with a round window showing a glowing amber-orange core, copper cooling rings around it, warm pulsing light.`

### 6.9 Antena de longo alcance — `antena-longa` (linha 3, coluna 1) · Liga Thar · **1×1**
- **O que faz:** +1 setor de alcance do scanner. Massa 1, consome 3 de energia. 320 Lumes.
- **Clima:** escuta do distante.
- **Aparência:** **prato parabólico marfim** pequeno sobre **mastro fino de cobre**, ponta emissora turquesa no foco.
- **Diferenciar de:** o radar do `modules-atlas.png` (prato grande sobre base). Aqui é **um prato menor num mastro alto e fino**.
- **Prompt:** `ANTENA DE LONGO ALCANCE (1x1): small ivory parabolic dish on a slender copper mast, turquoise emitter tip at its focus, precise Thar technical lines.`

### 6.10 Matriz de sensores — `matriz-sensores` (linha 3, coluna 2) · Liga Thar · **2×1 (larga)**
- **O que faz:** +10% de bônus de pesquisa. Massa 2, consome 2 de energia. 220 Lumes.
- **Clima:** observação atenta.
- **Aparência:** **barra horizontal marfim** com **três olhos de vidro turquesa** em linha, tampas de cobre nas pontas.
- **Prompt:** `MATRIZ DE SENSORES (wide, 2x1): horizontal ivory sensor bar with three round turquoise glass sensor eyes in a row, copper end caps, fine technical engravings.`

### 6.11 Defletor de campo — `defletor` (linha 3, coluna 3) · Liga Thar · **2×1 (larga)**
- **O que faz:** +1 de integridade nas expedições. Massa 2, consome 2 de energia. 260 Lumes.
- **Clima:** proteção invisível.
- **Aparência:** **arco emissor curvo horizontal** (teal escuro e cobre) projetando acima uma **cúpula de energia turquesa translúcida**.
- **Diferenciar de:** o escudo do `modules-atlas.png` (esfera fechada). Aqui é **um arco largo com uma meia-cúpula de energia**.
- **Prompt:** `DEFLETOR DE CAMPO (wide, 2x1): wide curved horizontal emitter arc of dark teal metal and copper, projecting a translucent turquoise energy shield half-dome above it, faint hexagonal shimmer.`

### 6.12 Contêiner orbital — `conteiner-orbital` (linha 3, coluna 4) · Liga Thar · **2×2**
- **O que faz:** +2 espaços no armazém de módulos. Massa 6 (a mais pesada). 380 Lumes.
- **Clima:** robustez, carga.
- **Aparência:** **contêiner de carga** quadrado e robusto, marfim com **cintas e cantoneiras de cobre**, uma placa de identificação marfim **sem texto**, escotilha e pequenas luzes de status.
- **Diferenciar de:** a baia de drones, que tem escotilha aberta e drones. O contêiner é **fechado e pesado**.
- **Prompt:** `CONTÊINER ORBITAL (2x2): sturdy closed square cargo container, ivory body with copper bands and corner brackets, a blank ivory plate (no text), sealed hatch, small status lights, heavy and solid.`

---

## 7. Checklist antes de entregar

- [ ] 34 PNGs com fundo transparente real, nos nomes `<id>.png` das pastas da seção 3.
- [ ] Mesmo estilo de pintura das referências, com luz vindo de cima à esquerda em todas.
- [ ] A 48 px, cada ferramenta se distingue das outras cinco, e cada peça das outras onze.
- [ ] Em silhueta preta, cada exemplar é reconhecível e diferente dos outros quinze.
- [ ] Os exemplares únicos não repetem as espécies comuns do `biology-atlas.png` (água-viva violeta, raposa de musgo, arraia ciano, samambaia turquesa, orquídea-lírio, suculenta de cobre).
- [ ] As peças altas (1×2) são altas, as largas (2×1) são largas, e todas ficam bem sobre o casco marfim.
- [ ] Nenhum texto, moldura, chão grande ou glow cortado na borda.
- [ ] Rodou `python3 qa/prepare-xeno-yard-art.py` e conferiu os três `.webp` gerados em `assets/`.
- [ ] Registrou ao final de `ARTE.md` (data, ferramenta, prompts usados), como nas seções anteriores.
