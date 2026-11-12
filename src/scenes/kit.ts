/** Path builders shared by every scene. All coordinates are in a 1600 × 900 frame. */

export const f1 = (n: number) => Math.round(n * 10) / 10;

export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export const ell = (x: number, y: number, rx: number, ry: number) =>
  `M${f1(x - rx)},${f1(y)}a${f1(rx)},${f1(ry)} 0 1,0 ${f1(2 * rx)},0a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-2 * rx)},0`;

export function cluster(r: () => number, cx: number, cy: number, spread: number, n: number, rmin: number, rmax: number) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const dist = Math.sqrt(r()) * spread;
    const rad = rmin + r() * (rmax - rmin);
    d += ell(cx + Math.cos(a) * dist * 1.4, cy + Math.sin(a) * dist * 0.75, rad, rad);
  }
  return d;
}

/** A Korean tiled roof: a short ridge, swelling hips and eaves that lift at the corners. */
export function roof(cx: number, top: number, w: number, h: number) {
  const rl = cx - w * 0.28, rr = cx + w * 0.28, tip = top + h * 0.78;
  return `M${f1(rl)},${top}L${f1(rr)},${top}Q${f1(cx + w * 0.35)},${f1(top + h * 0.5)} ${f1(cx + w / 2)},${f1(tip)}Q${cx},${f1(top + h * 1.2)} ${f1(cx - w / 2)},${f1(tip)}Q${f1(cx - w * 0.35)},${f1(top + h * 0.5)} ${f1(rl)},${top}Z`;
}
export function eave(cx: number, top: number, w: number, h: number) {
  const tip = top + h * 0.78;
  return `M${f1(cx - w / 2)},${f1(tip)}Q${cx},${f1(top + h * 1.2)} ${f1(cx + w / 2)},${f1(tip)}`;
}
export function hips(cx: number, top: number, w: number, h: number) {
  const tip = top + h * 0.78;
  return `M${f1(cx + w * 0.28)},${top}Q${f1(cx + w * 0.35)},${f1(top + h * 0.5)} ${f1(cx + w / 2 - 6)},${f1(tip - 3)}M${f1(cx - w * 0.28)},${top}Q${f1(cx - w * 0.35)},${f1(top + h * 0.5)} ${f1(cx - w / 2 + 6)},${f1(tip - 3)}`;
}
/** The white ridge with its end ornaments. */
export function ridge(cx: number, top: number, w: number) {
  const rl = cx - w * 0.28 - 6, rr = cx + w * 0.28 + 6;
  return `M${f1(rl)},${top - 9}L${f1(rr)},${top - 9}L${f1(rr)},${top + 1}L${f1(rl)},${top + 1}Z` +
    `M${f1(rl)},${top - 8}q-10,-2 -15,-15q9,4 15,7Z` + `M${f1(rr)},${top - 8}q10,-2 15,-15q-9,4 -15,7Z`;
}
/** The painted band under the eaves. */
export function band(cx: number, top: number, w: number, h: number, t: number) {
  const tip = top + h * 0.78, ctrl = top + h * 1.2, L = cx - w / 2, R = cx + w / 2;
  return `M${f1(L)},${f1(tip)}Q${cx},${f1(ctrl)} ${f1(R)},${f1(tip)}L${f1(R - w * 0.05)},${f1(tip + t)}Q${cx},${f1(ctrl + 2 * t)} ${f1(L + w * 0.05)},${f1(tip + t)}Z`;
}
/** Guardian figures (japsang) sitting along the hips. */
export function japsang(cx: number, top: number, w: number, h: number, n = 3) {
  const tip = top + h * 0.78;
  const q = (a: number[], b: number[], c: number[], t: number) => [
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
  ];
  let d = '';
  [1, -1].forEach((sg) => {
    const a = [cx + sg * w * 0.28, top], b = [cx + sg * w * 0.35, top + h * 0.5], c = [cx + sg * (w / 2 - 6), tip - 3];
    for (let i = 0; i < n; i++) {
      const p = q(a, b, c, 0.3 + i * 0.12);
      d += ell(p[0], p[1] - 3, 3.4, 3.8);
    }
  });
  return d;
}
/** A rounded mountain from its base. */
export function peak(x: number, base: number, w: number, top: number) {
  return `M${f1(x - w)},${base}C${f1(x - w * 0.55)},${f1(top + (base - top) * 0.38)} ${f1(x - w * 0.3)},${top} ${x},${top}C${f1(x + w * 0.3)},${top} ${f1(x + w * 0.55)},${f1(top + (base - top) * 0.38)} ${f1(x + w)},${base}Z`;
}
export function stars(r: () => number, n: number, h = 300) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const rad = 0.6 + r() * 1.1;
    d += ell(r() * 1600, r() * h, rad, rad);
  }
  return d;
}
/** Repeated rectangles, for columns, balusters, stones and windows. */
export function rects(xs: number[], y: number, w: number, h: number) {
  return xs.map((x) => `M${f1(x)},${f1(y)}h${f1(w)}v${f1(h)}h${f1(-w)}Z`).join('');
}
export const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let x = from; x < to; x += step) out.push(x);
  return out;
};
/** A bare branching tree, for winter and for the Tribunal. */
export function bareTree(r: () => number, x: number, base: number, h: number) {
  let d = `M${x},${base}C${x - 4},${base - h * 0.4} ${x + 6},${base - h * 0.7} ${x},${base - h}`;
  const branch = (sx: number, sy: number, len: number, ang: number, depth: number) => {
    const ex = sx + Math.cos(ang) * len, ey = sy - Math.sin(ang) * len;
    d += `M${f1(sx)},${f1(sy)}Q${f1((sx + ex) / 2 + (r() - 0.5) * 10)},${f1((sy + ey) / 2)} ${f1(ex)},${f1(ey)}`;
    if (depth > 0) {
      branch(ex, ey, len * 0.62, ang + 0.4 + r() * 0.3, depth - 1);
      branch(ex, ey, len * 0.58, ang - 0.4 - r() * 0.3, depth - 1);
    }
  };
  branch(x, base - h * 0.55, h * 0.4, 2.3, 2);
  branch(x, base - h * 0.7, h * 0.35, 0.8, 2);
  branch(x, base - h, h * 0.25, 1.6, 1);
  return d;
}
