#!/usr/bin/env python3
"""
engrave.py — turn a scanned engraving (or an AI raster) into clean ink SVG.

Built for the Word Hoard suite: takes a page photograph or plate scan and
returns a single-colour, transparent-ground, web-ready SVG in the house ink.

    python3 engrave.py plate.png --out cherub.svg --ink "#4a3c2c"
    python3 engrave.py book.pdf --page 61 --dpi 600 --crop 0.1,0.2,0.5,0.6

Stages: extract -> crop -> flatten illumination -> threshold -> despeckle
        -> potrace -> recolour/strip paper -> svgo -> report.

Requires: potrace, svgo, pdftoppm (for PDFs), Pillow, numpy, opencv.
"""
import argparse, os, re, shutil, subprocess, sys, tempfile
import numpy as np
import cv2


def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def pdf_page(pdf, page, dpi, tmp):
    stem = os.path.join(tmp, "page")
    sh(["pdftoppm", "-r", str(dpi), "-f", str(page), "-l", str(page),
        "-png", "-singlefile", pdf, stem])
    return stem + ".png"


def parse_crop(spec, w, h):
    v = [float(x) for x in spec.split(",")]
    if len(v) != 4:
        raise SystemExit("--crop needs x,y,w,h")
    if max(v) <= 1.0:                       # fractional
        v = [v[0] * w, v[1] * h, v[2] * w, v[3] * h]
    x, y, cw, ch = (int(round(n)) for n in v)
    return max(0, x), max(0, y), min(cw, w - x), min(ch, h - y)


def flatten(gray, radius):
    """Divide out slow illumination/paper tone so old scans threshold evenly."""
    k = max(3, radius | 1)
    bg = cv2.GaussianBlur(gray, (k, k), 0)
    out = cv2.divide(gray, bg, scale=255)
    return out


def despeckle(binary, min_area):
    """Drop connected ink blobs smaller than min_area px (scan dust)."""
    inv = (binary == 0).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv, connectivity=8)
    keep = np.ones(n, dtype=bool)
    keep[0] = False
    removed = 0
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < min_area:
            keep[i] = False
            removed += 1
    mask = keep[lab]
    out = np.full(binary.shape, 255, np.uint8)
    out[mask] = 0
    return out, removed


def strip_paper_and_colour(svg_text, ink, keep_bg):
    """potrace emits the whole plate as filled paths; recolour and, unless told
    otherwise, drop the single largest path when it is the paper rectangle."""
    svg_text = re.sub(r'\sfill="[^"]*"', "", svg_text)
    svg_text = re.sub(r"<g([^>]*)>", r'<g\1 fill="%s">' % ink, svg_text, count=1)
    if not keep_bg:
        # potrace's first path is the outer boundary when the scan has a border
        paths = re.findall(r"<path[^>]*?/>", svg_text)
        if paths and len(paths) > 1:
            first = paths[0]
            d = re.search(r'd="([^"]*)"', first)
            if d and len(d.group(1)) < 400 and d.group(1).count("C") <= 2:
                svg_text = svg_text.replace(first, "", 1)
    return svg_text


def main():
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("--out", default="out.svg")
    p.add_argument("--page", type=int, help="page number if input is a PDF")
    p.add_argument("--dpi", type=int, default=600)
    p.add_argument("--crop", help="x,y,w,h in pixels or 0-1 fractions")
    p.add_argument("--ink", default="#4a3c2c")
    p.add_argument("--threshold", default="auto", help="'auto' (Otsu) or 0-255")
    p.add_argument("--flatten", type=int, default=101,
                   help="illumination-flattening radius; 0 disables")
    p.add_argument("--despeckle", type=int, default=60,
                   help="drop ink blobs under this many px")
    p.add_argument("--turdsize", type=int, default=4, help="potrace speck filter")
    p.add_argument("--alphamax", type=float, default=1.0, help="potrace corner smoothing")
    p.add_argument("--opttolerance", type=float, default=0.2)
    p.add_argument("--invert", action="store_true", help="source is white-on-black")
    p.add_argument("--keep-bg", action="store_true")
    p.add_argument("--preview", help="also write a PNG preview of the result")
    a = p.parse_args()

    for exe in ("potrace",):
        if not shutil.which(exe):
            raise SystemExit(f"missing required tool: {exe}")

    tmp = tempfile.mkdtemp(prefix="engrave_")
    src = a.input
    if src.lower().endswith(".pdf"):
        if not a.page:
            raise SystemExit("--page is required for a PDF")
        src = pdf_page(src, a.page, a.dpi, tmp)
        print(f"  extracted page {a.page} at {a.dpi} dpi")

    img = cv2.imread(src, cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f"could not read {src}")
    h, w = img.shape[:2]
    print(f"  source {w}x{h}")

    if a.crop:
        x, y, cw, ch = parse_crop(a.crop, w, h)
        img = img[y:y + ch, x:x + cw]
        print(f"  cropped to {cw}x{ch} at ({x},{y})")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if a.invert:
        gray = 255 - gray
    if a.flatten:
        gray = flatten(gray, a.flatten)
        print(f"  illumination flattened (r={a.flatten})")

    if a.threshold == "auto":
        t, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        print(f"  Otsu threshold {int(t)}")
    else:
        t = int(a.threshold)
        _, binary = cv2.threshold(gray, t, 255, cv2.THRESH_BINARY)
        print(f"  fixed threshold {t}")

    ink_pct = 100.0 * (binary == 0).sum() / binary.size
    print(f"  ink coverage {ink_pct:.1f}%")
    if ink_pct > 60:
        print("  ! more than 60% ink — the source may be inverted; try --invert")

    if a.despeckle:
        binary, removed = despeckle(binary, a.despeckle)
        print(f"  despeckled: {removed} blobs removed")

    pbm = os.path.join(tmp, "in.pbm")
    cv2.imwrite(pbm, binary)

    raw = os.path.join(tmp, "raw.svg")
    sh(["potrace", pbm, "-s", "-o", raw,
        "-t", str(a.turdsize), "-a", str(a.alphamax),
        "-O", str(a.opttolerance), "--flat"])

    text = open(raw, encoding="utf-8").read()
    text = strip_paper_and_colour(text, a.ink, a.keep_bg)
    open(a.out, "w", encoding="utf-8").write(text)

    if shutil.which("svgo"):
        before = os.path.getsize(a.out)
        sh(["svgo", "-i", a.out, "-o", a.out, "-p", "2", "--multipass"])
        after = os.path.getsize(a.out)
        print(f"  svgo {before/1024:.0f} KB -> {after/1024:.0f} KB")

    final = open(a.out, encoding="utf-8").read()
    nodes = len(re.findall(r"[cCsSlLqQ]", final))
    print(f"  paths {final.count('<path')}  subpaths {len(re.findall(r'[mM]', final))}  curve nodes ~{nodes}")
    print(f"  wrote {a.out} ({os.path.getsize(a.out)/1024:.0f} KB)")

    if a.preview:
        cv2.imwrite(a.preview, binary)
        print(f"  wrote {a.preview}")

    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
