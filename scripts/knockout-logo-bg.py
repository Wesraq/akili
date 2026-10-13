from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / "src" / "assets"
source = assets / "logo-akili-source.png"
out_light = assets / "logo-akili.png"
out_dark = assets / "logo-akili-on-dark.png"


def knock_black(path: Path, thresh: int = 28) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    pixels = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Near-black background -> transparent; keep cyan mark
            if r <= thresh and g <= thresh and b <= thresh:
                pixels[x, y] = (0, 0, 0, 0)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    pad = 12
    padded = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    padded.paste(im, (pad, pad), im)
    side = max(padded.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - padded.width) // 2
    oy = (side - padded.height) // 2
    square.paste(padded, (ox, oy), padded)
    return square


# Prefer the freshly provided source; fall back to previous on-dark asset
src = source if source.exists() else assets / "logo-akili-on-dark.png"
clear = knock_black(src)
clear.save(out_light, optimize=True)
clear.save(out_dark, optimize=True)
print("wrote", out_light, clear.size, out_light.stat().st_size)
print("wrote", out_dark, clear.size, out_dark.stat().st_size)
