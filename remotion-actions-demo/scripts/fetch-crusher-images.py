#!/usr/bin/env python3
"""Fetch authentic product photography (with fallbacks) for a one-off promotional test render.

Product image rights remain with their respective owners. No asset redistribution or sale.
"""
from __future__ import annotations
from io import BytesIO
from pathlib import Path
import json
import urllib.request
from PIL import Image, ImageChops

DEST = Path("public")
DEST.mkdir(parents=True, exist_ok=True)

SOURCES = {
    "headphones-main": [
        "https://www.jbhifi.co.nz/cdn/shop/files/397764-Product-0-I-638917012405899107.jpg?v=1756110316",
        "https://f.nooncdn.com/p/pzsku/Z5F16C4AF6BFDFE130FF7Z/45/_/1778748091/215f1bab-e0d6-4b64-9dc8-5ca614dd9628.jpg",
        "https://cdn11.bigcommerce.com/s-3du79fd4vr/images/stencil/500x659/products/594/3239/428806-Product-0-I-638282224351667681_bde7f3c4-9da0-4c64-95fd-dc756516bd24__18129.1721690893.jpg?c=1",
    ],
    "headphones-angle": [
        "https://cdn11.bigcommerce.com/s-3du79fd4vr/images/stencil/500x659/products/594/3239/428806-Product-0-I-638282224351667681_bde7f3c4-9da0-4c64-95fd-dc756516bd24__18129.1721690893.jpg?c=1",
        "https://f.nooncdn.com/p/pzsku/Z5F16C4AF6BFDFE130FF7Z/45/_/1778748091/06faf5ba-9e8f-406c-a5c6-0b3da41ed2fb.jpg",
        "https://www.jbhifi.co.nz/cdn/shop/files/397764-Product-0-I-638917012405899107.jpg?v=1756110316",
    ],
    "headphones-lifestyle": [
        "https://www.skullcandy.com/cdn/shop/files/CrusherEvo_TrueBlack_5_91fe1cb1-fc1b-40fa-949f-5ddcd4991196.jpg?v=1768942094&width=1946",
        "https://brain-images-ssl.cdn.dixons.com/3/4/10213343/l_10213343_008.jpg",
        "https://www.techstop.com/storage/inventories/BqteYIKngOZyAZ2CUKuqoS4ijY9cZKdb1i6T5Qj4.jpg",
    ],
}

def download(links):
    for url in links:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "image/avif,image/webp,image/*,*/*;q=0.8"})
            with urllib.request.urlopen(req, timeout=20) as response:
                content = response.read()
            if len(content) < 6000:
                raise ValueError("Image too small")
            im = Image.open(BytesIO(content))
            im.load()
            if im.width < 300 or im.height < 300:
                raise ValueError(f"Image resolution too small: {im.size}")
            print("Image OK:", url, im.size, flush=True)
            return im.convert("RGB"), url
        except Exception as exc:
            print("Image source failed:", url, repr(exc), flush=True)
    raise RuntimeError("All photo sources failed. Cannot substitute an unrelated product.")

def knockout(im: Image.Image):
    # Use only for catalog product shots with near-white corners.
    corners = [im.getpixel((1,1)), im.getpixel((im.width-2, 1)), im.getpixel((1, im.height-2)), im.getpixel((im.width-2,im.height-2))]
    avg = sum(sum(c) / 3 for c in corners) / 4
    if avg < 232:
        raise ValueError("Catalog image must have a light background for alpha knockout")
    im = im.convert("RGBA")
    pix = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = pix[x, y]
            v = min(r, g, b)
            # preserve dark product, remove neutral white/very light background
            a = max(0, min(255, int((245 - v) * 255 / 42)))
            if max(r, g, b) - min(r, g, b) > 23:
                a = max(a, 235)
            pix[x, y] = (r, g, b, a)
    bounds = im.getchannel("A").getbbox()
    if not bounds:
        raise RuntimeError("Image transparency filter removed entire product")
    crop = im.crop(bounds)
    box = Image.new("RGBA", (1200,1200), (0,0,0,0))
    crop.thumbnail((1120,1100), Image.Resampling.LANCZOS)
    box.alpha_composite(crop, ((1200-crop.width)//2,(1200-crop.height)//2))
    return box

result = {}
for name, links in SOURCES.items():
    if name.endswith("lifestyle"):
        im, url = download(links)
        if im.width > 1600:
            im.thumbnail((1600,1600))
        im.save(DEST / f"{name}.png")
    else:
        for link_pos in range(len(links)):
            try:
                im, url = download([links[link_pos]])
                im = knockout(im)
                im.save(DEST / f"{name}.png")
                break
            except Exception as exc:
                print("Not suitable for cutout:", links[link_pos], repr(exc), flush=True)
        else:
            raise RuntimeError(f"No suitable catalog image for {name}")
    result[name] = {"url": url, "dimensions": list(im.size)}
Path("out").mkdir(exist_ok=True)
Path("out/crusher-asset-sources.json").write_text(json.dumps(result, indent=2) + "\n")
print("All authentic product images prepared", flush=True)
