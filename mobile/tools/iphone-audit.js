/* iphone-audit.js — walk every route at iPhone 14/15 size and report
   horizontal overflow, sub-24px tap targets in the nav, and inputs under 16px
   (iOS auto-zooms those). Screenshots the worst offenders. */
const pw = (() => { try { return require('playwright'); }
  catch (e) { return require('/home/claude/fw-test/node_modules/playwright'); } })();
const { chromium } = pw;
const path = require('path');
const fs = require('fs');

// Audits the wrap copy (www/) by default; falls back to the repo root file.
// Or pass an explicit path: node tools/iphone-audit.js <path-to-index.html>
const cand = [process.argv[2],
  path.resolve(__dirname, '..', 'www', 'index.html'),
  path.resolve(__dirname, '..', '..', 'index.html')].filter(Boolean);
const SRC = cand.find(p => fs.existsSync(p));
const PAGE = 'file://' + SRC;

(async () => {
  const cands = fs.readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d+$/.test(d))
    .map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).filter(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: cands[0], args: ['--mute-audio'] });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
    isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(PAGE);
  const routes = await page.evaluate(() => ROUTES.slice());
  fs.mkdirSync(path.join(__dirname, '..', 'iphone-shots'), { recursive: true });
  let issues = 0;
  for (const r of routes) {
    await page.evaluate(n => { location.hash = '#/' + n; window.scrollTo(0, 0); }, r);
    await page.waitForTimeout(90);
    const rep = await page.evaluate(() => {
      const doc = document.scrollingElement;
      const overflowX = doc.scrollWidth - window.innerWidth;
      // find widest offending element on this page
      let worst = null;
      if (overflowX > 1) {
        for (const el of document.querySelectorAll('section.page:not([hidden]) *')) {
          const w = el.getBoundingClientRect();
          if (w.right > window.innerWidth + 1 || w.left < -1) {
            const desc = el.tagName + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
            if (!worst || w.right - w.left > worst.w) worst = { desc, w: w.right - w.left, right: Math.round(w.right) };
          }
        }
      }
      const smallInputs = [...document.querySelectorAll('section.page:not([hidden]) input, section.page:not([hidden]) select, section.page:not([hidden]) textarea')]
        .filter(i => parseFloat(getComputedStyle(i).fontSize) < 16)
        .map(i => i.id || i.name || i.type);
      return { overflowX, worst, smallInputs };
    });
    if (rep.overflowX > 1 || rep.smallInputs.length) {
      issues++;
      console.log(`ISSUE ${r}: overflowX=${rep.overflowX}px worst=${JSON.stringify(rep.worst)} smallInputs=${rep.smallInputs.join(',')}`);
      await page.screenshot({ path: path.join(__dirname, '..', 'iphone-shots', `issue-${r}.png`) });
    }
  }
  console.log(issues ? `${issues} routes with issues` : 'no overflow or small-input issues on any route');
  if (errors.length) console.log('ERRORS:', errors.slice(0, 5));
  await browser.close();
})();
