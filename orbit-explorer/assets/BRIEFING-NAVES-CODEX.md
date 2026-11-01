# Briefing de arte: as naves do Órbita

Para quem vai pintar (Codex, com a mesma ferramenta de imagens usada em `ARTE.md`). A frota terá **10 naves prontas**: a Andorinha, que já existe, e as **9 novas** deste documento. Cada nave nova precisa de **2 pinturas**: a nave fechada e a nave aberta com os 8 encaixes de módulos. São **18 imagens** no total.

Cada item traz: o que a nave é, o que ela muda no jogo, quem a vende, o clima, a silhueta e o que **não** pode parecer. O padrão de qualidade é o da `andorinha-illustrated.png`: uma nave pronta, inteira e bem acabada, e não uma montagem de peças.

---

## 1. O que muda no jogo

O jogador começa com a Andorinha. Um **viajante** aparece de vez em quando numa estação espacial com **uma nave sorteada** à venda, paga em Lumes. Se o jogador não comprar, na próxima visita pode ser outra. As naves compradas ficam num **hangar**, e o jogador troca de nave numa estação. Os 8 módulos, as runas, a pintura e o rastro passam para a nave nova.

Cada nave tem **personalidade**: dois pontos fortes e um ponto fraco claros. É isso que a arte precisa contar. Quem vê a silhueta deve adivinhar para que a nave serve.

**Tom:** o mesmo do jogo. Maravilhamento, aventura contemplativa e retrofuturismo caloroso de filme de animação. Nada militar: **nenhuma arma, canhão ou míssil**. São naves de exploradores, trabalhadores e viajantes.

## 2. Padrão visual obrigatório (o mesmo da Andorinha)

**Referências abertas ao gerar:**
- `andorinha-illustrated.png`: materiais, luz, câmera e acabamento. É a referência principal.
- `andorinha-open.png`: como a nave aberta mostra os encaixes vazios.
- `modules-atlas.png` e `cosmic-atlas.png`: família de equipamentos e o brilho violeta raro.

**Frase de estilo usada em toda a arte do jogo:**
> premium hand-painted dimensional realistic cartoon, animated-film concept art, rich organic brushwork, warm upper-left key light, cool teal shadows, soft cyan rim light, truly transparent alpha background, no text, no logos, no frame, no background, no floor, no cast shadow, no flame

**Materiais da família:** casco de **cerâmica marfim** como base, **cobre alaranjado** como cor de destaque, juntas de **metal teal escuro**, **vidro turquesa** nas cabines e lentes, pequenas lâmpadas quentes, painéis de serviço plausíveis e desgaste leve de viagem.

**A cor de destaque precisa ser o cobre alaranjado em todas as naves.** O jogo tem um sistema de **pintura** que gira o tom dessa cor, e as cores da loja são calibradas a partir do cobre da Andorinha. Uma nave com destaque verde ou azul de fábrica sairia com as cores erradas. A variedade vem da **forma**, da proporção, dos detalhes e da quantidade de cobre, e não de outra paleta. Exceção controlada: a Fênix pode ter um brilho âmbar e violeta nas aletas de energia, além do cobre.

**Câmera:** a mesma da Andorinha. Nave **em pé, nariz para cima**, eixo vertical reto, vista frontal em três-quartos com um giro leve. Nada de nave deitada ou vista de lado. As chamas são desenhadas pelo jogo, então os bocais ficam **apagados**.

**Nunca:** vetor chapado, low-poly, pixel art, contorno preto grosso, estilo brinquedo, cópia de nave conhecida de filme ou de jogo, texto, logotipo, número de série legível, armas, chão, sombra projetada ou chama.

## 3. Entrega técnica

### Arquivos por nave

| Arquivo | O que é | Formato |
|---|---|---|
| `assets/src/ships/<id>.png` | nave fechada | PNG RGBA 1024 × 1536 (retrato), fundo transparente |
| `assets/src/ships/<id>-open.png` | a mesma nave com as portas do casco abertas e 8 encaixes vazios | PNG RGBA 1024 × 1536, fundo transparente |

Os `<id>` estão em cada item da seção 5. Registre os prompts finais em `assets/src/ships/prompts.json` e uma seção nova no fim de `ARTE.md`, como nas entregas anteriores.

