/* ===========================================================================
   test-gate.js — verify the sounded-duration trimming and the admissibility
   gate against real audio through a real AnalyserNode.

   This does NOT unit-test the thresholds in isolation. It synthesises PCM,
   plays it through the same graph the recorder uses, samples frames with the
   page's own readFrame(), and calls the page's own soundedSpan() and
   admissibility(). If this passes, the shipped code path passes.

   Run:  node tools/test-gate.js
   =========================================================================== */

const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

/* Each case: what we synthesise, and what the Bureau ought to conclude. */
const CASES = [
  { name: 'fart, classic (110Hz buzz, 0.6s, 1s dead air either side)',
    kind: 'fart', f0: 110, dur: 0.6, pad: 1.0, expect: 'admissible', expectDur: 0.6 },
  { name: 'fart, very short (160Hz, 0.2s)',
    kind: 'fart', f0: 160, dur: 0.2, pad: 0.8, expect: 'admissible', expectDur: 0.2 },
  { name: 'fart, long low rumble (80Hz, 1.6s, shallow 1.5Hz tremolo)',
    kind: 'rumble', f0: 80, dur: 1.6, pad: 0.6, expect: 'admissible', expectDur: 1.6 },
  { name: 'fart, squeaky high (380Hz, 0.35s)',
    kind: 'fart', f0: 380, dur: 0.35, pad: 0.6, expect: 'admissible', expectDur: 0.35 },
  { name: 'speech, sentence (4 syll/s, formants, 2 fricatives, 2.2s)',
    kind: 'speech', dur: 2.2, pad: 0.5, expect: 'speech' },
  { name: 'speech, counting one-two-three-four (2.0s)',
    kind: 'counting', dur: 2.0, pad: 0.5, expect: 'speech' },
  { name: 'whistle (2kHz pure tone, 1s)',
    kind: 'whistle', dur: 1.0, pad: 0.5, expect: 'outofrange' },
  { name: 'silence only',
    kind: 'silence', dur: 1.5, pad: 0.0, expect: 'nospan' },

  /* --- adversarial: the false-rejection risks, which are the ones that
         actually matter. Refusing a real emission kills the joke. --- */
  { name: 'ADVERSARIAL fart, staccato 4 bursts at ~3/s (trips the syllable test)',
    kind: 'staccato', f0: 110, dur: 1.3, pad: 0.6, expect: 'admissible' },
  { name: 'ADVERSARIAL fart, wet and noisy (drives zcr up)',
    kind: 'wet', f0: 130, dur: 0.5, pad: 0.6, expect: 'admissible' },
  { name: 'cough (broadband, single onset)',
    kind: 'cough', dur: 0.28, pad: 0.6, expect: 'outofrange' },
  { name: 'laughter, ha-ha-ha-ha (a deliberate vocal act)',
    kind: 'laugh', dur: 1.6, pad: 0.5, expect: 'speech' },

  /* The realistic capture: an emission, then the reaction to it. Must read
     the emission and set the laughter aside — and must report only the
     emission's duration, not the pair. */
  { name: 'THE REAL CASE fart then laughter, 0.4s gap',
    kind: 'fart+laugh', f0: 115, dur: 0.55, gap: 0.40, laugh: 1.3, pad: 0.5,
    expect: 'admissible', expectDur: 0.55 },
  { name: 'THE REAL CASE fart then laughter, tight 0.15s gap',
    kind: 'fart+laugh', f0: 115, dur: 0.55, gap: 0.15, laugh: 1.1, pad: 0.5,
    expect: 'admissible' },

  /* Reproduced, not produced. Same synthesis as the genuine article, then
     routed through filters that mimic what a phone speaker physically does
     to it: no fundamental, and a codec cliff up top. */
  { name: 'REPLAY fart through a phone speaker (highpass 450Hz + 16k cut)',
    kind: 'fart', f0: 110, dur: 0.6, pad: 0.8, speaker: 'phone', expect: 'reproduced' },
  { name: 'REPLAY fart through a laptop speaker (highpass 300Hz)',
    kind: 'fart', f0: 130, dur: 0.5, pad: 0.8, speaker: 'laptop', expect: 'reproduced' },
  { name: 'CONTROL same fart, no speaker in the path (must stay admissible)',
    kind: 'fart', f0: 110, dur: 0.6, pad: 0.8, expect: 'admissible' }
];

