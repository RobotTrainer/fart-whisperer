# CLAUDE.md — fart-whisperer

Read this first. Repo brain for The Fart Whisperer.

## What this repo is

A complete, shippable web application for The Fart Whisperer — an app in the fictional
field of flatulinguistics. Phase 0 (the Institution) and Phase 1 (the Instrument) are
built and working.

**The copy is canon and lives in the vault, not here:**
`9 - Projects/Fart Whisperer/Fart Whisperer — Final Copy v1.0.md`
`9 - Projects/Fart Whisperer/Fart Whisperer — Architecture v0.1.md`
`9 - Projects/Fart Whisperer/_STATUS — Fart Whisperer.md`

Where this code and the Final Copy disagree, **the copy wins** and the code gets fixed.

## Layout

Deliberately one file. `index.html` contains markup, styles, content, and the engine —
no build step, no dependencies, no server. It opens by double-click and deploys by drag.
Do not add a bundler until there is a reason that survives a night's sleep.

```
index.html                  everything (~104 KB)
README.md                   how to run and deploy
CLAUDE.md                   this file
HANDOFF-mobile-roadmap.md   Android-then-iOS battle plan + store research
tools/test-gate.js          admissibility + duration tests (real AnalyserNode)
tools/test-smoke.js         all routes, full flow, zero console errors
tools/engrave.py            scan -> SVG ornament pipeline
```

Pure-copy canon pages (no engine, no JS, add via the two-step in Conventions): the five
Journal papers (`paper-emigrants`, `paper-morning`, `paper-bolivia`, `paper-latent`,
`paper-silence`), plus `regimen`, `careers`, `corrections`, `letters`, `architecture`
(Systems Report T‑1), `faq-unanswered` (questions the Office declines — the last one's answer
is a literal `&nbsp;`), `anatolian` (the celebrity reading permalink; the view counter is frozen
at **340,000** and that number must never change), `sentinel` (the overnight vigil / Dawn Report),
and `memoriam` (eulogies for retired Flavor-Wheel profiles — "merged into the Rhineland, as all
things are"). All deadpan, no exclamation points, no real people/companies. Recurring
bits that must stay consistent if edited: Reviewer 2 is a standing cosmic role and is never
softened (see `careers`); the Bolivia field notes end in cheerful dissociation and are
"reclassified from Field Notes to Findings" in `corrections`; the Latent family has four
profiles that "can be seen, cannot be printed" (protects the Konami egg — never name them in
copy); the Fourth Silence is never explained; "Is this a joke? / No." and "same reading four
days in a row / Then it is worth considering" are shared between the home FAQ and `letters`.

Inside `index.html`, in order: `<style>` (design tokens at the top under `:root`),
one `<section class="page">` per route, then `<script>` — content data first
(READINGS, TIERS, REGIONS, FAMILIES, EXAM, feed data), then store, engine, router,
recorder, analysis theater, and the renderers.

## Decisions — do not re-litigate

- **The engine is theater.** Real acoustic measurement, deterministic seeded selection
  from a written bank. No ML, ever. Nothing to train, nothing to serve.
- **Audio never leaves the device.** Never uploaded, never encoded, never stored. This is
  the privacy stance, the App Store UGC answer, and the honest thing — all at once.
- **One file, no build.** The whole point is that it ships anywhere in thirty seconds.
- **Rhineland is 71.4%** and stays broken. Verified at 71.2% over 20,000 samples.
- **Every reading ends with a colon.** It lives in the data, never explained, never optional.
- **No exclamation points in product copy. No real people or companies.**
- **The accessibility page is real** — written outside the fiction, plainly true, and it
  carries the real data-practices note. Keep it accurate.
- Web first. Store submission only after a real moderation stack exists.
- **`/architecture` (Systems Report T‑1, *On the Instrument*) is in-universe, not backstage.** It is the Bureau's grand technical "reply" to the Hongyuan replication on `/press` — a diegetic white paper describing the impossible infrastructure with a straight face. It never breaks the fiction: no admission the engine is theater. It stays canon-clean by distinguishing the **reference instrument** (a worn 12-sensor array + capsules, used only to build the corpus in the Bureau's labs) from the **consumer instrument** (your telephone, one channel, which "reconstructs what the array would have heard"). The audio-never-leaves-the-device stance is stated straight and stays true. Numbers match canon exactly: 4,110,882 emissions (see `/paper`) and 71.4% Rhineland. The backstage source is the vault doc `Fart Whisperer — Behind the Curtain (SF worldbuilding v0.1)` — that doc breaks the fourth wall on purpose; this page must never inherit that.
- **Duration is SOUNDED time, never wall clock.** Onset/offset by double threshold with
  hysteresis; the silence around the event is discarded before duration, level, peak, or the
  seed are computed. Two takes of the same emission with different dead air must agree.
