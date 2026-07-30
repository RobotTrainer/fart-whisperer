---
title: "Fart Whisperer App — Build Guardrails"
created: 2026-07-29
tags: [reference, build]
purpose: "Upload into the app-implementation project. The non-negotiables, extracted."
---

# BUILD GUARDRAILS

*Everything in this file was decided, tested, or paid for in a previous session. It exists so
a fresh session does not re-litigate settled questions or quietly break something that took
real work to get right. Where this file and a new idea disagree, this file wins until a human
overrules it.*

---

## The copy is canon, and it lives somewhere else

The written material is the product. The code serves it. Canon lives in the vault at
`9 - Projects/Fart Whisperer/Fart Whisperer — Final Copy v1.0.md` and, where code and copy
disagree, **the copy wins and the code gets fixed.**

Consequences that are easy to break in a port:

**Every reading ends with a colon.** It lives in the data, it is never explained, and it is
never optional. If a port strips trailing punctuation or "tidies" the strings, the joke dies
silently.

No exclamation points in product copy. No real people and no real companies. The Office of
Public Guidance and the Director carry the satire.

The institution never admits fault. Reviewer 2 is never softened. The v2.4.2 revert stays.

Rhineland is **71.4%** and stays broken — it is the majority-class bug shipped as the flagship
feature. Verified at 71.2% over 20,000 samples. Do not "fix" it.

The accessibility page is written outside the fiction and is plainly, literally true,
including the data-practices note. Keep it accurate. If a port changes what the app does with
audio, that page changes in the same commit or the app is lying.

Everything in the product is fiction **except** the Roland of Hemingstone history and the
Luther citation, which are real and sourced. Keep that line clean.

---

## The engine is theater — and that is the architecture, not a shortcut

Real acoustic measurement feeds a deterministic seeded draw from a fixed bank of written
readings. The same emission always produces the same reading; Reanalyze bumps a counter and
shifts it.

There is no machine learning and there never needs to be. Nothing to train, nothing to serve.

This is why the app needs no backend, why audio never leaves the device, why there is no
privacy problem, and why the whole thing is one file. **Any plan that breaks this is the
wrong plan.** Specifically, do not add: accounts, audio upload, a server, analytics, ads, or
a model. The first two would create a moderation obligation that is deliberately gated to
Phase 3.

Never introduce randomness into a reading that is not derived from the seed.

One file, no build step, unless a reason survives a night's sleep. A bundler for a mobile
wrap is a legitimate reason; "it would be tidier" is not.

---

## The instrument: what it measures and what must not regress

Rebuilt 29 July 2026 and verified against real audio. Per-frame from a 2048-point FFT.

**Duration is SOUNDED time, never wall clock.** It used to report `performance.now()` from
click to click, which measured how long the user fumbled with the button. Onset and offset are
now found by double threshold with hysteresis, and the silence on either side is discarded
before duration, level, peak, **or the seed** are computed. Verified: 0.60s of sound inside a
2.60s recording reports 0.63s. Two takes of the same emission with different dead air now
agree, which is what determinism was always supposed to mean.

**Frame intervals are measured, never assumed.** `requestAnimationFrame` is not guaranteed
60fps — 120Hz displays and throttled tabs both exist. Anything that hardcodes 16.7ms is a bug.

**A capture is split into events; only the emission is read.** Laughter is the natural
companion of the methodology, so a recording usually holds an emission and then the reaction
to it. Events separate at 220ms gaps — wide enough that a staccato emission stays one event,
narrow enough that a following laugh becomes its own — each is judged alone, and the loudest,
lowest one wins. Verified on fart-then-laughter: 2 events found, the fart read, 0.58s
reported out of 3.25s.

**The admissibility gate is the one honest judgement in the app.** Speech, laughter, cough,
whistle and speaker playback are refused, each with its own finding and a one-click
affirmation override. It is deliberately conservative: **wrongly refusing a real emission is
a far worse failure than reading a cough.** The app's whole promise is that it delivers.

Three rules inside the gate that were each learned the hard way:

Repeated syllabic structure is a *necessary* condition for a speech verdict, not merely one
vote. That is what keeps a cough, a whistle and a door out of the speech bucket.

A low-frequency veto at `lowr > 0.55` overrides the syllable test. A staccato emission
genuinely has four onsets at speech rate — without this veto it was a false rejection.
Energy distribution outranks rhythm.

Replay detection requires **two independent physical signatures** to agree: a missing
fundamental below 200Hz **and** a band-limited top end (the ~15.5kHz codec cliff). Never one
alone. A genuinely high-pitched emission has no sub-200Hz energy either, and that false
positive was caught in testing one change before it would have shipped. Measured separation:
reproduced ~0.40, live air ~0.77.

