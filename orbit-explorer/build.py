"""Build the offline game (index.html), also packaged by the Android app."""
from pathlib import Path
import json
import base64

base = Path(__file__).resolve().parent
css = '\n'.join((base / name).read_text(encoding='utf-8') for name in ('styles.css', 'workshop.css', 'navigation.css', 'catalog.css', 'illustrated-scenes.css', 'commerce.css', 'campaign-ui.css', 'tutorial.css', 'journey.css', 'xenobiology.css', 'ships.css', 'civilizations.css'))
shell = (base / 'shell.html').read_text(encoding='utf-8')
bootstrap = base64.b64encode((base / 'assets/cruise-bootstrap.webp').read_bytes()).decode('ascii')
css += '\n#orbit-game{background:#10223b url("data:image/webp;base64,' + bootstrap + '") center/cover no-repeat}'

scripts = '\n'.join((base / name).read_text(encoding='utf-8') for name in ('engine.js', 'economy.js', 'campaign.js', 'campaign-events.js', 'campaign-guidance.js', 'commerce-ui.js', 'scene.js', 'illustrated-scenes.js', 'expedition-scene.js', 'workshop-ui.js', 'catalog-ui.js', 'panel-pager.js', 'campaign-ui.js', 'tutorial.js', 'control-icons.js', 'journey-ui.js', 'storage.js', 'voyage.js', 'xenobiology.js', 'ships.js', 'civilizations.js', 'explorer-record.js', 'audio.js', 'voyage-services.js', 'voyage-ui.js', 'extraction-ui.js', 'xeno-tools-art.js', 'xenobiology-ui.js', 'xeno-cinematics.js', 'ships-ui.js', 'civilizations-ui.js', 'arrival-cinema.js', 'feedback-ui.js', 'ui.js'))
art_files = {'arrival-dock':'arrival-dock','arrival-harvest':'arrival-harvest','alien-post':'alien-post','civilizations':'civilizations-atlas','ship':'andorinha-illustrated','interior':'andorinha-open','modules':'modules-atlas','worlds':'worlds-atlas','galaxies':'galaxies-atlas','phenomena':'phenomena-atlas','stars':'stars-atlas','commerce':'commerce-atlas','biology':'biology-atlas','cosmic':'cosmic-atlas','relics':'relics-atlas','purpose':'purpose-ui','lume':'lume-ui','warpCell':'warp-cell-v1','cruise':'cruise-painted-v1','fieldSprites':'expedition-sprites-v1','fieldTerrain':'expedition-terrain-v1','flightControls':'flight-controls-ui','utilityControls':'utility-controls-ui'}
# Story and room scenes are cut ahead of time by qa/prepare-ui-art.py (no runtime canvas crop/encode); icon, coin and
# purpose sheets come at display size instead of 1254-2172 px sources.
art_files.update({'story%d' % i: 'story-scene-%d' % i for i in range(4)})
art_files.update({'room%d' % i: 'room-%d' % i for i in range(6)})
# Optional art: embedded only when the asset exists (see assets/XENO-ARTE.md).
for key, name in {'landscapes': 'cine-landscapes', 'xenoTools': 'xeno-tools', 'xenoSpecimens': 'xeno-specimens'}.items():
    if (base / ('assets/' + name + '.webp')).exists():
        art_files[key] = name
# Fleet: every ready-made ship has a closed and an open painting (qa/prepare-ships-art.py), keyed hull-<id> / open-<id>.
for path in sorted((base / 'assets').glob('ship-*.webp')):
    name = path.stem
    ship = name[len('ship-'):]
    art_files[('open-' + ship[:-len('-open')]) if ship.endswith('-open') else ('hull-' + ship)] = name
def art_script():
    payload = {}
    for key, name in art_files.items():
        path = base / ('assets/' + name + '.webp')
        payload[key] = 'data:image/webp;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
    return 'window.OrbitIllustrations=' + json.dumps(payload) + ';\n'
scripts = art_script() + scripts
fragment = '<style>\n' + css + '\n</style>\n' + shell + '\n<script>\n' + scripts.replace('</script', '<\\/script') + '\n</script>\n'
document = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="theme-color" content="#09141e">\n<meta name="description" content="Órbita: um jogo de exploração espacial, nave modular e descobertas procedurais.">\n<title>Órbita — Fronteiras desconhecidas</title>\n<style>html{background:#040c13}body{margin:0;padding:0;min-width:320px;box-sizing:border-box;height:100dvh;overflow:hidden}@media(max-width:670px){body{padding:0}}</style>\n</head>\n<body>\n' + fragment + '\n</body>\n</html>\n'
(base / 'index.html').write_text(document, encoding='utf-8')
print(f'Offline game: {base / "index.html"} ({len(document.encode())} bytes)')
