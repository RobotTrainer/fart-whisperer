# Ornament Workflow — you click, I drive

*Written 2026-07-29. Companion to `9 - Projects/Typography & Fonts/Ornament — House Style & Master Prompt.md`.*

The whole point of this document: **your total click count is about three.** Everything
else runs in tooling I already have standing up.

---

## What each machine can do

I checked both before designing this.

**Your machine** has `pdftoppm`, `pdfimages`, ImageMagick `convert`, Python 3 and Pillow.
So a large source PDF can stay on your disk and be sliced there — it never has to cross
the bridge.

**The cloud sandbox** has `potrace` 1.16 (the tracer Inkscape itself uses), OpenCV,
NumPy, Pillow, `svgo`, and headless Chromium for rendering proofs. So all the tracing,
cleaning and optimisation happens here, and you never install anything.

**What I cannot do:** fetch images from the web myself, or generate AI images — I have no
image-generation tool in this session. Those two things are your clicks. That is the
whole division of labour.

---

## Route A — a real engraved putto (recommended)

**Your click 1.** Download Bickham's *The Universal Penman* (London, 1743) — 453 pages,
282 MB — and save it into a new folder `C:\Users\adamk\Claude\Projects\_source-plates\`.

<https://archive.org/details/bim_eighteenth-century_the-universal-penman-en_bickham-george_1743>

*Lighter alternative if 282 MB is annoying:* open the same item in the Internet Archive
book reader, page through to a plate with putti, and save three or four page images
straight out of the viewer into that folder. Skip to step 3.

**Then I take over:**

2. I slice the PDF **on your machine** at low resolution and assemble a contact sheet —
   one JPG showing every page as a thumbnail. That single small file crosses the bridge
   and I read it, so I can see the actual plates rather than guess at page numbers.
3. I pick the plates carrying putti, cherubs, cartouches and flourishes, and tell you
   what I found.
4. I re-extract just those plates at 600 dpi on your machine, and stage only those.
5. I run `engrave.py` on each: illumination flattening, Otsu threshold, despeckle,
   potrace, paper strip, recolour to `#4a3c2c`, svgo. Out comes a transparent,
   single-colour, web-ready SVG.
6. I render a proof and show you. If the threshold ate a thin stroke or kept a smudge,
   I adjust and re-run — it is one command.
7. I swap the real putto into the drollery, keeping the figure and the wind in separate
   groups so the animation still works, and commit.

---

## Route B — generate it instead

**Your click 1.** Open <https://www.recraft.ai/ai-vector-generator> and paste the master
prompt from the house-style note. It outputs true vector SVG and has a free daily-credit
tier. Two caveats from their own docs: free-tier generations are **public in their
community gallery**, and the free plan page does not state commercial-use rights.

**Your click 2.** Download the result — SVG if offered, otherwise the largest PNG — into
`_source-plates\`.

**Then I take over:** same pipeline from step 5. `engrave.py` accepts a raster just as
happily as a scan; if you get a true SVG I skip tracing entirely and only clean,
recolour and optimise it.

Expect to iterate. Models are decent at a putto and poor at flourishing — see the
house-style note. If the figure is good and the flourishes are mush, say so and we run
the hybrid: keep the generated figure, take the flourishes from Bickham or Zaner, and I
composite them.

---

## The tool

`tools/engrave.py` — one command, no GUI, no account.

```bash
python3 engrave.py plate.png --out cherub.svg --ink "#4a3c2c"
python3 engrave.py book.pdf --page 61 --dpi 600 --crop 0.15,0.2,0.5,0.6
```

| Flag | What it is for |
|---|---|
| `--page N --dpi 600` | pull one page out of a PDF |
| `--crop x,y,w,h` | pixels, or 0–1 fractions of the page |
| `--flatten 101` | divides out paper tone and vignetting before thresholding — this is what makes old scans work |
| `--threshold auto` | Otsu; override with a number if a plate is stubborn |
| `--despeckle 60` | drops ink blobs under N px — kills scan dust, keeps hatching |
| `--turdsize / --alphamax` | potrace speck filter and corner smoothing |
| `--invert` | for white-on-black sources |
| `--ink` | final colour; `#4a3c2c` on `#f4ecdb` is house |

**Verified 2026-07-29** against a synthetic plate built to be hostile — line art plus
hatching under a vignette, Gaussian sensor noise, and 500 dust specks. Result: 459 specks
removed, hatching intact, one path, 118 subpaths, 28 KB, transparent ground, correct ink.

---

## Sources worth slicing

| Source | What it gives | Free |
|---|---|---|
| Bickham, *The Universal Penman*, 1733 & 1743 (Internet Archive) | engraved copperplate with putti, cartouches, flourishes — the closest thing in print to what we want | yes |
| Zaner, *Lessons in Ornamental Penmanship*, 1909 (Internet Archive) | 19th-c American off-hand flourishing; birds and scrollwork | yes |
| IAMPETH Rare Books | scanned flourishing and engrossing manuals | yes |
| Rijksmuseum, Smithsonian Open Access, NYPL, Public Domain Review | engraved putti at high resolution with clear rights statements | yes |
| Craftsmanspace | an already-vectorised off-hand bird flourish after Clinton H. Clark | ⚠️ licence not stated — confirm before publishing |

---

## Provenance

Record edition and holding institution for every plate we use, in the room's `_STATUS`.
Generated ornament is *in the manner of* the tradition, never *of* it, and is never
attributed to a named penman. Same rule as the copy: verify or leave a placeholder.
