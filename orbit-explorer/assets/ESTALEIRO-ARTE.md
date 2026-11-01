# Estaleiro estelar: arte das peças a gerar

O jogo já funciona sem esta arte: as peças usam ilustrações vetoriais provisórias (`shipyard-ui.js`), tanto no painel quanto na própria nave. Quando `assets/yard-parts.webp` existir, o `build.py` incorpora a imagem automaticamente, e a planta, o hangar, a loja e a nave da tela principal passam a usá-la, sem outra mudança de código.

## Arquivo e grade

- **Arquivo:** `yard-parts.png`, quadrado, 1536×1152. Converta para `yard-parts.webp` (qualidade 86, alfa preservado) e, opcionalmente, para `yard-parts-inline.webp` com metade do tamanho, para a prévia compacta.
- **Grade:** 4 colunas × 3 linhas, células iguais, na ordem de `PARTS` em `shipyard.js`, que é a ordem dos prompts abaixo.
- **Uso no jogo:** a mesma célula aparece no painel em 44 px e montada no casco em 30 a 60 px. A silhueta precisa ser legível pequena, e a peça não pode ter fundo.

## Prompt (gerar com a ferramenta de imagens usada em `ARTE.md`, com a Andorinha e o `modules-atlas.png` como referência)

Use case: stylized-concept. Production game sprite atlas of EXACTLY TWELVE separate EXTERNAL HULL PARTS for the referenced Andorinha retrofuturist rocket, on a truly transparent alpha background. FOUR columns, THREE rows, equal cells, generous transparent gutters, each part centered in its cell and occupying ~72% of the cell, no part touching another. Match the reference exactly in materials and lighting: premium hand-painted dimensional animated-film concept art, ivory ceramic panels, brushed copper and orange-copper trims, dark teal metal joints, turquoise glass, tiny warm navigation lamps, warm upper-left key light, cool teal shadows, same slight front three-quarter camera so the parts can be attached to the rocket's front view. Parts must read as bolt-on modules for the SAME ship.

Order row by row:
1. TANQUE EXTERNO: tall ivory capsule fuel tank with two copper straps and a small turquoise gauge window (vertical, 1×2 proportion).
2. RESERVATÓRIO DE O₂: compact round ivory oxygen sphere with a copper equator band and a teal valve (1×1).
3. PLACAS DE CASCO: shield-shaped ivory armour plate with riveted copper rim and subtle wear (1×1).
4. VELA SOLAR: wide pair of deep blue solar panels with copper frames on a small ivory hinge (horizontal, 2×1).
5. QUILHA ESTABILIZADORA: tall swept ivory fin with copper spine and a tiny teal lamp (vertical, 1×2).
6. NACELA AUXILIAR: slim copper auxiliary booster nacelle with dark teal bell nozzle and a faint warm glow (vertical, 1×2).
7. BAIA DE DRONES: ivory hangar box with an open hatch showing two tiny teal survey drones (2×2).
8. REATOR COMPACTO: rounded ivory reactor pod with a glowing amber core behind a copper ring (1×1).
9. ANTENA DE LONGO ALCANCE: small ivory parabolic dish on a copper mast with a teal emitter tip (1×1).
10. MATRIZ DE SENSORES: horizontal ivory sensor bar with three turquoise glass eyes (2×1).
11. DEFLETOR DE CAMPO: curved emitter arc projecting a translucent turquoise energy shield (2×1).
12. CONTÊINER ORBITAL: sturdy copper-banded cargo container with an ivory label plate (2×2).

No text, no letters, no labels, no grid lines, no background, no complete ship, no hands. Each part distinct in silhouette.