### Enquadramento (vale para as duas imagens de cada nave)
- A nave ocupa **de 2% a 98% da altura** do quadro (cerca de 1.475 px), como a Andorinha. Todas as naves ficam com a **mesma altura** e variam na largura. Assim aparecem na mesma escala em todas as telas.
- A largura pode ir de cerca de 45% (nave esguia) até 95% (nave de asas longas), sempre centralizada no eixo vertical.
- A versão aberta tem **exatamente o mesmo contorno, posição e escala** da fechada. Gere a aberta a partir da fechada (edição com referência), nunca do zero.

### Os 8 encaixes da nave aberta (posições fixas)
O jogo desenha os módulos sobre os encaixes em posições fixas, iguais para todas as naves. A imagem `assets/src/ships/guia-interior-1024x1536.png` marca essas posições. Sobreponha a guia à pintura para conferir; cada encaixe precisa cair dentro da sua caixa.

- **2 colunas e 4 linhas**, centros em **x = 42,1% e 58,0%** da largura.
- Linhas em **y = 35,2%, 44,6%, 54,0% e 63,9%** da altura.
- Cada encaixe tem cerca de **12% da largura × 9% da altura**: quadrado, rebaixado, escuro, com trilhos de cobre e luzes ciano, **vazio**.
- O rack de equipamentos vai de cerca de 28% a 72% da altura. A cabine fica acima, e a propulsão abaixo.
- Na nave aberta, as portas do casco se abrem para os lados sem cobrir nenhum encaixe. Em naves largas, o rack fica no centro e o resto da nave aparece em volta.

### Bocais (chamas)
O jogo acende as chamas em cima dos bocais. Para cada nave, anote em `assets/src/ships/naves.json` a posição de cada bocal na imagem fechada, em porcentagem do quadro: `{"id": "beija-flor", "bocais": [{"x": 50.0, "y": 96.5, "tipo": "principal"}, {"x": 31.0, "y": 88.0, "tipo": "lateral"}]}`. O ponto é o centro da boca do bocal, onde a chama começa.

### Onde a nave aparece
- Tela principal, girando e flutuando, em cerca de 220 a 320 px de altura.
- Nave aberta, com zoom nos encaixes.
- Viagem, dobra e atracagem, em tamanho menor.
- Card do viajante e hangar, em cerca de 120 px.

Por isso a **silhueta precisa ser reconhecível pequena**, e cada nave diferente das outras nove.

---

## 4. Facções que vendem naves

O viajante traz naves das três civilizações que o jogo já tem. O sotaque de cada uma é sutil e sempre dentro dos materiais da Andorinha:

- **Coletivo Aural:** civil e solar. Formas arredondadas e lisas, mais marfim, painéis solares.
- **Nômades Veyra:** viajantes de propulsão. Formas varridas e aerodinâmicas, mais cobre, remendos e desgaste de longas viagens.
- **Liga Thar:** ciência e sensores. Geometria precisa, lentes e vidros turquesa, linhas técnicas finas.

Todas as naves têm **nome de ave**, como a Andorinha. A forma lembra a ave sem virar caricatura: nada de olhos, bico literal ou penas.

---

## 5. As naves

**Prompt-base da nave fechada (prefixo):**
`Use case: stylized-concept. Asset type: final transparent sprite for a mobile space exploration game, NOT a UI mockup. Paint one gorgeous original explorer spaceship from the same fleet as the referenced Andorinha: same premium hand-painted animated-film concept art, same ivory ceramic hull, orange-copper accents, brushed dark teal metal joints, turquoise glass, tiny warm navigation lamps, believable recessed service panels and gentle travel wear, dramatic soft rim light from upper left, warm ceramic highlights against cool blue shadows. Upright spaceship pointing straight up, front three-quarter view with only slight yaw, vertical axis perfectly vertical, full ship in frame, centered, ship spans from 2% to 98% of the image height. Engine nozzles unlit: no flame. No weapons. No background, no floor, no cast shadow, no typography, no logos, no watermark. True transparent alpha background. Rich dimensional illustration, no low-poly, no wireframe, no pixel art, no toy look. Portrait 1024x1536.` + o prompt da nave.

