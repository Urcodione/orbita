"""Build the offline game and the in-conversation playable preview."""
from pathlib import Path
import argparse
import json
import base64
import subprocess
import os

base = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--preview', type=Path)
parser.add_argument('--thread-reference', action='store_true', help='Use the desktop reader\'s filename lookup for a preview in the current thread visualization directory.')
args = parser.parse_args()
css = '\n'.join((base / name).read_text(encoding='utf-8') for name in ('styles.css', 'workshop.css', 'navigation.css', 'catalog.css', 'illustrated-scenes.css', 'commerce.css', 'campaign-ui.css', 'tutorial.css', 'journey.css', 'xenobiology.css'))
shell = (base / 'shell.html').read_text(encoding='utf-8')
bootstrap = base64.b64encode((base / 'assets/cruise-bootstrap.webp').read_bytes()).decode('ascii')
css += '\n#orbit-game{background:#10223b url("data:image/webp;base64,' + bootstrap + '") center/cover no-repeat}'

scripts = '\n'.join((base / name).read_text(encoding='utf-8') for name in ('engine.js', 'economy.js', 'campaign.js', 'campaign-events.js', 'campaign-guidance.js', 'commerce-ui.js', 'scene.js', 'illustrated-scenes.js', 'expedition-scene.js', 'workshop-ui.js', 'catalog-ui.js', 'panel-pager.js', 'campaign-ui.js', 'tutorial.js', 'control-icons.js', 'journey-ui.js', 'storage.js', 'voyage.js', 'xenobiology.js', 'audio.js', 'voyage-services.js', 'voyage-ui.js', 'extraction-ui.js', 'xenobiology-ui.js', 'ui.js'))
art_files = {'ship':'andorinha-illustrated','interior':'andorinha-open','modules':'modules-atlas','worlds':'worlds-atlas','galaxies':'galaxies-atlas','phenomena':'phenomena-atlas','stars':'stars-atlas','commerce':'commerce-atlas','biology':'biology-atlas','cosmic':'cosmic-atlas','relics':'relics-atlas','purpose':'purpose-ui','lume':'lume-ui','warpCell':'warp-cell-v1','cruise':'cruise-painted-v1','fieldSprites':'expedition-sprites-v1','fieldTerrain':'expedition-terrain-v1','flightControls':'flight-controls-ui','utilityControls':'utility-controls-ui'}
# Story and room scenes are cut ahead of time by qa/prepare-ui-art.py (no runtime canvas crop/encode); icon, coin and
# purpose sheets come at display size instead of 1254-2172 px sources.
art_files.update({'story%d' % i: 'story-scene-%d' % i for i in range(4)})
art_files.update({'room%d' % i: 'room-%d' % i for i in range(6)})
def art_script(compact=False):
    payload = {}
    for key, name in art_files.items():
        compact_path = base / ('assets/' + name + '-inline.webp')
        path = compact_path if compact and compact_path.exists() else base / ('assets/' + name + '.webp')
        payload[key] = ('data:image/png;base64,' if path.suffix == '.png' else 'data:image/webp;base64,') + base64.b64encode(path.read_bytes()).decode('ascii')
    if compact:
        # Share the repeated embedded color-profile text, without changing any
        # decoded image bytes, dimensions, transparency or color information.
        shared = os.path.commonprefix([value.split(',', 1)[1][52:656] for value in payload.values()])
        if len(shared) >= 200 and all(shared in value for value in payload.values()):
            entries = []
            for key, value in payload.items():
                before, after = value.split(shared, 1)
                entries.append(json.dumps(key) + ':' + json.dumps(before) + '+p+' + json.dumps(after))
            return '(()=>{const p=' + json.dumps(shared) + ';window.OrbitArtDataUrls=true;window.OrbitIllustrations={' + ','.join(entries) + '};})();\n'
    return ('window.OrbitArtDataUrls=true;' if compact else '') + 'window.OrbitIllustrations=' + json.dumps(payload) + ';\n'
raw_scripts = scripts
scripts = art_script() + raw_scripts
fragment = '<style>\n' + css + '\n</style>\n' + shell + '\n<script>\n' + scripts.replace('</script', '<\\/script') + '\n</script>\n'
document = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="theme-color" content="#09141e">\n<meta name="description" content="Órbita: um jogo de exploração espacial, nave modular e descobertas procedurais.">\n<title>Órbita — Fronteiras desconhecidas</title>\n<style>html{background:#040c13}body{margin:0;padding:0;min-width:320px;box-sizing:border-box;height:100dvh;overflow:hidden}@media(max-width:670px){body{padding:0}}</style>\n</head>\n<body>\n' + fragment + '\n</body>\n</html>\n'
(base / 'index.html').write_text(document, encoding='utf-8')
if args.preview:
    # Keep all illustrations and gameplay in the compact offline preview.
    # No eval, dynamic imports or network dependencies are introduced.
    minifier = "const fs=require('fs');require('terser').minify(fs.readFileSync(0,'utf8'),{compress:{passes:2},mangle:true}).then(r=>process.stdout.write(r.code)).catch(e=>{console.error(e);process.exit(1)})"
    compact_scripts = subprocess.run(['node', '-e', minifier], input=raw_scripts, text=True, capture_output=True, check=True).stdout
    css_minifier = "const fs=require('fs'),CSS=require('./qa/node_modules/clean-css'),r=new CSS({level:1}).minify(fs.readFileSync(0,'utf8'));if(r.errors.length)throw Error(r.errors.join('\\n'));process.stdout.write(r.styles)"
    compact_css = subprocess.run(['node', '-e', css_minifier], cwd=base, input=css, text=True, capture_output=True, check=True).stdout
    preview_scripts = art_script(True) + compact_scripts
    fragment = '<style>\n' + compact_css + '\n</style>\n' + shell + '\n<script>\n' + preview_scripts.replace('</script', '<\\/script') + '\n</script>\n'
    if len(fragment.encode()) >= 1_000_000:
        raise ValueError(f'Inline preview exceeds 1 MB: {len(fragment.encode())} bytes')
    args.preview.parent.mkdir(parents=True, exist_ok=True)
    args.preview.write_text(fragment, encoding='utf-8')
    print(f'Playable preview: {args.preview} ({len(fragment.encode())} bytes)')
    # Absolute paths use executor semantics. The desktop also supports resolving
    # a bare filename inside its own current-thread visualization directory;
    # this avoids a failing absolute-path validation across Windows and WSL.
    reference_path = args.preview.name if args.thread_reference else str(args.preview.resolve())
    print('Inline reference: ' + json.dumps({'path': reference_path}, ensure_ascii=False))
print(f'Offline game: {base / "index.html"} ({len(document.encode())} bytes)')
