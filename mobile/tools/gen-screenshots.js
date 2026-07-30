/* gen-screenshots.js — Play Store phone screenshots (1080x2400) straight from
   the app that ships, plus the 512 icon and 1024x500 feature graphic. */
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join("/home/claude/fw-test", "node_modules", "playwright"));

(async () => {
  const cands = fs.readdirSync("/opt/pw-browsers").filter(d => /^chromium-\d+$/.test(d))
    .map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).filter(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: cands[0], args: ["--mute-audio"] });
  const ctx = await browser.newContext({ viewport: { width: 432, height: 960 }, deviceScaleFactor: 2.5 });
  const page = await ctx.newPage();
  const url = "file://" + path.resolve(__dirname, "..", "www", "index.html");
  await page.goto(url);
  fs.mkdirSync(path.join(__dirname, "..", "store", "screenshots"), { recursive: true });
  const out = n => path.join(__dirname, "..", "store", "screenshots", n);

  const shot = async (hash, name, wait = 400) => {
    if (hash) await page.evaluate(h => { location.hash = h; }, hash);
    await page.waitForTimeout(wait);
    await page.screenshot({ path: out(name) });
    console.log("wrote", name);
  };

  await shot(null, "01-home.png", 800);
  await shot("#/record", "02-record.png");

  // Real flow: simulated sample -> analysis theater -> reading.
  await page.click("#simBtn");
  await page.waitForTimeout(4500);
  await page.screenshot({ path: out("03-analysis.png") });
  console.log("wrote 03-analysis.png");
  await page.waitForFunction(() => location.hash.includes("reading"), { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: out("04-reading.png") });
  console.log("wrote 04-reading.png");

  await shot("#/heritage", "05-heritage.png");
  await shot("#/journal", "06-journal.png");
  await shot("#/architecture", "07-architecture.png");
  await shot("#/accessibility", "08-accessibility.png");

  // 512 icon
  const iconPage = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await iconPage.setContent(`<body style="margin:0"><img src="file://${path.resolve(__dirname, "..", "assets", "icon-only.png")}" width="512" height="512"></body>`);
  await iconPage.waitForTimeout(200);
  await iconPage.screenshot({ path: path.join(__dirname, "..", "store", "icon-512.png") });
  console.log("wrote icon-512.png");

  // Feature graphic 1024x500 — Bureau paper, seal left, wordmark right.
  const fg = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await fg.setContent(`<body style="margin:0">
    <div style="width:1024px;height:500px;background:#F7F5F0;display:flex;align-items:center;justify-content:center;gap:48px;font-family:Georgia,serif;color:#16150F">
      <svg viewBox="0 0 1024 1024" width="340" height="340"><circle cx="512" cy="512" r="430" fill="none" stroke="#16150F" stroke-width="10"/><circle cx="512" cy="512" r="400" fill="none" stroke="#16150F" stroke-width="3"/><text x="512" y="512" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="470" fill="#16150F">F</text></svg>
      <div>
        <div style="font-size:52px;letter-spacing:.02em">The Fart Whisperer</div>
        <div style="font-size:22px;margin-top:14px;letter-spacing:.14em;text-transform:uppercase;color:#4a463c">Flatulinguistic Analysis and Interpretation</div>
        <div style="font-size:19px;margin-top:26px;font-style:italic;color:#4a463c">A reading in under ninety seconds.</div>
      </div>
    </div></body>`);
  await fg.waitForTimeout(200);
  await fg.screenshot({ path: path.join(__dirname, "..", "store", "feature-graphic.png") });
  console.log("wrote feature-graphic.png");

  await browser.close();
})();