**Prompt-base da nave aberta (edição da imagem fechada):**
`Edit this exact spaceship. Keep the same silhouette, scale, position, materials, cockpit and engines. Swing its front hull doors open to the sides to reveal a central equipment rack with EXACTLY EIGHT empty square recessed sockets in TWO columns and FOUR rows, dark teal interior, thin copper rails, subtle cyan socket lights, cables behind. Socket centres at x 42% and 58% of the image width and y 35%, 45%, 54% and 64% of the image height, each socket about 12% of the image width and 9% of the image height. All eight sockets fully visible, unobstructed and empty. Doors must not cover any socket. Same transparent alpha background, no text, no equipment inside the sockets. Portrait 1024x1536.`

### 0. Andorinha — `andorinha` (já existe, referência)
- **Papel:** a nave inicial, equilibrada em tudo. É a medida de comparação das outras.
- **Silhueta:** foguete em forma de pera, cabine panorâmica no nariz, dois propulsores laterais curtos com aletas e um motor central.
- **Não repetir:** as outras nove não podem ser "Andorinha com outra proporção". Cada uma precisa de uma silhueta própria.

### 5.1 Beija-flor — `beija-flor`
- **Facção:** Nômades Veyra · **Raridade:** comum · **Preço sugerido:** 2.200 Lumes.
- **Papel:** batedora. A nave mais rápida e econômica para voar entre planetas.
- **No jogo:** ✦ +25% de eficiência de voo · ✦ +10% de eficiência de dobra · ✧ −20 de casco e −1 de carga na expedição.
- **Clima:** agilidade, alegria e leveza. A nave que chega primeiro.
- **Silhueta:** a menor e mais **esguia** da frota (cerca de 45% da largura). Fuselagem fina como agulha, nariz longo e pontudo com uma antena de proa fina (lembra o bico, sem ser bico). Duas **asinhas curtas e altas** perto do meio do corpo, inclinadas para trás como asas em movimento. Um motor central pequeno e dois micropropulsores nas pontas das asinhas.
- **Detalhes:** cabine estreita em gota, faixas de cobre finas em espiral, remendos de viagem dos Veyra.
- **Não pode parecer:** uma Andorinha encolhida, nem um míssil. Tem que ter cabine e ar de nave pilotada.
- **Prompt:** `BEIJA-FLOR scout ship: the slimmest and smallest of the fleet, needle-thin ivory fuselage about 45% of the image width, long pointed nose with a fine bow antenna, narrow teardrop turquoise cockpit, two short high swept-back winglets near mid-body like wings caught in motion, tiny micro-thrusters at the winglet tips and one small central engine, thin copper spiral stripes, Veyra nomad travel patches, joyful and agile.`

### 5.2 Albatroz — `albatroz`
- **Facção:** Coletivo Aural · **Raridade:** comum · **Preço sugerido:** 2.600 Lumes.
- **Papel:** longo curso. Vai mais longe sem reabastecer.
- **No jogo:** ✦ +40 de tanque de combustível · ✦ +15% de eficiência do ar (os painéis solares ajudam o suporte de vida) · ✧ −10% de rendimento de coleta.
- **Clima:** serenidade, travessias longas, horizonte.
- **Silhueta:** a nave de **maior envergadura** (cerca de 95% da largura). Corpo central esguio e **duas asas longas e retas**, levemente inclinadas para baixo, com painéis solares azul-escuros embutidos nas asas. Dois tanques alongados sob as asas, perto do corpo. Motor central largo.
- **Detalhes:** cabine panorâmica alongada, asas com bordas de cobre e luzes de posição nas pontas.
- **Não pode parecer:** avião de passageiros ou ônibus espacial. É uma nave planadora de outro mundo.
- **Prompt:** `ALBATROZ long-range cruiser: slender ivory central fuselage with the widest wingspan of the fleet, two long straight wings spanning about 95% of the image width and drooping slightly, deep-blue solar panels inlaid in the wings with copper edges, navigation lamps at the wing tips, two elongated fuel tanks under the wings near the body, elongated panoramic turquoise cockpit, one broad central engine, smooth rounded Aural civilian design, serene.`

