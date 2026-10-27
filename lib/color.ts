export type Swatch = { hex: string; share: number };

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const readableText = (bg: string) => (contrast(bg, "#FFFFFF") >= contrast(bg, "#111827") ? "#FFFFFF" : "#111827");

// Bucket pixels (RGB triplets) into a 16-level cube, then greedily keep distinct bucket averages.
// ponytail: histogram + greedy merge, good enough for 5–6 swatches; k-means if palettes look muddy.
export function quantize(px: Uint8Array, k = 6, minDistance = 40): Swatch[] {
  const buckets = new Map<number, { n: number; sum: number[] }>();
  for (let i = 0; i + 2 < px.length; i += 3) {
    const key = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
    const b = buckets.get(key) ?? { n: 0, sum: [0, 0, 0] };
    b.n++;
    b.sum[0] += px[i];
    b.sum[1] += px[i + 1];
    b.sum[2] += px[i + 2];
    buckets.set(key, b);
  }
  const avgs = [...buckets.values()].map((b) => ({ n: b.n, c: b.sum.map((s) => s / b.n) })).sort((a, b) => b.n - a.n);
  const pixelsTotal = avgs.reduce((t, a) => t + a.n, 0);
  const chosen: number[][] = [];
  const pick = (list: typeof avgs, limit: number, distinctHue = false) => {
    for (const { c } of list) {
      if (chosen.length >= limit) break;
      if (chosen.some((x) => dist(x, c) < minDistance)) continue;
      // Accents must differ in hue too, or three near-identical blues fill the slots.
      if (distinctHue && chosen.some((x) => saturationRgb(x) >= 0.45 && hueGap(x, c) < 30)) continue;
      chosen.push(c);
    }
  };
  // Coverage alone returns greys for most trends; reserve two slots for vivid accents (≥0.5% of pixels).
  pick(avgs, k - 2);
  const vivid = avgs
    .filter((a) => a.n / pixelsTotal >= 0.005 && saturationRgb(a.c) >= 0.45 && lightness(a.c) > 0.15 && lightness(a.c) < 0.9)
    .sort((a, b) => b.n * saturationRgb(b.c) ** 2 - a.n * saturationRgb(a.c) ** 2);
  pick(vivid, k, true);
  pick(avgs, k);
  const counts = chosen.map(() => 0);
  let total = 0;
  for (const { n, c } of avgs) {
    let best = 0;
    chosen.forEach((x, i) => dist(x, c) < dist(chosen[best], c) && (best = i));
    counts[best] += n;
    total += n;
  }
  return chosen.map((c, i) => ({ hex: toHex(c), share: total ? counts[i] / total : 0 })).sort((a, b) => b.share - a.share);
}

export function nearestName(hex: string, named: { name: string; hex: string }[], max = 60): string | null {
  let best: { name: string; d: number } | null = null;
  for (const n of named) {
    if (!/^#[0-9a-f]{6}$/i.test(n.hex)) continue;
    const d = dist(rgb(hex), rgb(n.hex));
    if (d <= max && (!best || d < best.d)) best = { name: n.name, d };
  }
  return best?.name ?? null;
}

function saturationRgb(c: number[]) {
  const [r, g, b] = c.map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === min ? 0 : (max - min) / (1 - Math.abs(max + min - 1));
}
function hue(c: number[]) {
  const [r, g, b] = c.map((v) => v / 255);
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const hueGap = (a: number[], b: number[]) => {
  const d = Math.abs(hue(a) - hue(b));
  return Math.min(d, 360 - d);
};
const lightness = (c: number[]) => (Math.max(...c) + Math.min(...c)) / 510;

export const saturation = (hex: string) => saturationRgb(rgb(hex));