---

## Two bugs that already happened once

**Use `getFloatFrequencyData`, never `getByteFrequencyData`, for any energy ratio.** The byte
form is dB mapped onto 0–255 against a −100dB floor, so a silent bin reads about 110 rather
than 0 — and with a thousand empty bins above 1.6kHz the noise floor drowns the actual
signal. Every fart was measuring `hfr ≈ 0.83` until this was found. Ratios must be computed
from true linear energy.

**The high-pitch / replay collision** described above. If replay detection is ever
simplified back down to one signature, it will start accusing people with high voices of
cheating.

---

## Testing is not optional here

Two Playwright harnesses in `tools/`, both green as of 29 July 2026.

`test-gate.js` — 22 cases. Synthesises PCM, plays it through a **real `AnalyserNode` in real
Chromium**, and calls the page's own `analyseCapture()`, so what is verified is exactly what
ships. Includes replay simulated with real biquad filters, fart-plus-laughter at two gap
widths, and the adversarial false-rejection cases.

`test-smoke.js` — all 26 routes render exactly one page, full simulated-sample flow, the date
on the card, share card, zero console errors.

**Keep both green through any port.** The gate is the only thing standing between this app
and a false accusation aimed at a real user.

Note on environment: Playwright's bundled browser version may not match the preinstalled one.
Both scripts discover `/opt/pw-browsers/chromium-*` and set `executablePath`. Do not run
`playwright install`.

---

## Store constraints — read before touching a submission

**Apple's App Store Review Guideline 4.3 (Spam) names our category explicitly**, listing
"drinking games, fart/burp apps, and other low-effort submissions" as apps that "lack value
and may result in **Developer Program removal**."

Not rejection. Removal. Therefore:

Android first, and not as a compromise — Play has no equivalent named prohibition and the
category is an established genre there.

If iOS is attempted, submit from **a separate Apple Developer account that nothing else
depends on**. Never the Veritas account, never anything client-facing. $99/year is cheap
insurance against a category-level judgement.

TestFlight is probably the honest answer for iPhone and iPad. Beta App Review is a materially
lower bar than full review, and the actual audience — people Adam knows, plus people who
arrive through the Word Hoard — is reachable that way. The web app also already works on iOS
today; Safari supports the microphone on an installed PWA.

**Google Play: new apps must target API 36 (Android 16) from 31 August 2026.** Build against
36 from the first commit; there is no version of this project that benefits from targeting 35
and migrating a month later. An extension to 1 November 2026 can be requested.

**The 12-tester gate:** personal Play accounts created after 13 November 2023 need 12 testers
opted in continuously for 14 days before production access, then up to ~7 days of review.
Roughly three weeks of calendar time, most of it waiting. **Organization accounts are
exempt** — which is the biggest schedule lever available and also in direct tension with this
project's own guardrail about keeping the fart app away from anything Veritas-adjacent. That
tension is a human decision, not a session decision.

Start the tester clock on day one. It is the critical path and it is pure waiting; everything
else can happen inside it.

---

## The open engineering risk

The gate thresholds were tuned against synthetic audio through desktop Chromium. **Phone
microphones differ** — many apply hardware high-pass filtering, which is partly why the app
already requests `echoCancellation: false`, `noiseSuppression: false`,
`autoGainControl: false`.

The `cliff` metric depends on the capture chain reaching 15.5kHz. A device recording at 16kHz
sample rate has no bins up there at all; that case is handled — `cliff` defaults to 1,
meaning "no cliff", so replay detection declines to fire rather than falsely accusing anyone
— but it is unproven in the field.

**Re-measure on real hardware before the replay accusation ships to phones.** It is the one
feature in the app that tells a user they are lying, and it should not do that on a device it
has never met. The closed test is the natural place to gather that data: twelve people
recording real emissions on real phones is exactly the dataset needed, and it cannot be
obtained any other way.

A conservative option worth considering for v1: compute the replay verdict, log it, and do
not surface it until real-device data confirms it. The measurement is free; the accusation is
not.

---

## Working preferences that apply to every session

Name every file you create or edit, and say whether it is saved to a permanent home (the
Obsidian vault or a GitHub repo) or only to a temp workspace that dies with the session. Flag
anything unsaved and offer to save it.

Git through the file bridge does not work on this machine: the mounted drive forbids
`unlink`, so every git write strands a `.git/index.lock` that then blocks GitHub Desktop with
*"A lock file already exists in the repository."* Locks can be moved but not deleted from that
side. **Do the committing and pushing in GitHub Desktop.** If a lock has been stranded, move
it into `Projects\_to_delete\`.

Ask before anything irreversible or public — a store submission, a production release, a
listing change, a purchase. Prepare it fully, then stop and ask.
