---
title: "Fart Whisperer — Handoff: mobile architecture and store roadmap"
created: 2026-07-29
tags: [handoff, plan]
for: "Fable 5 — battle-plan session"
---

# HANDOFF — The Fart Whisperer on Android, then iOS

*Written 29 July 2026 for a planning session. The purpose of this document is to hand over
everything needed to battle-plan the route to a shipped Android app and, after it, iPad and
iPhone. It carries the current state, the constraints that are already decided, the store
research done on 29 July, and the three decisions that have to be made by a human before
any code is written.*

---

## 0 · THE ONE THING TO READ IF YOU READ NOTHING ELSE

Apple's App Store Review Guidelines, section 4.3 (Spam), names our category explicitly.
The guideline lists "drinking games, fart/burp apps, and other low-effort submissions" as
apps that "lack value and may result in Developer Program removal."

Not rejection. **Removal from the Developer Program.**

This single sentence reorders the whole roadmap. It means Android is not merely the easier
first target, it is the *only* sane first target. It means iOS is not a port, it is a
repositioning exercise. And it means the app must never be submitted from an Apple account
that anything else depends on. More on all three below, in section 5.

Android has no equivalent named prohibition, and the category is a long-established genre on
Play. Android first is not a compromise. It is the plan.

---

## 1 · WHAT EXISTS TODAY

The app is live, finished, and in public use at **https://ventriloquium.thewordhoard.com**.

It is one file. `index.html`, about 104 KB, containing markup, styles, all copy, and the
engine. No build step, no dependencies, no server, no accounts, no network calls after the
page loads. It opens by double-click and deploys by drag. Twenty-six hash routes.

Hosting is Cloudflare Pages, project `ventriloquium`, direct upload (not Git-connected).
Redeploy is: Workers and Pages → ventriloquium → Create deployment → drag the folder. There
is no push that updates the live site; the upload *is* the deploy.

Repo is `C:\Users\adamk\Claude\Projects\fart-whisperer`. Canon copy lives in the vault at
`9 - Projects/Fart Whisperer/`, and where code and copy disagree, **the copy wins**.

### The governing architecture principle

**The engine is theater.** Real acoustic measurement feeds a deterministic seeded draw from
a fixed bank of written readings. There is no machine learning and there never needs to be.
The same emission always yields the same reading; Reanalyze bumps a counter and shifts it.

This is the most important thing to preserve in any port. It is why the app needs no
backend, why audio never leaves the device, why there is no privacy problem, and why the
whole thing fits in one file. Any mobile plan that breaks this is the wrong plan.

### What the instrument actually measures (as of 29 July)

This was substantially upgraded today and the numbers below are measured, not assumed.
Per-frame at the real display refresh rate, from a 2048-point FFT:

RMS level, zero-crossing rate, energy ratio below 500Hz (`lowr`), energy ratio above 1600Hz
(`hfr`), the fundamental-band ratio below 200Hz (`fund`), a codec-cliff ratio across 15.5kHz
(`cliff`), and the spectral peak.

On top of those, three things now happen that did not before:

**Duration measures the sound, not the button press.** Onset and offset are found by double
threshold with hysteresis, and the silence on either side is discarded before duration,
level, peak, or the seed are computed. Verified: 0.60s of sound inside a 2.60s recording
reports as 0.63s. Two recordings of the same emission with different amounts of dead air now
agree, which is what determinism was always supposed to mean.

**The capture is split into events and only the emission is read.** People laugh — laughter
is the natural companion of the methodology — so a recording usually holds an emission and
then the reaction to it. Events are separated at 220ms gaps (wide enough that a staccato
emission stays one event, narrow enough that a following laugh becomes its own), each is
judged alone, and the loudest, lowest one wins.

**An admissibility gate refuses what is not an emission.** Speech, laughter, coughs,
whistles, and audio played back through a speaker are all turned away, each with its own
finding, and each with a one-click affirmation override so a false refusal costs the user
nothing.