### 5.3 Pelicano — `pelicano`
- **Facção:** Coletivo Aural · **Raridade:** comum · **Preço sugerido:** 2.400 Lumes.
- **Papel:** cargueira. Carrega mais módulos e mais coleta em cada expedição.
- **No jogo:** ✦ +3 espaços no armazém de módulos · ✦ +1 de carga na expedição e +20 de casco · ✧ −15% de eficiência de voo.
- **Clima:** trabalhadora, confiável e bonachona.
- **Silhueta:** **bojuda e larga embaixo** (cerca de 75% da largura). Cabine pequena no alto, e logo abaixo um **grande compartimento de carga arredondado na frente** (o "papo"), com portas de carga marcadas. Base larga com **quatro motores** em linha. Aletas curtas e grossas.
- **Detalhes:** cintas de cobre em volta do porão, alças de amarração, luz âmbar de carga.
- **Não pode parecer:** caixote sem graça. É robusta, mas tem curvas e charme.
- **Prompt:** `PELICANO cargo hauler: bulky ivory hull widening toward the base, about 75% of the image width, small cockpit high on top, a large rounded cargo hold bulging at the front below the cockpit with marked cargo doors and copper strap bands, tie-down handles, amber cargo lights, short thick fins, four engines in a row at the wide base, sturdy but charming rounded Aural design.`

### 5.4 Coruja — `coruja`
- **Facção:** Liga Thar · **Raridade:** rara · **Preço sugerido:** 3.600 Lumes.
- **Papel:** observatório. Enxerga mais longe e pesquisa melhor.
- **No jogo:** ✦ +1 setor de alcance do scanner · ✦ +15% de bônus de pesquisa · ✧ −15 de combustível.
- **Clima:** sabedoria, noite, silêncio de laboratório.
- **Silhueta:** corpo **arredondado e compacto** (cerca de 70% da largura), com uma **cúpula larga** no topo e **duas grandes lentes turquesas redondas** lado a lado na frente da cúpula (lembram olhos sem ser rosto). Duas **antenas curtas** pontiagudas no alto da cúpula (lembram orelhas de coruja). Motores discretos embaixo, escondidos por uma saia arredondada.
- **Detalhes:** anéis de lente em cobre, linhas técnicas finas da Liga Thar, luzes ciano.
- **Não pode parecer:** rosto de desenho animado. As lentes são instrumentos, sem pupila nem sobrancelha.
- **Prompt:** `CORUJA observatory ship: compact rounded ivory body about 70% of the image width, a wide observation dome on top, two large round turquoise telescope lenses side by side at the front of the dome with copper lens rings (scientific instruments, not a face), two short pointed antennas rising from the top of the dome, discreet engines hidden under a rounded skirt, fine technical lines and cyan lights, precise Thar science design, wise and quiet.`

### 5.5 Martim-pescador — `martim-pescador`
- **Facção:** Nômades Veyra · **Raridade:** rara · **Preço sugerido:** 3.400 Lumes.
- **Papel:** mineradora. Rende mais em cada coleta e aguenta mais tempo em campo.
- **No jogo:** ✦ +15% de rendimento de coleta · ✦ +3 de energia em cada expedição · ✧ −10% de eficiência do ar.
- **Clima:** mergulho certeiro, trabalho de precisão.
- **Silhueta:** compacta e **pontuda para cima** (cerca de 55% da largura). O nariz é uma **broca de perfuração** de cobre em espiral, longa e afiada (lembra o bico do martim-pescador). Logo atrás, uma cabine baixa e blindada. Dois **braços de coleta dobrados** junto ao corpo, um de cada lado. Dois motores médios.
- **Detalhes:** pó de minério nos cantos, ferramentas presas no casco, remendos dos Veyra.
- **Não pode parecer:** arma ou torpedo. É ferramenta de trabalho.
- **Prompt:** `MARTIM-PESCADOR mining ship: compact upward-pointing ivory hull about 55% of the image width, its nose is a long sharp spiral copper drill bit, low armoured turquoise cockpit right behind the drill, two folded collection arms tucked against the sides, two medium engines, ore dust in the panel seams, tools strapped to the hull, Veyra nomad patches, precise and hard-working, not a weapon.`

