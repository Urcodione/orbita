# Xenobiologia: arte a gerar

> **Atualização:** o briefing completo, item a item (o que é, o que faz, clima, silhueta, prompt), e o fluxo de entrega estão em `BRIEFING-ARTE-CODEX.md`. Ele substitui os prompts abaixo; a montagem dos atlas é feita por `qa/prepare-xeno-yard-art.py`.

O jogo já funciona sem esta arte: as ferramentas usam ilustrações vetoriais provisórias (`xeno-tools-art.js`) e os exemplares usam o atlas de biologia com variação de cor. Quando os arquivos abaixo existirem em `assets/`, o `build.py` os incorpora automaticamente e a interface e as cinemáticas passam a usá-los, sem outra mudança de código.

- `xeno-tools.webp`: ferramentas, 2 colunas × 3 linhas, nesta ordem: garra, rede, casulo, laço, crio, térmico.
- `xeno-specimens.webp`: exemplares, 4 colunas × 4 linhas, na ordem de `SPECIMENS` em `xenobiology.js`.

Gere-as com a mesma ferramenta de imagens usada na família visual (`ARTE.md`), com a Andorinha e o `modules-atlas.png` como referência de materiais e luz. Converta para WebP (qualidade 86, alfa preservado) e, se quiser a prévia compacta, crie também `-inline.webp` com metade do tamanho.

## Prompt: ferramentas de captura (`xeno-tools.png`, 1024×1536)

Use case: stylized-concept. Production game sprite atlas of EXACTLY SIX separate capture-tool illustrations on a truly transparent alpha background, TWO columns THREE rows, equal cells, generous transparent gutters, each item centered occupying ~70% of its cell. Match the referenced Andorinha and module atlas: premium hand-painted dimensional illustration, ivory ceramic, brushed copper, dark teal metal, turquoise glass, warm upper-left key light, cool teal shadows, same slight front three-quarter camera. Order row by row: (1) GARRA DE CONTENÇÃO: articulated ivory-and-copper three-talon containment claw on a short telescopic arm, cyan joint lamp; (2) REDE DE PLASMA: circular copper launcher ring holding a folded hexagonal net of glowing cyan plasma filaments; (3) CASULO SELADO: upright transparent glass cocoon with copper bands and ivory caps, faint toxic green mist sealed inside; (4) LAÇO GRAVITACIONAL: compact copper handheld emitter projecting a luminous violet gravitational loop; (5) CÁPSULA CRIOGÊNICA: rounded ivory cryo canister with frosted ice-blue window, copper rings, cold vapour; (6) COLETOR TÉRMICO: copper bell-shaped heat-insulating collector with ivory fins and a glowing orange core. No text, no labels, no frame, no background, no ship, no hands. Each tool distinct in silhouette and readable at 48 px.

## Prompt: exemplares únicos (`xeno-specimens.png`, 1536×1536)

Use case: stylized-concept. Production sprite atlas of EXACTLY SIXTEEN unique alien creatures and plants, FOUR columns FOUR rows, equal cells, transparent alpha background, generous gutters, each subject centered ~75% of its cell, matching the referenced biology atlas style (premium hand-painted animated-film concept art, luminous bioluminescent accents, warm upper-left light, cool rim light). Each must look one-of-a-kind and majestic. Order row by row:
1. Raposa-aurora: slender fox with aurora-coloured violet and teal fur ribbons, star-like eyes.
2. Salamandra de brasa: salamander with obsidian skin and glowing lava veins, ember frills.
3. Urso-geada: huge white bear with crystal-ice shoulder plates and a frosted breath bubble.
4. Mariposa de cristal: moth with refractive prism-glass wings, nearly invisible edges.
5. Escaravelho-ferro: heavy beetle with iron-copper carapace, sand falling off.
6. Leviatã de vidro: enormous translucent jellyfish with singing glowing filaments.
7. Lesma ácida: luminous lime slug leaving a clean shining trail.
8. Arraia-tempestade: sky manta with storm-cloud patterned wings and lightning edges.
9. Samambaia-mãe: ancient giant fern, curled fronds, glowing ember spores.
10. Orquídea eterna: ice-blue orchid with frozen crystalline petals.
11. Flor do vazio: dark violet flower whose petals bend light like a lens.
12. Lírio solar: golden lily radiating stored sunlight.
13. Cacto de magma: basalt cactus pulsing with molten core.
14. Alga nebular: floating cloud-forest kelp with drifting tendrils.
15. Coral cantor: pink-teal coral with sound-ring patterns.
16. Trepadeira prisma: violet thorned vine wrapped around growing crystals.
No text, no labels, no grid lines, no backgrounds.