The gate's logic, in order: repeated syllabic structure is a *necessary* condition for a
speech verdict (which keeps coughs and whistles out of that bucket); a low-frequency veto at
`lowr > 0.55` protects staccato emissions from the syllable test; the positive test for an
emission is low-frequency dominance; and replay detection requires **two independent
physical signatures** to agree — a missing fundamental *and* a band-limited top end.

That last one is worth understanding, because it is the only genuinely novel measurement in
the app. A phone or laptop speaker physically cannot reproduce below about 400Hz, so a fart
played back through one arrives without its fundamental. But a *genuinely* high-pitched
emission has no sub-200Hz energy either, so the missing fundamental cannot convict alone —
that false positive was caught in testing and would otherwise have shipped. The second,
pitch-independent signature is the spectral cliff that playback chains leave at the top end
and live air never has. Measured: reproduced samples cliff at about 0.40, live capture at
about 0.77.

### Test coverage

Two Playwright harnesses in `tools/`, both green as of 29 July:

`test-gate.js` — 22 cases. Synthesises PCM, plays it through a real `AnalyserNode` in real
Chromium, and calls the page's own `analyseCapture()`. What is tested is exactly what ships.
It includes replay simulated with real biquad filters, fart-plus-laughter at two gap widths,
and the adversarial false-rejection cases (staccato, wet, cough).

`test-smoke.js` — all 26 routes render exactly one page, full simulated-sample flow, share
card, zero console errors.

**Keep both green through any port.** They are the only thing standing between this app and
a false accusation aimed at a real user.

---

## 2 · THE ANDROID DECISION THAT MATTERS MOST

There are two credible routes and they are not close in effort. The question is whether the
app needs anything a browser cannot give it.

### Route A — Trusted Web Activity (Bubblewrap / PWA Builder)

The existing site, wrapped. Chrome renders it full-screen with no browser chrome, from the
live URL, with the real origin's permissions. Effort is roughly a day. The app stays one
file; updates ship by Cloudflare upload without a store review.

That last property is worth a great deal for a comedy app whose copy is canon and gets
revised. Every text fix reaches users the same afternoon.

What it costs: a TWA needs a `assetlinks.json` on the domain to prove ownership, it needs
network on first load, and the microphone permission flows through the web permission
prompt rather than the native one. Notifications work but through web push.

### Route B — Capacitor wrap

The same single file bundled as a local asset, with native shells available. Effort is a few
days. It works offline from install, gets native permission dialogs, native push, and a
path to widgets and share sheets later. It also gets the same codebase to iOS when that
question comes up.

What it costs: a store review for every copy change, and a build toolchain in a project
whose entire virtue so far has been not having one.

### The recommendation to bring to the session

**Route B, Capacitor** — but not for the usual reasons. Not for offline, not for
performance. For exactly one reason: **section 5 of this document.** If iOS is ever
attempted, the 4.2 minimum-functionality bar cannot be cleared by something that is visibly
a website in a frame, and the native surface area is the material difference. Choosing
Capacitor for Android is choosing to have an answer ready on iOS.

If iOS is abandoned outright — a legitimate choice given 4.3 — then Route A is correct and
the whole thing ships in a day.

*So this is not a technical decision. It is downstream of the iOS decision, and the iOS
decision belongs to Adam. Do not let the session resolve it by defaulting.*

---

## 3 · ANDROID: THE ACTUAL BLOCKING PATH

Researched 29 July 2026. These are current and two of them are time-critical.

### The August 31, 2026 deadline — about one month away

New apps and updates on Play must target **Android 16 (API level 36)** or higher from
31 August 2026. Before that date the bar is API 35. An extension to 1 November 2026 can be
requested.

Practical consequence: build against API 36 from the first commit. There is no version of
this project that benefits from targeting 35 and then migrating in four weeks.

### The 12-tester gate — and the exemption that avoids it

Personal Play developer accounts **created after 13 November 2023** must run a closed test
with at least **12 testers opted in continuously for 14 days** before applying for
production access. Review of that application then takes up to about 7 days.

So from a standing start on a new personal account, the floor is roughly **three weeks of
calendar time** before the app can reach production, most of it waiting.

