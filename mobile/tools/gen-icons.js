/* gen-icons.js — render the launcher icon + splash from the app's own visual
   identity: Georgia serif F on Bureau paper, inside a double-rule seal.
   Extends the favicon already shipped in index.html; nothing new invented. */
const { chromium } = require(require("path").join("/home/claude/fw-test", "node_modules", "playwright"));
const fs = require("fs");

const seal = (size, pad) => `<!doctype html><meta charset="utf-8">
<body style="margin:0"><div id="a" style="width:${size}px;height:${size}px;background:#F7F5F0;position:relative">
<svg viewBox="0 0 1024 1024" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#F7F5F0"/>
  <circle cx="512" cy="512" r="${430 - pad}" fill="none" stroke="#16150F" stroke-width="10"/>
  <circle cx="512" cy="512" r="${400 - pad}" fill="none" stroke="#16150F" stroke-width="3"/>
  <text x="512" y="512" text-anchor="middle" dominant-baseline="central" dy="${Math.round(pad*0.02)}"
        font-family="Georgia, 'Times New Roman', serif" font-size="${470 - pad}" fill="#16150F">F</text>
</svg></div></body>`;

const splash = (w, h) => `<!doctype html><meta charset="utf-8">
<body style="margin:0"><div style="width:${w}px;height:${h}px;background:#F7F5F0;display:flex;align-items:center;justify-content:center">
<svg viewBox="0 0 1024 1024" width="480" height="480" xmlns="http://www.w3.org/2000/svg">
  <circle cx="512" cy="512" r="430" fill="none" stroke="#16150F" stroke-width="10"/>
  <circle cx="512" cy="512" r="400" fill="none" stroke="#16150F" stroke-width="3"/>
  <text x="512" y="512" text-anchor="middle" dominant-baseline="central"
        font-family="Georgia, 'Times New Roman', serif" font-size="470" fill="#16150F">F</text>
</svg></div></body>`;

(async () => {
  const cands = fs.readdirSync("/opt/pw-browsers").filter(d => /^chromium-\d+$/.test(d))
    .map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).filter(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: cands[0] });
  const shoot = async (html, w, h, out) => {
    const pg = await browser.newPage({ viewport: { width: w, height: h } });
    await pg.setContent(html); await pg.waitForTimeout(150);
    await pg.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
    await pg.close(); console.log("wrote", out);
  };
  fs.mkdirSync("assets", { recursive: true });
  await shoot(seal(1024, 0), 1024, 1024, "assets/icon-only.png");
  // Adaptive foreground gets extra padding (Android crops ~2/3 center circle).
  await shoot(seal(1024, 190), 1024, 1024, "assets/icon-foreground.png");
  await shoot(`<!doctype html><body style="margin:0"><div style="width:1024px;height:1024px;background:#F7F5F0"></div></body>`,
    1024, 1024, "assets/icon-background.png");
  await shoot(splash(2732, 2732), 2732, 2732, "assets/splash.png");
  await shoot(splash(2732, 2732), 2732, 2732, "assets/splash-dark.png");
  await browser.close();
})();
