#!/usr/bin/env python3
"""Download identifiable school-building photography without images of students."""
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance
import urllib.request, json, hashlib

sources={
  "pps-campus-1.jpg":[
    "https://www.khda.gov.ae/SchoolImage/135L.jpg",
    "https://dubaischools.com/storage/institutions/philadelphia-private-school/media/BANNR.jpg",
    "https://www.citysearch.ae/UF/Companies/1648/philadelphia-private-school-dubai.jpg",
  ],
  "pps-campus-2.jpg":[
    "https://dubaischools.com/storage/institutions/philadelphia-private-school/media/BANNR.jpg",
    "https://www.citysearch.ae/UF/Companies/1648/philadelphia-private-school-dubai.jpg",
    "https://www.khda.gov.ae/SchoolImage/135L.jpg",
  ]
}
Path("public").mkdir(exist_ok=True)
Path("out").mkdir(exist_ok=True)
manifest={}
for filename,urls in sources.items():
    for url in urls:
        try:
            req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; school-video-demo/1.0)","Accept":"image/*"})
            with urllib.request.urlopen(req,timeout=25) as response:
                content=response.read()
            if len(content)<10000:
                raise ValueError("unexpectedly small image")
            image=Image.open(BytesIO(content)).convert("RGB")
            if min(image.size)<450:
                raise ValueError(f"low resolution image: {image.size}")
            image=ImageOps.exif_transpose(image)
            image=ImageEnhance.Contrast(image).enhance(1.05)
            # output a self-contained, standard JPEG compatible with Chromium
            image.save("public/"+filename,"JPEG",quality=93,optimize=True)
            manifest[filename]={"source":url,"width":image.width,"height":image.height,
                "sha256":hashlib.sha256(content).hexdigest()}
            print(filename,"OK",image.size,url,flush=True)
            break
        except Exception as error:
            print(filename,"source not usable:",url,repr(error),flush=True)
    else:
        raise RuntimeError("Could not download authentic PPS campus photo: "+filename)
Path("out/pps-photo-sources.json").write_text(json.dumps(manifest,indent=2)+"\n")
print("All campus images available")