**Organization accounts are exempt.** This is the single biggest schedule lever available.

And it is a genuine dilemma rather than a free win, because the project's own standing
guardrail says the opposite. From the architecture doc: *"personal GitHub (not Veritas —
nothing business-adjacent, nothing client-adjacent)."* Using the Veritas organization
account to skip the tester gate would attach a fart app to the business entity — and, given
section 5, to an entity that could in principle face account-level consequences.

The recommendation is to **accept the three weeks on a personal account** and start the
closed test early, in parallel with everything else. Twelve testers is not a hard number to
reach for this particular app; it is the sort of thing a single group message solves. Start
that clock on day one, because it is pure waiting and everything else can happen inside it.

### The rest of the Android checklist

A one-time **$25** Play Console registration fee. An AAB, not an APK. An upload key, backed
up somewhere that is not one laptop. A Data Safety declaration — which for this app is the
easy and pleasant part, because the honest answer to every question is *no data collected,
no data shared, audio never leaves the device*, and that is genuinely true and independently
checkable in a public repo. A privacy policy at a public URL, which exists. Content rating
via the questionnaire; expect the crude-humour flags and answer them honestly.

`RECORD_AUDIO` is the only dangerous permission, requested at point of use, with the
existing Simulated Sample as the working fallback for refusal. That fallback already exists
and is already tested.

---

## 4 · WHAT SHOULD CHANGE FOR MOBILE (AND WHAT SHOULD NOT)

The web app is not simply a smaller version of a mobile app; a few things genuinely want to
differ, and a few things must not.

Worth doing on mobile: the microphone rationale screen ahead of the system prompt, because
a cold native permission dialog for *this* app needs a sentence of context first. Haptics on
the analysis beats, which is free and considerably improves the theater. Honouring the
device's reduced-motion and dark-mode settings. And an offline-first posture, since the
whole point of Capacitor is that the app opens on a plane.

Worth *not* doing, and worth defending in the session: no accounts, no upload, no server, no
analytics, no ads, no ML. Every one of those would be a regression, and the first two would
create a moderation obligation that Phase 3 deliberately gates on.

One real technical risk to flag for the port: **the gate thresholds were tuned against
synthetic audio played through Chromium's `AnalyserNode` on a desktop.** Phone microphones
differ — many apply hardware high-pass filtering, and the app already disables
`echoCancellation`, `noiseSuppression`, and `autoGainControl` for exactly this reason. The
`cliff` metric in particular depends on the capture chain reaching 15.5kHz, and a device
recording at 16kHz sample rate would have no bins up there at all. That case is already
handled — `cliff` defaults to 1, meaning "no cliff," so replay detection simply declines to
fire rather than falsely accusing anyone. But **the thresholds should be re-measured on real
hardware before the replay accusation ships to phones.** It is the one feature in the app
that tells a user they are lying, and it should not do that on a device it has never met.

---

## 5 · iOS: THE HARD PART, STATED PLAINLY

Guideline 4.3 names fart apps. Guideline 4.2 requires meaningful utility beyond a repackaged
website. Guideline 1.1 covers content "intended to disgust" or "in exceptionally poor taste."
A naive submission of this app is not a coin flip; it is a likely rejection with a tail risk
of Developer Program removal.

There is a real case to be made, and it is not a trick. This app is genuinely not a
soundboard. It contains a substantial original written corpus — a journal with six pieces, a
testimony, a versioned guidance archive, a changelog written as archaeology, terms, and a
taxonomy — which is to say it is a work of satirical fiction that happens to have an
instrument in it. And the instrument is real: genuine FFT analysis, onset detection, event
segmentation, and a replay detector resting on actual acoustics. That is a defensible answer
to 4.2, and it is *true*, which is the only kind of answer worth giving.

Whether it is an answer to 4.3 is a different question, and honestly nobody outside Apple
knows. 4.3 is about category and effort, and the category is named.

So the iOS strategy, if it is attempted:

Position it as what it actually is — interactive satire and a comedy publication, in
Entertainment, with the written corpus forward in the screenshots and the listing. Do not
lead with the joke. The store listing copy that already exists in canon is deliberately
straighter than the site, which was the right instinct and should be kept.

