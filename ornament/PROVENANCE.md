# Ornament provenance

Both files are traced from George Bickham, *The Universal Penman*, engraved by
George Bickham, London, **1743** — public domain. Scan: Internet Archive,
`bim_eighteenth-century_the-universal-penman-en_bickham-george_1743`, from the
Eighteenth Century Collections microfilm.

| File | Plate | PDF page | Crop at 600 dpi |
|---|---|---|---|
| `putti.svg` | Engraved title page — four putti in a laurel wreath bearing a banner reading DELECTANDO MONEMUS | 2 | x1340 y5090 w3540 h3420 |
| `tailpiece.svg` | Tailpiece to "A Poem on the Universal Penman" by John Bancks — two putti flanking a rocaille cartouche with a sunburst mask | 10 | x1870 y8440 w2700 h1400 |

`*-web.svg` are the same paths at reduced coordinate precision for page weight.

Processed with `tools/engrave.py`: illumination flattening (r=101), Otsu
threshold, connected-component despeckle (90 px), potrace (turdsize 6),
paper strip, recolour to `#4a3c2c`, svgo. Reproducible — the crop boxes above
regenerate them exactly from the source PDF.

**DELECTANDO MONEMUS** — "by delighting, we instruct." Bickham's motto for the
book, carried by the putti on his title page.