(async () => {
  // Use whatever chromium this machine already has; do not download one.
  const fs = require('fs');
  const candidates = (fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers') : [])
    .filter(d => /^chromium-\d+$/.test(d))
    .map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`)
    .filter(p => fs.existsSync(p));
  const launchOpts = {
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio',
           '--disable-features=AudioServiceOutOfProcess']
  };
  if (candidates.length) launchOpts.executablePath = candidates[0];
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(PAGE);

  const results = [];
  for (const c of CASES) {
    const r = await page.evaluate(async (c) => {
      const SR = 48000;
      const total = c.pad * 2 + c.dur +
                    (c.kind === 'fart+laugh' ? (c.gap + c.laugh) : 0);
      const ctx = new AudioContext({ sampleRate: SR });
      const buf = ctx.createBuffer(1, Math.ceil(total * SR), SR);
      const d = buf.getChannelData(0);
      const start = Math.floor(c.pad * SR);
      const n = Math.floor(c.dur * SR);

      // a little room noise everywhere, so the floor is realistic
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.0018;

      const env = (i) => {           // fast attack, exponential decay
        const x = i / n;
        return Math.min(1, x * 40) * Math.exp(-2.4 * x);
      };

      if (c.kind === 'fart' || c.kind === 'rumble') {
        for (let i = 0; i < n; i++) {
          const t = i / SR;
          // buzzy: fundamental plus strong low harmonics, slight pitch drop
          const f = c.f0 * (1 - 0.18 * (i / n));
          let v = 0;
          for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * f * h * t) / (h * 1.15);
          v += (Math.random() * 2 - 1) * 0.18;              // breath
          let e = c.kind === 'rumble'
            ? (0.75 + 0.25 * Math.sin(2 * Math.PI * 1.5 * t))  // shallow slow tremolo
            : env(i);
          d[start + i] += v * 0.34 * e;
        }
      }

      if (c.kind === 'speech' || c.kind === 'counting') {
        const rate = c.kind === 'counting' ? 2.0 : 4.0;   // syllables per second
        const F = [700, 1220, 2600];
        for (let i = 0; i < n; i++) {
          const t = i / SR;
          const ph = (t * rate) % 1;
          // syllable envelope: clear rise and fall, real dip between syllables
          const syl = Math.max(0, Math.sin(Math.PI * Math.min(1, ph / 0.72)));
          const f0 = 125 + 18 * Math.sin(2 * Math.PI * 0.7 * t);
          let v = 0;
          for (let h = 1; h <= 14; h++) v += Math.sin(2 * Math.PI * f0 * h * t) / (h * 1.6);
          let form = 0;
          for (const fk of F) form += Math.sin(2 * Math.PI * fk * t) * 0.42;
          v = v * 0.5 + form * syl;
          // fricatives: high-band noise on two syllables
          const idx = Math.floor(t * rate);
          if (idx % 2 === 1 && ph > 0.55) {
            let hn = 0;
            for (let k = 0; k < 3; k++) hn += (Math.random() * 2 - 1);
            v += hn * 0.55;                                  // broadband hiss
          }
          d[start + i] += v * 0.20 * syl;
        }
      }

      if (c.kind === 'fart+laugh') {
        // the emission
        for (let i = 0; i < n; i++) {
          const t = i / SR, f = c.f0 * (1 - 0.18 * (i / n));
          let v = 0;
          for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * f * h * t) / (h * 1.15);
          v += (Math.random() * 2 - 1) * 0.18;
          d[start + i] += v * 0.38 * env(i);          // close to the microphone
        }
        // then the reaction, quieter and further away
        const ls = start + n + Math.floor(c.gap * SR);
        const ln = Math.floor(c.laugh * SR);
        const rate = 3.0, F = [730, 1090, 2440];
        for (let i = 0; i < ln && ls + i < d.length; i++) {
          const t = i / SR, ph = (t * rate) % 1;
          const syl = Math.max(0, Math.sin(Math.PI * Math.min(1, ph / 0.55)));
          const f0 = 210 + 25 * Math.sin(2 * Math.PI * 1.1 * t);
          let v = 0;
          for (let h = 1; h <= 12; h++) v += Math.sin(2 * Math.PI * f0 * h * t) / (h * 1.7);
          let form = 0;
          for (const fk of F) form += Math.sin(2 * Math.PI * fk * t) * 0.40;
          v = v * 0.5 + form + (Math.random() * 2 - 1) * 0.30;
          d[ls + i] += v * 0.13 * syl;
        }
      }

      if (c.kind === 'staccato') {
        const bursts = 4, per = n / bursts, on = per * 0.42;
        for (let b = 0; b < bursts; b++) {
          for (let i = 0; i < on; i++) {
            const t = i / SR;
            const f = c.f0 * (1 - 0.15 * (i / on));
            let v = 0;
            for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * f * h * t) / (h * 1.15);
            v += (Math.random() * 2 - 1) * 0.18;
            const e = Math.min(1, (i / on) * 30) * Math.exp(-3.0 * (i / on));
            d[start + Math.floor(b * per) + i] += v * 0.34 * e;
          }
        }
      }

      if (c.kind === 'wet') {
        for (let i = 0; i < n; i++) {
          const t = i / SR, f = c.f0 * (1 - 0.2 * (i / n));
          let v = 0;
          for (let h = 1; h <= 5; h++) v += Math.sin(2 * Math.PI * f * h * t) / (h * 1.2);
          v += (Math.random() * 2 - 1) * 0.85;          // a lot of splatter
          d[start + i] += v * 0.30 * env(i);
        }
      }

      if (c.kind === 'cough') {
        for (let i = 0; i < n; i++) {
          const x = i / n;
          let v = (Math.random() * 2 - 1) * 0.8;
          v += Math.sin(2 * Math.PI * 180 * (i / SR)) * 0.5;
          d[start + i] += v * 0.34 * Math.min(1, x * 60) * Math.exp(-5 * x);
        }
      }

      if (c.kind === 'laugh') {
        const rate = 3.0, F = [730, 1090, 2440];
        for (let i = 0; i < n; i++) {
          const t = i / SR, ph = (t * rate) % 1;
          const syl = Math.max(0, Math.sin(Math.PI * Math.min(1, ph / 0.55)));
          const f0 = 210 + 25 * Math.sin(2 * Math.PI * 1.1 * t);
          let v = 0;
          for (let h = 1; h <= 12; h++) v += Math.sin(2 * Math.PI * f0 * h * t) / (h * 1.7);
          let form = 0;
          for (const fk of F) form += Math.sin(2 * Math.PI * fk * t) * 0.40;
          v = v * 0.5 + form;
          v += (Math.random() * 2 - 1) * 0.30;          // breathy
          d[start + i] += v * 0.22 * syl;
        }
      }

      if (c.kind === 'whistle') {
        for (let i = 0; i < n; i++) {
          const t = i / SR;
          d[start + i] += Math.sin(2 * Math.PI * 2000 * t) * 0.3 *
                          Math.min(1, (i / n) * 12) * Math.min(1, (1 - i / n) * 12);
        }
      }

      // Same graph the recorder builds.
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const mute = ctx.createGain();
      mute.gain.value = 0;

      // Optionally interpose what a small loudspeaker physically does.
      let tail = src;
      if (c.speaker) {
        const corner = c.speaker === 'phone' ? 450 : 300;
        const h1 = ctx.createBiquadFilter();
        h1.type = 'highpass'; h1.frequency.value = corner; h1.Q.value = 0.7;
        const h2 = ctx.createBiquadFilter();
        h2.type = 'highpass'; h2.frequency.value = corner; h2.Q.value = 0.7;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 15800; lp.Q.value = 0.7;
        const boost = ctx.createGain(); boost.gain.value = 3.0;  // replay is loud
        tail.connect(h1); h1.connect(h2); h2.connect(lp); lp.connect(boost);
        tail = boost;
      }
      tail.connect(an);
      an.connect(mute);
      mute.connect(ctx.destination);

      const fr = [];
      src.start();
      const t0 = performance.now();
      await new Promise(res => {
        const tick = () => {
          const f = readFrame(an, ctx.sampleRate);   // the page's own extractor
          f.t = performance.now();
          fr.push(f);
          if (performance.now() - t0 >= total * 1000) return res();
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await ctx.close();

      // The page's own single entry point — exactly what stopRecording calls.
      const r = analyseCapture(fr);
      return {
        verdict: r.verdict === 'unvoiced' ? 'nospan' : r.verdict,
        metrics: r.metrics, events: r.events,
        soundedDur: r.dur, wallDur: total, frames: fr.length,
        interval: frameInterval(fr)
      };
    }, c);
    results.push({ c, r });
  }

  await browser.close();

  // ---- report -------------------------------------------------------------
  let fails = 0;
  console.log('\nADMISSIBILITY GATE\n');
  for (const { c, r } of results) {
    const ok = r.verdict === c.expect;
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
    console.log(`        expected ${c.expect}, got ${r.verdict}`);
    if (r.metrics) {
      const m = r.metrics;
      console.log(`        hfr=${m.hfr.toFixed(3)} zcr=${m.zcr.toFixed(3)} ` +
                  `lowr=${m.lowr.toFixed(3)} fund=${m.fund.toFixed(3)} ` +
                  `cliff=${m.cliff.toFixed(3)} peak=${Math.round(m.peakHz)}Hz`);
      console.log(`        onsets=${m.onsets} rate=${m.rate.toFixed(1)}/s ` +
                  `speechScore=${m.speech} emissionLike=${m.emissionLike} ` +
                  `events=${r.events}`);
    }
  }

  console.log('\nSOUNDED DURATION  (the fix: report the sound, not the button press)\n');
  for (const { c, r } of results) {
    if (c.expectDur == null || r.soundedDur == null) continue;
    const err = Math.abs(r.soundedDur - c.expectDur);
    const ok = err <= 0.14;
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
    console.log(`        sound ${c.expectDur.toFixed(2)}s in a ${r.wallDur.toFixed(2)}s recording ` +
                `-> reported ${r.soundedDur.toFixed(2)}s (err ${err.toFixed(3)}s), ` +
                `frame interval ${r.interval.toFixed(1)}ms`);
  }

  if (errors.length) { console.log('\nPAGE ERRORS:'); errors.forEach(e => console.log('  ' + e)); fails++; }
  console.log(fails ? `\n${fails} FAILURE(S)\n` : '\nALL PASS\n');
  process.exit(fails ? 1 : 0);
})();