### 5.6 Pinguim — `pinguim`
- **Facção:** Coletivo Aural · **Raridade:** rara · **Preço sugerido:** 3.200 Lumes.
- **Papel:** polar e submersa. Feita para mundos gelados e oceanos profundos.
- **No jogo:** ✦ +60 °C de isolamento contra o frio · ✦ +3 atm de resistência à pressão · ✧ −10% de eficiência de voo e −20 °C de proteção contra o calor.
- **Clima:** resistência serena em lugares hostis, aconchego.
- **Silhueta:** **atarracada e oval** (cerca de 60% da largura), larga na barriga, com o casco **grosso e acolchoado** em placas marfim. Barriga frontal em placa clara lisa. Duas **aletas curtas** laterais, viradas para baixo, como nadadeiras. Cabine pequena e redonda com vidro grosso. Um motor central largo e curto.
- **Detalhes:** escotilhas pressurizadas com parafusos grandes, resíduos de gelo nas bordas, luzes azul-claras.
- **Não pode parecer:** mascote fofo. É fofa no formato, mas tem acabamento sério de equipamento.
- **Prompt:** `PINGUIM polar and deep-sea ship: stout oval ivory hull about 60% of the image width, wide at the belly, thick padded ceramic plating, a smooth pale front belly plate, two short downward side flippers, small round cockpit with thick turquoise glass, pressurised hatches with big bolts, frost residue on the edges, pale blue lights, one short wide central engine, rugged serious equipment finish, rounded Aural design.`

### 5.7 Carcará — `carcara`
- **Facção:** Nômades Veyra · **Raridade:** rara · **Preço sugerido:** 3.400 Lumes.
- **Papel:** mundos ardentes. Feita para vulcões, oceanos de magma e radiação.
- **No jogo:** ✦ +60 °C de proteção contra o calor · ✦ +60 rad de blindagem contra radiação · ✧ −10% de eficiência de dobra.
- **Clima:** coragem, resistência e sertão.
- **Silhueta:** **angulosa**, como ave de rapina de asas abertas para baixo (cerca de 80% da largura). Corpo central forte, **duas asas largas em ângulo**, quebradas no meio, com placas de **escudo térmico** nas bordas de ataque. Cabine estreita e funda, protegida por uma viseira. Três motores.
- **Detalhes:** placas térmicas com bordas **queimadas e escurecidas** pelo calor (sem mudar a cor de destaque), marcas de chamuscado, dissipadores de calor em aletas.
- **Não pode parecer:** caça militar. Não tem armas, mísseis nem pintura de guerra.
- **Prompt:** `CARCARÁ heat-shielded ship: angular raptor-like silhouette about 80% of the image width, strong central body, two broad wings angled downward with a bend at mid-span, thermal shield plates along the leading edges with heat-darkened scorched rims, finned heat sinks, narrow deep-set turquoise cockpit under a protective visor, three engines, Veyra nomad wear, brave and rugged, absolutely no weapons and no military markings.`

### 5.8 Garça — `garca`
- **Facção:** Liga Thar · **Raridade:** rara · **Preço sugerido:** 3.000 Lumes.
- **Papel:** pântanos e gigantes gasosos. Filtra toxinas e protege o traje.
- **No jogo:** ✦ +25% de filtragem tóxica · ✦ +2 de integridade nas expedições · ✧ −1 espaço no armazém de módulos.
- **Clima:** elegância, calma, precisão.
- **Silhueta:** a **mais alta e estreita no topo**. Uma **torre de cabine alta e fina** (o "pescoço") sobre um corpo esbelto, que se alarga em baixo para **dois estabilizadores longos e finos** que descem como pernas. Motores pequenos nas pontas dos estabilizadores e um central. Largura de cerca de 60%.
- **Detalhes:** **filtros** circulares com grades turquesa no corpo, entradas de ar limpas, linhas técnicas finas da Liga Thar.
- **Não pode parecer:** aranha ou robô de pernas. As "pernas" são estabilizadores com motor.
- **Prompt:** `GARÇA filter ship: tall elegant silhouette, a tall thin cockpit tower like a long neck rising above a slender ivory body, the body widening at the bottom into two long thin stabilisers reaching down with small engines at their tips plus one central engine, about 60% of the image width, round air filters with turquoise grilles set into the hull, clean intakes, fine technical lines, precise Thar science design, calm and graceful, not a spider and not a walking robot.`

