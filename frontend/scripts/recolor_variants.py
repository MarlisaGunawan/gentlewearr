"""
Make colour-variant photos for products that come in more than one colour.

For each product we:
  1. find the garment: GrabCut inside a box around it, then keep only pixels
     whose colour is close to a few "seed" points on the fabric;
  2. repaint those pixels with the target colour in Lab space, keeping the
     original light and shadow (folds, seams), so it still looks like fabric;
  3. save the result to public/products/<id>-<colour>.jpg

Run from the frontend folder:   python scripts/recolor_variants.py
Add --preview to also write a check sheet (original | mask | variants).
"""

import io
import os
import sys
import urllib.request

import cv2
import numpy as np

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'products')
PHOTO = 'https://images.unsplash.com/photo-{}?w=900&q=80&auto=format&fit=crop'

# box = (left, top, right, bottom) in % of the photo, seeds = points on the fabric in %,
# tol = how different (in Lab) a pixel may be from the seeds and still count as fabric,
# close = size of gaps inside the fabric to fill (keep small when there is a print to protect),
# erode = how many pixels to pull the edge in (bigger = no halo, smaller = no dark outline),
# grabcut=False skips subject detection (fine for products on a plain background).
PRODUCTS = [
    dict(id='gw-101', photo='1586790170083-2f9ceadc732d', box=(10, 36, 90, 100), seeds=[(40, 60), (60, 75), (78, 50), (22, 50)], tol=26,
         targets={'black': '#2a2725', 'sand': '#d8c3a5'}),
    dict(id='gw-112', photo='1521572163474-6864f9cf17ab', box=(10, 0, 92, 100), seeds=[(50, 55), (30, 30), (70, 30), (50, 85)], tol=26,
         targets={'olive': '#7d9066'}),
    dict(id='gw-113', photo='1618354691373-d851c5c3a990', box=(12, 15, 92, 95), seeds=[(35, 62), (50, 80), (25, 40), (65, 70)], tol=22, erode=1,
         targets={'peach': '#d6a283'}),
    dict(id='gw-105', photo='1596755094514-f87e34085b2c', box=(2, 22, 98, 92), seeds=[(38, 62), (60, 55), (20, 60), (50, 80)], tol=22, erode=7,
         targets={'white': '#ecebe7'}),
    dict(id='gw-103', photo='1516826957135-700dedea698c', box=(18, 8, 58, 44), seeds=[(36, 27), (40, 36), (30, 22), (42, 30)], tol=30, close=15,
         targets={'cream': '#ece2d2'}),
    dict(id='gw-132', photo='1556821840-3a63f95609a7', box=(8, 15, 92, 89), seeds=[(50, 55), (50, 26), (50, 17), (25, 60), (75, 60), (50, 80)], tol=30, close=15,
         targets={'sage': '#7d9066'}),
    dict(id='gw-141', photo='1591047139829-d91aecb6caea', box=(8, 22, 88, 98), grabcut=False, seeds=[(40, 52), (50, 80), (25, 60), (70, 60), (20, 85), (80, 85), (16, 66), (19, 75)], tol=36, close=15,
         targets={'olive': '#6b7350'}),
    dict(id='gw-152', photo='1488161628813-04466f872be2', box=(34, 60, 66, 92), seeds=[(46, 72), (55, 78), (44, 80)], tol=22,
         targets={'stone': '#cfc6b6'}),
]


def load(photo_id):
    data = urllib.request.urlopen(PHOTO.format(photo_id), timeout=60).read()
    return cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)


def pct(value, size):
    return int(round(value / 100 * (size - 1)))


