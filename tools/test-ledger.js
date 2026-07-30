/* ===========================================================================
   test-ledger.js — The Ledger: backfill, simulated-exclusion, manual entry,
   CSV round-trip (RFC 4180), auto-log on commit, reading-page line.
   Run:  node tools/test-ledger.js
   =========================================================================== */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0;
const ok = (name, cond, extra='') => { console.log((cond?'PASS  ':'FAIL  ')+name+(extra?'  '+extra:'')); if(!cond) fails++; };

(async () => {
  const cands = (fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers') : [])
    .filter(d => /^chromium-\d+$/.test(d)).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).filter(p => fs.existsSync(p));
  const opts = { args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] };
  if (cands.length) opts.executablePath = cands[0];
  const browser = await chromium.launch(opts);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(PAGE);

  // ---- A. backfill maps only non-simulated readings, once ----
  await page.evaluate(() => {
    S.readings.length = 0; S.ledger.length = 0; S.ledgerBackfilled = false;
    const now = Date.now();
    S.readings.push({ t: now-1000, simulated:true,  dur:"2.0", level:"0.30", peak:100, region:"Rhineland" });
    S.readings.push({ t: now-500,  simulated:false, dur:"1.4", level:"0.31", peak:142, region:"Rhineland" });
    save();
  });
  await page.evaluate(() => { location.hash = '#/ledger'; });
  await page.waitForTimeout(120);
  const A = await page.evaluate(() => ({
    month: document.getElementById('ledgerMonth').textContent,
    rows: document.querySelectorAll('#ledgerEntries .led-row').length,
    flag: S.ledgerBackfilled, len: S.ledger.length,
    src: S.ledger[0] && S.ledger[0].src, peak: S.ledger[0] && S.ledger[0].peak
  }));
  ok('backfill excludes simulated (1 entry)', A.len===1 && A.rows===1 && A.month==='1', JSON.stringify(A));
  ok('backfilled entry is recorded with numeric peak', A.src==='recorded' && A.peak===142);
  // run again — flag prevents duplication
  const A2 = await page.evaluate(() => { renderLedger(); return S.ledger.length; });
  ok('backfill idempotent (still 1)', A2===1, 'len='+A2);

  // ---- B. manual entry with comma+quote note ----
  await page.evaluate(() => {
    document.querySelector('input[name="ledgerInt"][value="3"]').checked = true;
    document.querySelector('.ledger-tag[value="dairy"]').checked = true;
    document.getElementById('ledgerNote').value = 'ate a, "b" and c';
    document.getElementById('ledgerAddBtn').click();
  });
  await page.waitForTimeout(60);
  const B = await page.evaluate(() => {
    const e = S.ledger.find(x=>x.src==='manual');
    return { rows: document.querySelectorAll('#ledgerEntries .led-row').length, len: S.ledger.length,
      intensity: e&&e.intensity, tags: e&&e.tags.join(','), note: e&&e.note,
      today: document.getElementById('ledgerToday').textContent };
  });
  ok('manual entry added', B.len===2 && B.rows===2, JSON.stringify(B));
  ok('manual carries intensity+tags+note', B.intensity===3 && B.tags==='dairy' && B.note==='ate a, "b" and c');
  ok('today count = 2', B.today==='2');

  // ---- C. CSV round-trips per RFC 4180 ----
  const csv = await page.evaluate(() => ledgerCSVString());
  const lines = csv.split('\r\n');
  ok('CSV header exact', lines[0]==='date,time,source,duration_s,level_rms,peak_hz,intensity_1to5,tags,note', lines[0]);
  ok('CSV has 2 data rows', lines.length===3, 'lines='+lines.length);
  ok('CSV escapes comma+quote note', csv.includes('"ate a, ""b"" and c"'));
  ok('CSV recorded row has measurements', /,recorded,1.4,0.31,142,,/.test(csv));

  // ---- D. auto-log on commit (non-sim yes, sim no) + reading-page line ----
  const D = await page.evaluate(() => {
    S.readings.length=0; S.ledger.length=0; S.ledgerBackfilled=true; save();
    current=null; commit(interpret({dur:1.4,rms:0.31,peak:142,sig:[0.2,0.3,0.1,0.05],simulated:false},0));
    const afterReal = S.ledger.length;
    const realLine = document.getElementById('readingSlot').innerHTML.includes('your Ledger');
    current=null; commit(interpret({dur:1.0,rms:0.30,peak:100,sig:[0.2,0.2,0.1],simulated:true},0));
    const afterSim = S.ledger.length;
    const simLine = document.getElementById('readingSlot').innerHTML.includes('your Ledger');
    return { afterReal, afterSim, realLine, simLine };
  });
  ok('commit auto-logs a real reading', D.afterReal===1 && D.realLine===true, JSON.stringify(D));
  ok('commit skips a simulated reading', D.afterSim===1 && D.simLine===false, JSON.stringify(D));

  // ---- E. erase (Privacy) clears the ledger, and DEF stays pristine ----
  const E = await page.evaluate(() => {
    S.readings.length=0; S.ledger.length=0;
    S.ledger.push({t:Date.now(),src:"manual",dur:null,level:null,peak:null,intensity:2,tags:[],note:""});
    save();
    S = freshState(); save();                    // the real erase path
    return { cleared: S.ledger.length===0 && S.readings.length===0 && S.ledgerBackfilled===false,
             notShared: S.ledger !== DEF.ledger, defLen: DEF.ledger.length };
  });
  ok('erase clears ledger; fresh arrays; DEF pristine', E.cleared && E.notShared && E.defLen===0, JSON.stringify(E));

  await browser.close();
  if (errors.length) { console.log('\nPAGE ERRORS:'); errors.forEach(e=>console.log('  '+e)); fails++; }
  console.log(fails ? `\n${fails} FAILURE(S)\n` : '\nALL PASS\n');
  process.exit(fails ? 1 : 0);
})();
