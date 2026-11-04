"""Derive display-sized art from the painted source atlases.

The game used to embed full-size atlases and then, at runtime, crop the story and
room scenes with canvas.toDataURL (a synchronous WebP encode on the main thread)
and show 1254 px icon sheets at 26-84 CSS px. This script does that work once:

- story-scene-0..3: the four 2x2 cells of campaign-atlas.png, at the same 627 px
  the runtime crop produced;
- room-0..5: the six 2x3 cells of rooms-atlas, at the same 576x256 the runtime
  crop produced;
- *-ui sheets for control icons, purpose symbols and Lume coins, with cells of
  192 px (3x the largest 64 px display, 2.3x the 84 px evacuation card).

Run from orbit-explorer/:  python3 qa/prepare-ui-art.py
"""
from pathlib import Path
from PIL import Image

base = Path(__file__).resolve().parent.parent
assets = base / 'assets'
LANCZOS = Image.Resampling.LANCZOS


def save(image, name, quality):
    path = assets / name
    image.save(path, 'WEBP', quality=quality, method=6)
    print(f'{name:34s} {image.size[0]}x{image.size[1]} {path.stat().st_size // 1024} KB')


def cells(source, cols, rows, size, prefix, quality):
    width, height = source.size
    for index in range(cols * rows):
        x, y = index % cols, index // cols
        box = (round(x * width / cols), round(y * height / rows), round((x + 1) * width / cols), round((y + 1) * height / rows))
        tile = source.crop(box)
        if tile.size != size:
            tile = tile.resize(size, LANCZOS)
        save(tile, f'{prefix}-{index}.webp', quality)


def sheet(name, cols, rows, cell, out, quality=90):
    image = Image.open(assets / name).convert('RGBA')
    resized = image.resize((cols * cell, rows * cell), LANCZOS)
    save(resized, out, quality)


campaign = Image.open(assets / 'campaign-atlas.png').convert('RGB')
cells(campaign, 2, 2, (627, 627), 'story-scene', 86)

rooms = Image.open(assets / 'rooms-atlas.png').convert('RGB')
cells(rooms, 2, 3, (576, 256), 'room', 86)

sheet('flight-controls-v1.webp', 4, 4, 192, 'flight-controls-ui.webp')
sheet('utility-controls-v1.webp', 4, 4, 192, 'utility-controls-ui.webp')
sheet('purpose-painted-v1.png', 3, 5, 192, 'purpose-ui.webp')
sheet('lume-currency-v1.png', 3, 1, 192, 'lume-ui.webp')