def garment_mask(img, box, seeds, tol, close=7, erode=3, grabcut=True):
    h, w = img.shape[:2]
    x0, y0, x1, y1 = pct(box[0], w), pct(box[1], h), pct(box[2], w), pct(box[3], h)

    # 1. GrabCut: separate the subject from the background inside the box.
    subject = np.ones((h, w), bool)
    if grabcut:
        gc = np.zeros((h, w), np.uint8)
        bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
        cv2.grabCut(img, gc, (x0, y0, x1 - x0, y1 - y0), bgd, fgd, 5, cv2.GC_INIT_WITH_RECT)
        subject = (gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)

    # 2. Colour: close to the fabric seeds (lightness counts less, so shadows stay in).
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    dist = np.full((h, w), np.inf, np.float32)
    pts = [(pct(sx, w), pct(sy, h)) for sx, sy in seeds]
    for px, py in pts:
        c = np.median(lab[max(0, py - 4):py + 5, max(0, px - 4):px + 5].reshape(-1, 3), axis=0)
        d = np.sqrt(((lab[..., 0] - c[0]) * 0.45) ** 2 + (lab[..., 1] - c[1]) ** 2 + (lab[..., 2] - c[2]) ** 2)
        dist = np.minimum(dist, d)
    similar = dist < tol

    inside = np.zeros((h, w), bool)
    inside[y0:y1, x0:x1] = True
    mask = (subject & similar & inside).astype(np.uint8)

    # 3. Clean up and keep only the pieces that touch a seed point.
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((close, close), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    _, labels = cv2.connectedComponents(mask)
    keep = {labels[py, px] for px, py in pts if mask[py, px]}
    mask = np.isin(labels, list(keep - {0})).astype(np.float32)

    # Fill holes fully enclosed by fabric (dark folds), then pull the edge in a little
    # and soften it, so no halo of the new colour spills onto the background.
    if close > 7:
        # Pad with a background border so areas touching the photo edge never count as holes.
        padded = np.pad(mask.astype(np.uint8), 1)
        flood = np.zeros((h + 4, w + 4), np.uint8)
        cv2.floodFill(padded, flood, (0, 0), 1)
        mask = np.maximum(mask, (padded[1:-1, 1:-1] == 0).astype(np.float32))
    if erode > 1:
        mask = cv2.erode(mask, np.ones((erode, erode), np.uint8))
    return cv2.GaussianBlur(mask, (0, 0), 1.2)


def hex_to_lab(hex_color):
    rgb = np.array([[[int(hex_color[i:i + 2], 16) for i in (5, 3, 1)]]], np.uint8)  # as BGR
    return cv2.cvtColor(rgb, cv2.COLOR_BGR2LAB).astype(np.float32)[0, 0]


def recolor(img, alpha, target_hex):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    inside = alpha > 0.5
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    base_l, base_std = L[inside].mean(), max(L[inside].std(), 1.0)
    target = hex_to_lab(target_hex)

    # Keep the folds: same light/dark pattern, scaled to a natural contrast for the new colour.
    wanted_std = float(np.clip(base_std, 12, 26)) * (0.75 if target[0] < 70 else 1.0)
    new_l = target[0] + (L - base_l) * (wanted_std / base_std)
    new_a = target[1] + (a - a[inside].mean()) * 0.25
    new_b = target[2] + (b - b[inside].mean()) * 0.25

    out = np.stack([np.clip(new_l, 0, 255), np.clip(new_a, 0, 255), np.clip(new_b, 0, 255)], axis=-1)
    blended = lab * (1 - alpha[..., None]) + out * alpha[..., None]
    return cv2.cvtColor(blended.astype(np.uint8), cv2.COLOR_LAB2BGR)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    preview = '--preview' in sys.argv
    rows = []
    for p in PRODUCTS:
        img = load(p['photo'])
        alpha = garment_mask(img, p['box'], p['seeds'], p['tol'], p.get('close', 7), p.get('erode', 3), p.get('grabcut', True))
        tiles = [img, (img * 0.35 + np.dstack([alpha * 255] * 3) * 0.65).astype(np.uint8)]
        for name, hex_color in p['targets'].items():
            result = recolor(img, alpha, hex_color)
            path = os.path.join(OUT_DIR, '{}-{}.jpg'.format(p['id'], name))
            cv2.imwrite(path, result, [cv2.IMWRITE_JPEG_QUALITY, 88])
            tiles.append(result)
            print('wrote', os.path.relpath(path))
        if preview:
            rows.append([cv2.resize(t, (240, int(240 * t.shape[0] / t.shape[1]))) for t in tiles])

    if preview:
        height = max(t.shape[0] for r in rows for t in r)
        width = 240 * max(len(r) for r in rows)
        sheet = np.full((height * len(rows), width, 3), 255, np.uint8)
        for i, r in enumerate(rows):
            for j, t in enumerate(r):
                sheet[i * height:i * height + t.shape[0], j * 240:(j + 1) * 240] = t
        cv2.imwrite(sys.argv[sys.argv.index('--preview') + 1], sheet, [cv2.IMWRITE_JPEG_QUALITY, 80])


if __name__ == '__main__':
    main()
