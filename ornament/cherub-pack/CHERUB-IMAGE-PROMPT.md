# The Drollery — image prompt for Gemini

*Attach the three reference images in this folder. `02-right-putto-scan.png` is the
figure that matters — the seated putto on the right, three-quarter rear view, backside
toward the lower left. That is the one who toots.*

---

## Read this first — the hard part

The difficulty is not drawing a cloud. It is producing **two frames that are identical
except for the cloud**, because the page cross-fades between them on hover. Image models
are poor at "the same picture, one thing changed" — they redraw everything and the
cherub's face shifts, which reads as a glitch rather than a joke.

So there are two routes below. **Route 2 is the reliable one.** Try Route 1 first if you
want, but if the two frames don't match perfectly, fall back — Route 2 cannot fail,
because frame one stays the untouched 1743 engraving.

---

## ROUTE 1 — both frames in a single generation

```
Attached is a detail from an eighteenth-century copperplate engraving: a plate
from George Bickham's "The Universal Penman," London 1743. A winged putto sits
in three-quarter rear view on a rocaille scroll, holding a writing tablet.

Produce ONE image containing TWO panels side by side, sharing an identical
background and an identical figure.

LEFT PANEL: reproduce the attached engraving exactly as it is. Same pose, same
face, same hatching, same scrollwork. Change nothing.

RIGHT PANEL: the identical figure, pixel-for-pixel unchanged, with one addition
— a small plume of vapour issuing from beneath him, drifting down and to the
left, away from the tablet.

THE VAPOUR must be drawn in the same idiom as the plate: fine parallel curved
burin lines and spiral hatching, the way smoke, breath and cloud are engraved in
Baroque book plates and the cartouches of old maps. Not a cartoon puff. Not a
solid shape. Not motion lines. It should look like something a copperplate
engraver in 1743 would have cut with a graver — restrained, linear, and slightly
too dignified for what it is.

TECHNIQUE for both panels: line engraving, burin on copper. Pure black ink line
on cream laid paper. Modelling by parallel hatching and cross-hatching only —
no wash, no grey tone, no soft shading. Every stroke resolves.

The two panels must be identical apart from the vapour. Match the line weight,
the paper tone and the figure exactly.
```

## ROUTE 2 — the vapour alone (recommended)

This is the one I would run. It guarantees the frames match, because frame one *is* the
original plate and I composite your vapour over it.

```
Attached is a detail from an eighteenth-century copperplate engraving — a winged
putto seated on a scroll, from George Bickham's "The Universal Penman," London
1743.

Do NOT redraw the figure. I need ONE element only, isolated:

A small plume of vapour, drawn as an eighteenth-century engraver would cut it —
fine parallel curved burin lines and open spiral hatching, in the manner of the
smoke, breath and cloud forms in Baroque book plates and old map cartouches.
Roughly three or four nested curving strokes, issuing from a single point and
opening outward as they travel, tapering to nothing at their ends.

It should read as vapour and nothing else: no face, no cherub, no putto, no
frame, no text, no border.

DIRECTION: issuing from the lower right and drifting down and to the LEFT.
PROPORTION: about one third the width of the seated figure in the attachment.
TECHNIQUE: pure black line on plain white. No grey, no wash, no tone, no soft
edges, no drop shadow. Line weight matched to the attached engraving.
OUTPUT: on a plain white background, as large as you can make it, centred with
generous empty margin on all sides.

Give me three variations of differing density — sparse, medium, and fuller.
```

## Negative prompt, either route

```
colour, watercolour, painting, airbrush, gradient, soft focus, blur, glow,
grey wash, 3d render, cgi, modern illustration, cartoon, comic, chibi, anime,
clip art, sticker, emoji, motion lines, speed lines, dust cloud, fart cloud
with a green tint, stink lines, flies, text, lettering, watermark, signature,
frame, border, drop shadow
```

---

## What happens next

Send me whatever comes back and I'll take it from here. It runs through the same pipeline
as the plate itself — `tools/engrave.py`: threshold, despeckle, potrace, strip the paper,
recolour to the house ink, optimise. Out comes a transparent SVG in the same ink as the
engraving, which I register over the putto at the exact coordinates.

For the hover behaviour you described: a full-width band across the page, roughly three
inches tall, centred on the ornament. Entering it anywhere brings the vapour up over about
250ms; leaving fades it out. No click required, and the band is wide enough that you meet
it on the way past rather than having to aim. I'll respect `prefers-reduced-motion` and
keep a click fallback for touch devices, which have no hover at all.

## The reference files

| File | What it is | Use |
|---|---|---|
| `01-tailpiece-traced.png` | the plate, traced to clean line | shows the exact line quality to match |
| `02-right-putto-scan.png` | the seated putto, close | **attach this one** — it is the figure |
| `03-tailpiece-scan.png` | the full plate at 600 dpi | paper texture and burin detail |

All three derive from George Bickham, *The Universal Penman*, London 1743 — public
domain. Internet Archive scan `bim_eighteenth-century_the-universal-penman-en_bickham-george_1743`, page 10.