### 5.9 Fênix — `fenix`
- **Facção:** nenhuma; aparece com qualquer viajante, muito raramente · **Raridade:** lendária · **Preço sugerido:** 7.500 Lumes.
- **Papel:** a nave de dobra lendária. Atravessa galáxias gastando muito menos.
- **No jogo:** ✦ +40% de eficiência de dobra · ✦ +2 de integridade e +3 de energia nas expedições · ✧ só aparece raramente e custa caro.
- **Clima:** mito, renascimento, a joia da frota.
- **Silhueta:** elegante e **flamejante na forma** (cerca de 85% da largura). Corpo central afilado, **asas varridas para trás em leque** formadas por várias **aletas longas** de cobre, que lembram penas de fogo sem ser penas. Um **anel de dobra** discreto envolve a parte de trás do corpo. Cabine em gota alongada.
- **Detalhes:** nas aletas, filetes de **energia âmbar e violeta** brilhando por dentro (a única exceção de cor da frota), detalhes de cobre polido, acabamento impecável sem desgaste.
- **Não pode parecer:** pássaro de fogo literal, nem nave de vilão. É bela e luminosa.
- **Prompt:** `FÊNIX legendary warp ship: elegant tapered ivory central body about 85% of the image width, swept-back fan-shaped wings made of several long polished copper vanes suggesting flames without being feathers, inner amber and violet energy glowing inside the vanes (cosmic atlas violet), a discreet warp ring encircling the rear of the body, elongated teardrop turquoise cockpit, flawless finish without wear, the jewel of the fleet, luminous and mythical, not a literal firebird.`

---

## 6. Checklist antes de entregar

- [ ] 18 PNGs (9 fechadas e 9 abertas), 1024 × 1536, fundo realmente transparente, nos nomes `<id>.png` e `<id>-open.png` em `assets/src/ships/`.
- [ ] Todas as naves de 2% a 98% da altura, centralizadas, em pé, com a mesma câmera da Andorinha.
- [ ] Cor de destaque em cobre alaranjado em todas; só a Fênix tem o brilho âmbar e violeta extra.
- [ ] Bocais apagados e nenhuma chama, arma, texto ou chão.
- [ ] Nave aberta com o mesmo contorno da fechada e os 8 encaixes vazios dentro das caixas da guia `guia-interior-1024x1536.png`.
- [ ] Posições dos bocais anotadas em `assets/src/ships/naves.json`.
- [ ] Em 120 px, as 10 naves se distinguem só pela silhueta: Andorinha (pera com dois propulsores), Beija-flor (agulha), Albatroz (asas longas e retas), Pelicano (bojuda com porão), Coruja (cúpula e lentes), Martim-pescador (broca), Pinguim (oval atarracada), Carcará (asas angulosas), Garça (torre alta e estabilizadores finos), Fênix (leque de aletas).
- [ ] Prompts finais em `assets/src/ships/prompts.json` e registro no fim de `ARTE.md`.

---

## 7. Revisão pedida (01/11/2026)

As 18 pinturas estão instaladas e funcionando no jogo: as naves fechadas, as abertas com os módulos nos encaixes e as chamas nos bocais anotados. A qualidade está no nível da Andorinha. O que falta é **silhueta**. Na prancha a 120 px, quatro naves parecem a Andorinha (foguete com dois propulsores laterais) e se confundem entre si.

Refaça estas quatro, mantendo materiais, câmera, altura e encaixes. Basta trocar os arquivos em `assets/src/ships/`, atualizar os bocais em `naves.json` e rodar `python3 qa/prepare-ships-art.py`. Nenhum código muda.

| Nave | Como está | O que o briefing pede (seção 5) |
|---|---|---|
| Pinguim | alta e estreita, com propulsores laterais | **oval e atarracada**, barriga larga, duas nadadeiras curtas para baixo, **um** motor central largo e curto, sem propulsores laterais |
| Garça | foguete fino com propulsores | **torre de cabine alta e fina** (pescoço) sobre corpo esbelto, e **dois estabilizadores longos e finos** descendo como pernas, com motores nas pontas |
| Carcará | foguete com aletas laterais | **asas largas e angulosas**, quebradas no meio, abertas para os lados e para baixo, com escudo térmico na borda de ataque; deve ficar entre as naves mais largas (cerca de 80%) |
| Martim-pescador | broca boa, mas o corpo repete a Andorinha | manter a broca e mudar o corpo: **compacto e angular**, com os dois braços de coleta dobrados bem visíveis e **dois** motores médios |

**Aceitas como estão:** Pelicano com cinco bocais (lê bem como cargueira) e Albatroz com as asas em diagonal (lê como asa planadora). Beija-flor, Coruja e Fênix estão ótimas.

**Teste de aceite:** em silhueta preta a 120 px, as 10 naves precisam se distinguir sem legenda (seção 6).
