"""Derive the in-game ship paintings from the sources in assets/src/ships/.

For each ship in assets/src/ships/naves.json: <id>.png (closed hull) and <id>-open.png (hull open on the 8 sockets),
1024x1536 RGBA, become assets/ship-<id>.webp and assets/ship-<id>-open.webp at the Andorinha's display size (512x768),
plus -inline versions for the compact preview (427x640). build.py embeds them as hull-<id> and open-<id>.

Run from orbit-explorer/:  python3 qa/prepare-ships-art.py
"""
import json
from pathlib import Path
from PIL import Image

base = Path(__file__).resolve().parent.parent
src, assets = base / 'assets' / 'src' / 'ships', base / 'assets'
LANCZOS = Image.Resampling.LANCZOS

for ship in json.loads((src / 'naves.json').read_text(encoding='utf-8')):
    for suffix in ('', '-open'):
        image = Image.open(src / f"{ship['id']}{suffix}.png").convert('RGBA')
        assert image.size == (1024, 1536), (ship['id'], suffix, image.size)
        for tag, size, quality in (('', (512, 768), 88), ('-inline', (427, 640), 82)):
            path = assets / f"ship-{ship['id']}{suffix}{tag}.webp"
            image.resize(size, LANCZOS).save(path, 'WEBP', quality=quality, method=6)
            print(f'{path.name:36s} {path.stat().st_size // 1024} KB')
