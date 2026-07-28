# The Fart Whisperer

Flatulinguistic analysis and interpretation. A working web application in a single file.

**Copy canon:** `9 - Projects/Fart Whisperer/Fart Whisperer — Final Copy v1.0.md` (Obsidian vault)
**Architecture:** `9 - Projects/Fart Whisperer/Fart Whisperer — Architecture v0.1.md`

---

## Show it to someone in the next sixty seconds

Double-click `index.html`. That is the whole thing. It runs offline, with no build step,
no server, and no install.

The microphone may or may not work from a `file://` address depending on the browser.
There is a **Simulated sample** button on the Record page that produces a full reading
either way, so a demo can never fail. To guarantee the live microphone works, put it on
a real URL — see below.

## Put it on the internet in thirty seconds

1. Go to **https://app.netlify.com/drop**
2. Drag this whole `fart-whisperer` folder onto the page.
3. You get an HTTPS URL immediately. The microphone works there. Send the link.

Cloudflare Pages (`pages.dev`) works the same way and matches how Vocabularium and
The Mnemonicon are already deployed. Either is free. A custom domain attaches later
and changes nothing about the build.

---

## What is actually in here

| | |
|---|---|
| `index.html` | Everything. Markup, styles, content, and the engine. ~90 KB, zero dependencies. |
| `README.md` | This file. |
| `CLAUDE.md` | Repo brain — read first when returning to this project. |

**Phase 0 (the Institution) and Phase 1 (the Instrument) are both complete.**

Twenty-four pages: home, record, reading, analysis, heritage, flavor wheel, global feed,
about, journal, the Rhineland paper with reviewer comments, guidance, the hearing, press,
method, changelog, pricing, terms, privacy, accessibility, status, unassigned,
Rhineland Day, certificate, examination, and a 404 in character.

Working: microphone capture and live waveform, real acoustic measurement, the seeded
interpretation engine, the Reading Bank across three rarity tiers, heritage assignment,
the five-consecutive Rhineland screen, reassessment, panel escalation with a monthly
limit, reanalyze, second pass, reading history, Wind Score, day streak, certification
track, the Sommelier examination, a printable wall certificate, downloadable share cards,
the live global feed with a rotating globe, and three-screen account deletion.

## How the engine works

It is theater, and deliberately so.

The Web Audio API takes **real** measurements — duration, level, peak frequency — and
those true numbers are printed on the reading with total confidence. The interpretation
attached to them is chosen by a seeded pseudo-random draw from a fixed bank of written
readings. Same recording always yields the same reading; **Reanalyze** bumps the seed and
returns a slightly different answer, exactly as the copy promises.

The Heritage Report is a weighted table in which Rhineland sits at 71.4 percent. Measured
over 20,000 generated readings the live distribution comes out at 71.2 percent, with every
other region within a tenth of canon. The majority-class bug is the flagship feature and it
is implemented literally.

There is no machine learning, no server, and no database. Audio never leaves the device —
it is never even encoded to a file. This is stated plainly on the Accessibility and data
practices page, which is the one page written outside the fiction.

## Verified

- JavaScript parses clean; no console or page errors across all 24 routes.
- Full flow tested headless: record, analyze, reading, history, heritage, reassess,
  examination, certificate, panel escalation, and the microphone-denied fallback path.
- Distribution check at 20,000 samples: Rhineland 71.2%, tiers 94.4 / 5.2 / 0.4,
  Latent family 2.1%, 96 flavor profiles present.
- Every reading in the bank ends with a colon. No exclamation points in product copy.
  No real people or companies anywhere.

## Next

Phase 2 is the Practice: notifications, Sentinel Mode, the Regimen, richer share cards.
Phase 3 is the Society, and needs accounts — its crown jewel is real Panels, three actual
humans voting blind to consensus on a stranger's contested reading.

Before anything charges real money or publishes real user audio, read the honesty ledger
in the architecture document. Verify the Roland of Hemingstone history against primary
sources before publishing the About page.
