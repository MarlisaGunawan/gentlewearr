// Small helpers shared by the dashboard charts.

export const rupiah = (v) => 'Rp ' + Math.round(v).toLocaleString('id-ID');

/** Short rupiah for axes and tiles: 1.250.000 → "Rp 1,3 jt", 350.000 → "Rp 350 rb". */
export function rupiahShort(v) {
  if (v >= 1e9) return 'Rp ' + (v / 1e9).toFixed(1).replace('.', ',') + ' M';
  if (v >= 1e6) return 'Rp ' + (v / 1e6).toFixed(1).replace('.', ',') + ' jt';
  if (v >= 1e3) return 'Rp ' + Math.round(v / 1e3) + ' rb';
  return 'Rp ' + Math.round(v);
}

/** A "nice" axis maximum (1, 1.5, 2, 2.5 … × 10ⁿ). */
export function niceMax(value) {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  return steps.find((s) => value / exp <= s) * exp;
}

/** Monotone cubic curve through the points, so it never overshoots the data. */
export function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : '';
  const n = pts.length;
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    slope.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1));
  }
  const m = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    m.push(
      slope[i - 1] * slope[i] <= 0
        ? 0
        : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i])
    );
  }
  m.push(slope[n - 2]);
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = dx[i] / 3;
    d += ` C ${(x0 + h).toFixed(2)} ${(y0 + m[i] * h).toFixed(2)}, ${(x1 - h).toFixed(2)} ${(y1 - m[i + 1] * h).toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  return d;
}

/** % change, with "new" when there was nothing before. */
export function change(value, previous) {
  if (!previous) return value ? null : 0;
  return ((value - previous) / previous) * 100;
}