- **A capture is split into events; only the emission is read.** Laughter is expected and is
  set aside rather than being grounds for refusing the recording.
- **The admissibility gate is the one honest judgement in the app.** Speech, laughter, cough,
  whistle, and speaker playback are refused, each with its own finding and a one-click
  affirmation override. It is deliberately conservative: wrongly refusing a real emission is
  a far worse failure than reading a cough.
- **Replay detection requires two independent signatures** — a missing fundamental (<200Hz)
  AND a band-limited top end (the ~15.5kHz codec cliff). Never one alone: a genuinely
  high-pitched emission has no sub-200Hz energy either. That false positive was caught in
  testing; do not reintroduce it.
- **Use getFloatFrequencyData, never getByteFrequencyData**, for any energy ratio. The byte
  form is dB mapped onto 0-255 against a -100dB floor, so silent bins read ~110 and a
  thousand empty high bins drown the signal. This was a real shipped-adjacent bug.
- **Never assume 60fps.** Frame intervals are measured; rAF is not guaranteed.

## Conventions

- Routing is hash-based; add a route by adding a `<section class="page" id="p-NAME">`
  and pushing `NAME` into the `ROUTES` array.
- Per-page setup goes in `onEnter(id)`.
- State is one localStorage key, `fw.v1`, through `load()` / `save()`.
- Never introduce randomness into a reading that is not derived from the seed — the same
  recording must always produce the same reading.

## Testing

Two Playwright harnesses, both green 2026-07-29. Playwright's bundled browser may not match
the preinstalled one — both scripts discover `/opt/pw-browsers/chromium-*` and set
`executablePath`. Do not run `playwright install`.

- `node tools/test-gate.js` — 22 cases. Synthesises PCM, plays it through a **real
  AnalyserNode in real Chromium**, and calls the page's own `analyseCapture()`, so what is
  verified is exactly what ships. Covers speech, laughter, cough, whistle, silence, the
  adversarial false-rejection cases (staccato, wet), fart-plus-laughter at two gap widths,
  and replay simulated with real biquad filters. Also asserts sounded-duration accuracy.
- `node tools/test-smoke.js` — all 40 routes render exactly one page, full simulated-sample
  flow, date on the card, share card, gate helpers present, zero console errors.

Keep both green. The gate is the only thing standing between this app and a false accusation
aimed at a real user.

## Next steps

1. **Re-measure the gate thresholds on real phone hardware** before the replay accusation
   ships to mobile. Tuned on synthetic desktop audio; phone mics high-pass differently and a
   16kHz-sample-rate device has no bins above 15.5kHz at all (handled — `cliff` defaults to
   1 so detection declines rather than accuses — but unproven in the field).
2. Android, then iOS. See `HANDOFF-mobile-roadmap.md`. **Apple guideline 4.3 names fart apps
   as grounds for Developer Program removal** — never submit from an account anything else
   depends on.
3. Phase 2 — the Practice: notifications, Sentinel Mode, the Regimen, richer share cards.
4. Phase 3 — the Society: accounts, then real Panels (three humans, blind, to consensus).
5. Before charging real money or publishing real user audio, read the honesty ledger in
   the architecture document.
6. Verify the Roland of Hemingstone history against primary sources before publishing.

## Guardrails

- No client data, no personal data, nothing business-adjacent ever enters this repo.
  It is a comedy app; keep it that way.
- Everything in the product is fiction except the Roland of Hemingstone history, which is
  real and sourced in the Final Copy. Keep that line clean if any of this goes public.
