# PPS Dubai promotional video — 20-second vertical Reels/Shorts format

An original 1080x1920 Remotion motion-graphics video using the school name, school-building photography, and verified facts from [the PPS Dubai website](https://ppsdubai.org/).

Story:
1. Welcome: **LEARN. GROW. BELONG.** with authentic school exterior
2. School philosophy: every learner matters
3. Academic options: American curriculum and IB Diploma Programme, Pre-KG–Grade 12
4. Facilities: science laboratories, connected classrooms, sports & activities
5. PACER values (Perseverance, Agility, Clarity, Empathy, Respect)
6. Call to action: **Discover PPS Dubai — ppsdubai.org** / explore admissions

### Workflow
The workflow `.github/workflows/pps-dubai-promo.yml` installs Remotion and downloads genuine campus photography, synthesizes its own non-copyrighted instrumental WAV, renders the MP4 using Remotion, validates H.264 1080x1920 30 FPS/20 seconds and AAC audio, and uploads an artifact with video plus JSON validation/provenance records.

Local setup:
```sh
npm install
python -m pip install Pillow
npm run assets:pps
npm run audio:pps
npx remotion browser ensure
npm run render:pps
npm run verify:pps
```

### Footage / privacy notes
Only exterior-building images were used; no student photographs or personal data. The visual PPS monogram in the animation is custom typography, not a representation of the school's official trademark logo. Before public publishing, check rights to external photographs from KHDA/DubaiSchools and replace with school-owned media if needed.

School facts are taken from [About PPS](https://ppsdubai.org/about-pps-dubai/), [Facilities](https://ppsdubai.org/school-facilities/), and [Admissions](https://ppsdubai.org/admissions/).
