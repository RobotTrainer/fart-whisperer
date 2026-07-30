---
title: "Fart Whisperer — Play Store Submission Pack"
created: 2026-07-29
tags: [handoff, store]
purpose: "Everything to paste into Play Console, in the order the Console asks for it."
---

# PLAY STORE SUBMISSION PACK — v1.0.0

The build this pack describes: `app-release.aab`, package `com.thewordhoard.ventriloquium`,
versionCode 1, versionName 1.0.0, target/compile SDK 36 (the 31 Aug 2026 requirement is met
with a month to spare). Signed with the upload key in `fart-whisperer-keys/`.

**Before anything else, two Adam-only steps:** register the personal Play Console account
($25 one-time, play.google.com/console — personal, NOT Veritas, per the standing guardrail),
and start recruiting the twelve testers. The 14-day tester clock is the critical path;
everything in this file happens inside it.

---

## 1 · Create the app

Console → Create app.
App name: **The Fart Whisperer**
Default language: English (US) · App or game: App · Free or paid: **Free**
(Free is not reversible to paid, but paid-to-free isn't either and nothing here charges
money — the honesty ledger gates real payments anyway.)

## 2 · Store listing

**Short description** (max 80 chars — this is 68):

> Flatulinguistic analysis and interpretation. A reading in 90 seconds.

**Full description — recommended variant** (canon opener, plus one paragraph of plain truth;
the truth paragraph is both the legally safe move and the best conversion copy the app has):

> The Fart Whisperer records, analyzes, and interprets your emissions using a reference
> database of over four million verified samples. Receive a full reading in under ninety
> seconds. Trace your signature to its ancestral region. Compare results with certified
> users worldwide.
>
> Every reading is produced by genuine acoustic measurement — duration, level, spectral
> peak — performed entirely on your device. Audio never leaves your phone: no uploads, no
> accounts, no ads, no analytics. Decline the microphone and a Simulated Sample mode works
> just as well.
>
> The Fart Whisperer is a work of interactive satire from the fictional Office of Public
> Guidance. The instrument is real. The Bureau is not. The Bureau disputes this.

(A pure-deadpan variant with no satire disclosure exists in canon, but Play's metadata policy
forbids misleading claims in listings — the four-million-database line presented as plain
fact is exactly what that policy is for. The last paragraph keeps the joke AND the compliance.
"The Bureau disputes this" lets the fiction get the final word.)

**Graphics** — all in `mobile/store/`:
icon-512.png (512×512) · feature-graphic.png (1024×500) · screenshots/01–08 (1080×2400).
Suggested order: 04-reading first (it's the product), then 01-home, 02-record, 05-heritage,
07-architecture, 06-journal, 08-accessibility.

**Category:** Entertainment. **Tags:** pick from Console suggestions (Comedy if offered).
**Contact email:** adamkinunen@gmail.com
**Privacy policy URL:** https://ventriloquium.thewordhoard.com/privacy.html
← `privacy.html` in this folder must be added to the Cloudflare Pages deploy folder and
re-deployed BEFORE submitting. It is the real policy, written outside the fiction, same
mechanism as the accessibility page.

## 3 · App content declarations (Policy → App content)

- **Privacy policy:** URL above.
- **Ads:** No, the app contains no ads.
- **App access:** All functionality available without special access (no login).
- **Content ratings questionnaire:** category Entertainment. Answer honestly:
  crude humor / toilet humor: YES (mild, comedic). Violence, sexuality, drugs, gambling,
  hate speech, user-generated content: NO. Simulated gambling: NO. This should land
  Everyone 10+ or Teen. Do not shade the answers; the questionnaire is signed.
- **Target audience:** 13+ (do NOT tick any under-13 age band; that triggers Families
  policy). Not designed for children.
- **News app:** No. · **COVID-19 app:** No. · **Data safety:** next section.
- **Government app:** No — the Office of Public Guidance is fictional satire, no real
  government entity is referenced or impersonated.
- **Financial features:** None. · **Health apps:** No — declare nothing; the app makes no
  health claims (the in-app symptom checker is fiction and always ends "consult a
  professional").

## 4 · Data safety form

The honest answers are also the easy ones:

- Does your app collect or share any of the required user data types? **No.**
  (Audio is processed ephemerally on-device and never transmitted — Google's own guidance
  treats on-device-only, never-off-device processing as NOT collected. Reading history lives
  in local storage only. Nothing is shared with anyone, including us.)
- Is all of the user data collected by your app encrypted in transit? N/A (nothing collected).
- Do you provide a way for users to request that their data is deleted? N/A — and note in
  the listing that uninstalling removes everything.

The public repo (once pushed) makes every one of these answers independently checkable,
which is a stronger position than most apps on the store.

## 5 · Release sequence

1. **Internal testing** track first (up to 100 testers, instant): upload `app-release.aab`,
   add adamkinunen@gmail.com as tester, install on the real phone. THIS is where the gate
   thresholds meet real hardware for the first time — record real emissions, check the
   admissibility verdicts, and especially watch the replay accusation (it ships in v1 by
   decision of 29 Jul; if real phones misfire it, we tune before production).
2. **Closed testing** track: create, upload same AAB, add the 12 testers (email list or
   Google Group), have them opt in via the link and KEEP the app installed. 14 consecutive
   days. Start this the day the account exists.
3. **Apply for production access** (Console prompts when eligible), answer the questions
   about the closed test honestly, then **Production** release. Review can take ~7 days.

## 6 · Things that changed vs. the web app, for the record

- One additive `<script id="fw-native-shim">` (haptics + edge-to-edge safe areas) appended
  by `tools/sync-web.js`. The app file is otherwise byte-identical to the repo root
  index.html. Both Playwright harnesses pass on the shimmed copy (22/22 gate, 27 routes).
- Permissions: RECORD_AUDIO + MODIFY_AUDIO_SETTINGS (mic via Capacitor's built-in WebView
  grant path), VIBRATE (haptics), INTERNET (Capacitor default, kept for v1 as the safe
  choice; stripping it is a v1.1 candidate once real hardware confirms nothing needs it —
  an app that literally lacks network permission is the strongest privacy proof there is).
- versionName 1.0.0. (Canon's v2.4.2 lives inside the fiction, not in Play metadata.)

## 7 · What must never happen from here

No Veritas account anywhere near this. No audio upload, accounts, analytics, ads, or ML in
any future release. Store listing stays straighter than the site. And if iOS is attempted
later: separate $99 Apple account that nothing else depends on, TestFlight before App Store,
per the roadmap's section 5.
