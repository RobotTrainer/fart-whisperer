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
index.html    everything (~90 KB)
README.md     how to run and deploy
CLAUDE.md     this file
```

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

## Conventions

- Routing is hash-based; add a route by adding a `<section class="page" id="p-NAME">`
  and pushing `NAME` into the `ROUTES` array.
- Per-page setup goes in `onEnter(id)`.
- State is one localStorage key, `fw.v1`, through `load()` / `save()`.
- Never introduce randomness into a reading that is not derived from the seed — the same
  recording must always produce the same reading.

## Testing

Headless smoke test via Playwright: walk every route asserting exactly one visible page,
run the simulated-sample flow end to end, then exercise history, heritage, reassessment,
examination, certificate, escalation, and the microphone-denied fallback. Also run a
20,000-sample distribution check against canon percentages. Both passed on 2026-07-28
with zero console or page errors.

## Next steps

1. Deploy to Cloudflare Pages or Netlify; attach a domain once one is secured.
2. Phase 2 — the Practice: notifications, Sentinel Mode, the Regimen, richer share cards.
3. Phase 3 — the Society: accounts, then real Panels (three humans, blind, to consensus).
4. Before charging real money or publishing real user audio, read the honesty ledger in
   the architecture document.
5. Verify the Roland of Hemingstone history against primary sources before publishing.

## Guardrails

- No client data, no personal data, nothing business-adjacent ever enters this repo.
  It is a comedy app; keep it that way.
- Everything in the product is fiction except the Roland of Hemingstone history, which is
  real and sourced in the Final Copy. Keep that line clean if any of this goes public.
