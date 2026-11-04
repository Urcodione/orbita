"""Derive the in-game ship paintings from the sources in assets/src/ships/.

For each ship in assets/src/ships/naves.json: <id>.png (closed hull) and <id>-open.png (hull open on the 8 sockets),
1024x1536 RGBA, become assets/ship-<id>.webp and assets/ship-<id>-open.webp at the Andorinha's display size (512x768).
build.py embeds them as hull-<id> and open-<id>.
It also copies each ship's nozzle positions from naves.json into ships.js, where the game reads them for the flames.

Run from orbit-explorer/:  python3 qa/prepare-ships-art.py
"""
import json
import re
from pathlib import Path
from PIL import Image

base = Path(__file__).resolve().parent.parent
src, assets = base / 'assets' / 'src' / 'ships', base / 'assets'
LANCZOS = Image.Resampling.LANCZOS

for ship in json.loads((src / 'naves.json').read_text(encoding='utf-8')):
    for suffix in ('', '-open'):
        image = Image.open(src / f"{ship['id']}{suffix}.png").convert('RGBA')
        assert image.size == (1024, 1536), (ship['id'], suffix, image.size)
        path = assets / f"ship-{ship['id']}{suffix}.webp"
        image.resize((512, 768), LANCZOS).save(path, 'WEBP', quality=88, method=6)
        print(f'{path.name:36s} {path.stat().st_size // 1024} KB')

# Nozzles: [x %, y %, 1 for a main engine / 0 for a side one], written into the ship's entry in ships.js.
code_path = base / 'ships.js'
code = code_path.read_text(encoding='utf-8')
for ship in json.loads((src / 'naves.json').read_text(encoding='utf-8')):
    nozzles = '[' + ','.join(f"[{round(n['x'], 1)},{round(n['y'], 1)},{1 if n['tipo'] == 'principal' else 0}]" for n in ship['bocais']) + ']'
    pattern = re.compile(r"(\{id:'" + re.escape(ship['id']) + r"'.*?nozzles:)\[\[.*?\]\](\})", re.S)
    code, count = pattern.subn(lambda m: m.group(1) + nozzles + m.group(2), code, count=1)
    assert count == 1, ship['id']
code_path.write_text(code, encoding='utf-8')
print('ships.js nozzles synced from naves.json')