Submit it from a **separate Apple Developer account that nothing else depends on.** $99 per
year. This is not paranoia; it is the direct reading of "may result in Developer Program
removal." Never put the Veritas account or anything client-facing behind this submission.

Treat TestFlight as the real goal and the App Store as the stretch. TestFlight distribution
to a few hundred people requires only Beta App Review, which is a materially lower bar than
full review, and for a comedy app shown to friends that may be the entire actual
requirement. **This is probably the honest answer for iPhone and iPad**: the audience for
this app is people Adam knows and people who find it through the Word Hoard, and TestFlight
plus the live web app reaches all of them without ever meeting 4.3.

And note the web app already works on iPhone and iPad today. Safari supports the microphone
on an installed PWA. The gap between "add to home screen from ventriloquium.thewordhoard.com"
and "App Store app" is, for this specific project, mostly prestige.

---

## 6 · SUGGESTED SEQUENCE

Ordered so the waiting happens in parallel with the work.

**Day one, in this order:** register the Play account and pay the $25; immediately create
the app record and start recruiting the twelve testers, because that fourteen-day clock is
the critical path and nothing else depends on it. Then decide Route A versus Route B, which
means deciding the iOS question first.

**Week one:** wrap it, targeting API 36 from the start. Generate and *back up* the upload
key. Get an internal build onto a real Android phone and re-measure the gate metrics on real
hardware — this is the step most likely to surface something surprising.

**Weeks one to three, running concurrently:** the closed test. Use it for what it is
genuinely good for rather than treating it as a formality — twelve people recording real
emissions on real phones is precisely the dataset needed to confirm the admissibility
thresholds, and it cannot be obtained any other way.

**Week three or four:** production application, Data Safety, content rating, listing. Then
release, and expect the review to take up to a week.

**Only after Android is live and stable:** revisit iOS with real usage data in hand, and
make the TestFlight-versus-App-Store call then rather than now.

---

## 7 · THE THREE DECISIONS A HUMAN HAS TO MAKE

These are Adam's, not the session's. The session should surface them, present the tradeoffs,
and stop.

**One. Is iOS in scope at all?** Everything else follows from this. If yes, Capacitor and a
separate Apple account. If no, a TWA ships in a day and the iPhone story is "install it from
the browser." Given 4.3, "no, and TestFlight later if we want it" is a perfectly respectable
answer and possibly the best one.

**Two. Personal Play account or the Veritas organization account?** Personal costs about
three weeks of waiting. Organization skips it and violates the project's own guardrail about
keeping this away from anything business-adjacent. The recommendation is personal, with the
tester clock started on day one.

**Three. Does the replay accusation ship in v1?** It is the most interesting thing in the
app and the only feature that calls a user a liar. Tuned on synthetic desktop audio, it is
correct on every case tested; on unknown phone hardware it is unproven. The conservative
option is to compute it, log it, and not surface it until the closed test confirms it on
real devices — the measurement is free, the accusation is not.

---

## 8 · POINTERS

Live app: https://ventriloquium.thewordhoard.com
Hidden arrival page: `/#/ventriloquium`
Repo: `C:\Users\adamk\Claude\Projects\fart-whisperer`
Canon copy: `9 - Projects/Fart Whisperer/Fart Whisperer — Final Copy v1.0.md`
Architecture and the honesty ledger: `… /Fart Whisperer — Architecture v0.1.md`
Status and session log: `… /_STATUS — Fart Whisperer.md`
Deployment specifics: project doc *Fart Whisperer — Deployment Record*
Tests: `tools/test-gate.js`, `tools/test-smoke.js`

Two standing constraints that outlive any port: read the honesty ledger in the architecture
document before anything charges real money against fictional numbers, and everything in the
product is fiction **except** the Roland of Hemingstone history and the Luther citation,
which are real and sourced. Keep that line clean.

*One more, easy to lose in a port: every reading ends with a colon. It lives in the data, it
is never explained, and it is never optional.*
