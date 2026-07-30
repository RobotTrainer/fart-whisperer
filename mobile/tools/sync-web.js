#!/usr/bin/env node
/*
 * sync-web.js — derive the mobile wrap's www/index.html from the canonical
 * single-file app, WITHOUT forking it.
 *
 * The one-file index.html at the repo root stays the single source of truth
 * (the copy is canon; the file is the app). This script copies it into
 * www/ byte-for-byte and appends ONE additive <script> — the native shim —
 * just before </body>. The shim never touches the engine, the seed, the
 * readings, or any copy. It only:
 *
 *   1. Pads the page for Android 15+/16 edge-to-edge (safe-area insets),
 *      a no-op everywhere else (env() resolves to 0 on the open web).
 *   2. Adds haptic ticks on the analysis-theater stage lines and a small
 *      pattern when a reading commits, via navigator.vibrate — observed
 *      from OUTSIDE the app code (MutationObserver + hashchange), so the
 *      app file itself remains identical to canon. Skipped when the user
 *      prefers reduced motion.
 *
 * Usage: node tools/sync-web.js [path-to-canonical-index.html]
 * Default source: ../index.html relative to this project folder
 * (i.e. the repo root, when fw-mobile lives inside the fart-whisperer repo).
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const src = process.argv[2] || path.join(projectRoot, "..", "index.html");
const dst = path.join(projectRoot, "www", "index.html");

const SHIM = `
<script id="fw-native-shim">
/* Native shim — mobile wrap only. Additive; the app above is canon-identical. */
(function(){
  "use strict";
  try{
    /* 1 · Edge-to-edge safe areas (Android 15+ enforces drawing behind bars). */
    var st = document.createElement("style");
    st.textContent = "html{background:#F7F5F0}" +
      "body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);" +
      "padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}";
    document.head.appendChild(st);

    /* 2 · Haptic beats on the analysis theater. Deterministic — driven by the
       same stage timeline the app already runs. No engine contact. */
    var canBuzz = typeof navigator.vibrate === "function" &&
      !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    if(canBuzz){
      var stage = document.getElementById("analStage");
      if(stage){
        new MutationObserver(function(){
          if(stage.textContent && !stage.hidden) navigator.vibrate(12);
        }).observe(stage, {childList:true, characterData:true, subtree:true});
      }
      var lastHash = location.hash;
      window.addEventListener("hashchange", function(){
        /* A fresh arrival on the reading page is the reading landing. */
        if(location.hash.indexOf("reading") !== -1 && lastHash.indexOf("reading") === -1){
          navigator.vibrate([12,60,24]);
        }
        lastHash = location.hash;
      });
    }
  }catch(e){ /* the shim must never be able to break the app */ }
})();
</script>
`;

let html = fs.readFileSync(src, "utf8");
if (html.indexOf("fw-native-shim") !== -1) {
  console.error("Source already contains the shim — refusing to double-inject.");
  process.exit(1);
}
const marker = "</body>";
const at = html.lastIndexOf(marker);
if (at === -1) { console.error("No </body> found in source."); process.exit(1); }
html = html.slice(0, at) + SHIM + html.slice(at);
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, html);
console.log("Wrote", dst, "(" + html.length + " bytes) from", src);
