"""Build the xenobiology atlases the game reads, from the painted sources.

Sources (either form works, per set):
  - one full atlas PNG:        assets/src/xeno-tools.png, assets/src/xeno-specimens.png
  - or one PNG per item:       assets/src/xeno-tools/<id>.png, assets/src/xeno-specimens/<id>.png
    (any square-ish size; the subject centered with transparent margins, see assets/BRIEFING-ARTE-CODEX.md)

Outputs (in assets/, picked up automatically by build.py):
  xeno-tools.webp 1024x1536 (2x3, 512 cells)
  xeno-specimens.webp 1536x1536 (4x4, 384 cells)

Run from orbit-explorer/:  python3 qa/prepare-xeno-art.py
"""
from pathlib import Path
from PIL import Image

base = Path(__file__).resolve().parent.parent
assets, src = base / 'assets', base / 'assets' / 'src'
LANCZOS = Image.Resampling.LANCZOS

SETS = {
    'xeno-tools': (2, 3, 512, ['garra', 'rede', 'casulo', 'laco', 'crio', 'termico']),
    'xeno-specimens': (4, 4, 384, ['raposa-aurora', 'salamandra-brasa', 'urso-geada', 'mariposa-cristal',
                                   'escaravelho-ferro', 'leviata-vidro', 'lesma-acida', 'arraia-tempestade',
                                   'samambaia-mae', 'orquidea-eterna', 'flor-vazio', 'lirio-solar',
                                   'cacto-magma', 'alga-nebular', 'coral-cantor', 'trepadeira-prisma']),
}


def fit(image, cell):
    """Scale a single item into a square cell keeping its aspect ratio, centered, transparent around it."""
    image = image.convert('RGBA')
    scale = min(cell / image.width, cell / image.height)
    image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), LANCZOS)
    out = Image.new('RGBA', (cell, cell), (0, 0, 0, 0))
    out.alpha_composite(image, ((cell - image.width) // 2, (cell - image.height) // 2))
    return out


def build(name, cols, rows, cell, ids):
    whole, folder = src / (name + '.png'), src / name
    if whole.exists():
        sheet = Image.open(whole).convert('RGBA').resize((cols * cell, rows * cell), LANCZOS)
    elif folder.is_dir():
        missing = [i for i in ids if not (folder / (i + '.png')).exists()]
        if missing:
            print(f'{name}: skipped, missing {", ".join(missing)}')
            return
        sheet = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0))
        for index, item in enumerate(ids):
            sheet.alpha_composite(fit(Image.open(folder / (item + '.png')), cell), ((index % cols) * cell, (index // cols) * cell))
    else:
        print(f'{name}: no source yet')
        return
    path = assets / f'{name}.webp'
    sheet.save(path, 'WEBP', quality=86, method=6)
    print(f'{path.name:30s} {sheet.size[0]}x{sheet.size[1]} {path.stat().st_size // 1024} KB')


for set_name, spec in SETS.items():
    build(set_name, *spec)
