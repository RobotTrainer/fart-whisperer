/* ===========================================================================
   test-smoke.js — walk every route, run the simulated-sample flow end to end,
   confirm exactly one visible page at a time and zero console/page errors.
   Guards against collateral damage from recorder changes.

   Run:  node tools/test-smoke.js
   =========================================================================== */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  const cands = (fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers') : [])
    .filter(d => /^chromium-\d+$/.test(d))
    .map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`)
    .filter(p => fs.existsSync(p));
  const opts = { args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] };
  if (cands.length) opts.executablePath = cands[0];

  const browser = await chromium.launch(opts);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(PAGE);

  let fails = 0;
  const routes = await page.evaluate(() => ROUTES.slice());
  console.log(`\nROUTES (${routes.length})\n`);
  for (const r of routes) {
    await page.evaluate(n => { location.hash = '#/' + n; }, r);
    await page.waitForTimeout(70);
    const vis = await page.evaluate(() =>
      [...document.querySelectorAll('section.page')]
        .filter(s => getComputedStyle(s).display !== 'none').map(s => s.id));
    const ok = vis.length === 1;
    if (!ok) { fails++; console.log(`FAIL  ${r} -> ${vis.length} visible: ${vis.join(', ')}`); }
  }
  if (!fails) console.log(`  all ${routes.length} routes render exactly one page`);

  // simulated sample: full record -> reading flow, incl. the new gate bypass
  console.log('\nSIMULATED SAMPLE FLOW\n');
  await page.evaluate(() => { location.hash = '#/record'; });
  await page.waitForTimeout(100);
  await page.click('#simBtn');
  await page.waitForTimeout(9500);
  const reading = await page.evaluate(() => {
    const t = document.querySelector('#readingSlot .reading-body');
    const h = document.querySelector('#readingSlot .reading-h');
    return { text: t && t.textContent, head: h && h.textContent, hash: location.hash };
  });
  const flowOk = reading.hash === '#/reading' && /:$/.test((reading.text || '').trim());
  if (!flowOk) { fails++; console.log('FAIL  simulated flow', JSON.stringify(reading)); }
  else console.log(`  reading rendered, ends with a colon\n  head: ${reading.head}`);

  // the date/time on the card
  const hasDate = /\d{4}/.test(reading.head || '');
  if (!hasDate) { fails++; console.log('FAIL  no year in the reading header'); }
  else console.log('  header carries a date');

  // share card draws without throwing
  const shareOk = await page.evaluate(() => {
    try { const c = document.getElementById('shareCanvas'); shareCard();
          return c.width === 1200 && c.height === 630; } catch (e) { return 'threw: ' + e.message; }
  });
  if (shareOk !== true) { fails++; console.log('FAIL  share card', shareOk); }
  else console.log('  share card renders');

  // the new helpers exist and are callable
  const helpers = await page.evaluate(() => ({
    readFrame: typeof readFrame, soundedSpan: typeof soundedSpan,
    admissibility: typeof admissibility, countOnsets: typeof countOnsets,
    frameInterval: typeof frameInterval, clearAdmit: typeof clearAdmit
  }));
  const missing = Object.entries(helpers).filter(([, v]) => v !== 'function').map(([k]) => k);
  if (missing.length) { fails++; console.log('FAIL  not functions: ' + missing.join(', ')); }
  else console.log('  gate helpers all present');

  await browser.close();
  if (errors.length) { console.log('\nPAGE ERRORS:'); errors.forEach(e => console.log('  ' + e)); fails++; }
  console.log(fails ? `\n${fails} FAILURE(S)\n` : '\nALL PASS\n');
  process.exit(fails ? 1 : 0);
})();
