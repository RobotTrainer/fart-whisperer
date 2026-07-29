# The Drollery — hover band

Two frames of a tailpiece from **George Bickham, *The Universal Penman*, London 1743**
(public domain; Internet Archive scan
`bim_eighteenth-century_the-universal-penman-en_bickham-george_1743`, page 10, traced at
600 dpi with `tools/engrave.py`).

| File | What it is |
|---|---|
| `rest.png` | the plate at rest |
| `gas.png` | the plate with a plume, and the mask's change of expression |
| `drollery-snippet.html` | drop-in: paste before `</body>`, set `DROLLERY_URL` |
| `drollery-demo.html` | self-contained preview |

## How the two frames were made to match

The second frame came back redrawn rather than edited, so **12.3% of pixels differed in
the third of the image that should have been identical** — enough to shimmer visibly on a
crossfade. Fixed by compositing: `gas.png` is `rest.png` with two authored regions taken
from the generated frame — a feathered ellipse over the plume (additive: the darker of the
two is kept) and one over the mask (a straight replacement). Measured after compositing,
the right third differs by **0.00%**. The two frames are now pixel-identical everywhere
except where they are meant not to be.

The supplied "transparent" PNGs were not transparent — the checkerboard was painted in as
literal pixels (white and grey 186), fully opaque. Alpha was rebuilt from luminance, which
removes the checkerboard and preserves the hatching's tonality, and the ink was recoloured
to `#4a3c2c`.

## The interaction

A full-width band, `min-height: 3in`, so the cursor meets it on the way past rather than
having to be aimed. The plume arrives in 110ms and disperses over 320ms — asymmetric on
purpose, so sweeping back and forth makes the puffs overlap.

It is a true crossfade: the rest frame must leave as the gas frame arrives. Layering one
over the other blends the two faces into a smudge.

Only the engraving is the link. The rest of the band is hover-only, so nothing navigates by
accident. Keyboard focus triggers the plume as well; touch devices, which have no hover at
all, get it on press.
