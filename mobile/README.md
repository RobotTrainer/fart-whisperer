# mobile/ — the Android (and future iOS) wrap

Capacitor wrap of the one-file app. The repo root `index.html` stays the single source of
truth; nothing here forks it.

## How the pieces fit

```
capacitor.config.json      appId com.thewordhoard.ventriloquium, webDir www
tools/sync-web.js          copies ../index.html -> www/index.html + appends the native shim
                           (haptics, safe-area padding; additive only, engine untouched)
tools/gen-icons.js         renders icon/splash art (the serif F seal) into assets/
tools/gen-screenshots.js   Play screenshots + icon-512 + feature graphic into store/
tools/iphone-audit.js      every route at iPhone size: overflow / small-input audit
www/index.html             GENERATED — never edit by hand; run sync-web.js
android/                   the native project (committed); targets API 36
store/                     submission pack, listing copy, privacy.html, screenshots
```

## Rebuild after any copy change to index.html

```
node tools/sync-web.js        # regenerate www/ from the repo root
npx cap sync android          # copy www/ into the native project
cd android && gradlew bundleRelease   # signed AAB -> app/build/outputs/bundle/release/
```

Then run both Playwright harnesses against `www/index.html` before shipping — the gate is
the only thing standing between this app and a false accusation aimed at a real user.

## Signing

The upload keystore is NOT in this repo. It lives in `..\..\fart-whisperer-keys\`
(sibling of the repo folder) together with its password and `keystore.properties`.
`android/keystore.properties` is gitignored; copy it from the keys folder (or see
`android/keystore.properties.example`). Lose the keystore and Play App Signing can rescue
the app; lose it AND the Play account and nothing can. Back the keys folder up somewhere
that is not this laptop.

## Standing rules (same as the repo root CLAUDE.md)

The copy is canon; where code and copy disagree, the copy wins. No ML, no server, no
accounts, no upload, no analytics, no ads. Every reading ends with a colon. Duration is
sounded time. Never assume 60fps. getFloatFrequencyData, never getByte. Replay detection
requires two independent signatures. Keep both harnesses green.
