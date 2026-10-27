import { contrast } from "./color";
import type { ExtraFont, FontName, SystemTweaks } from "./ask";
import { deriveTheme, fontStack, type NamedSwatch } from "./tokens";
import type { StyleKit } from "./types";

// A starter design system expanded from a board: free and instant, no model call.
// Tweaks (type ratio, spacing base, corner size) come from Ask Scout and are stored with the board.

// ---------- OKLCH (Björn Ottosson's OKLab), enough to build even shade ramps ----------
type Lch = [number, number, number];
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function toOklch(hex: string): Lch {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

function rgbOf([L, C, H]: Lch): number[] {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(gam);
}

// Lower chroma until the colour fits in sRGB, so ramps never clip into odd hues.
export function fromOklch(lch: Lch): string {
  let [L, C, H] = lch;
  let rgb = rgbOf([L, C, H]);
  while (C > 0 && rgb.some((v) => v < -0.0005 || v > 1.0005)) rgb = rgbOf([L, (C = Math.max(0, C - 0.005)), H]);
  return "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

// ---------- Colour roles ----------
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const TARGET_L = [0.97, 0.93, 0.87, 0.79, 0.7, 0.61, 0.52, 0.43, 0.34, 0.25];
export type Ramp = { step: (typeof STEPS)[number]; hex: string; base: boolean }[];

// Ten shades on one hue; the board's own colour replaces the step closest to its lightness.
export function ramp(hex: string): Ramp {
  const [L, C, H] = toOklch(hex);
  const baseAt = TARGET_L.reduce((best, t, i) => (Math.abs(t - L) < Math.abs(TARGET_L[best] - L) ? i : best), 0);
  return STEPS.map((step, i) => {
    const edge = Math.min(1, (1 - Math.abs(TARGET_L[i] - 0.6) / 0.4) * 0.7 + 0.3); // lighter and darker ends carry less colour
    return { step, base: i === baseAt, hex: i === baseAt ? hex.toUpperCase() : fromOklch([TARGET_L[i], C * edge, H]) };
  });
}

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
export type Role = { name: string; use: string; hex: string; ramp: Ramp };

export function colourRoles(primary: string, palette: string[]): Role[] {
  const [, pc, ph] = toOklch(primary);
  const lchs = palette.map((h) => [h, ...toOklch(h)] as const);
  const secondary = lchs.filter(([h, , c, hue]) => h !== primary && c > 0.08 && hueGap(hue, ph) > 40).sort((a, b) => b[2] - a[2])[0]?.[0]
    ?? fromOklch([0.55, Math.max(pc, 0.1), (ph + 150) % 360]);
  const neutral = lchs.filter(([, l, c]) => c < 0.05 && l > 0.2 && l < 0.75).sort((a, b) => a[2] - b[2])[0]?.[0] ?? fromOklch([0.45, 0.01, ph]);
  // Status colours borrow the palette's colourfulness so they sit with it rather than shout over it.
  const chroma = Math.min(0.19, Math.max(0.09, lchs.reduce((m, [, , c]) => Math.max(m, c), 0) * 0.8));
  const status = (hue: number, l = 0.62) => fromOklch([l, chroma, hue]);
  return [
    { name: "Primary", use: "buttons, focus, key actions", hex: primary },
    { name: "Secondary", use: "links, highlights", hex: secondary },
    { name: "Neutral", use: "text, lines, surfaces", hex: neutral },
    { name: "Success", use: "confirmations", hex: status(150) },
    { name: "Warning", use: "cautions", hex: status(70, 0.72) },
    { name: "Danger", use: "errors, destructive actions", hex: status(25) },
  ].map((r) => ({ ...r, ramp: ramp(r.hex) }));
}

// ---------- Fonts and type ----------
// Fonts Scout chose win; otherwise pick from the allowlist by the traits the kit read off the examples.
export function pickFonts(kit: StyleKit, chosen: ExtraFont[] = []): Record<"display" | "body", FontName> {
  const pick = (t: string, role: "display" | "body"): FontName => {
    const rules: [RegExp, FontName][] = role === "display"
      ? [[/mono/i, "Space Mono"], [/condensed|compressed|tall/i, "Bebas Neue"], [/serif/i, "Fraunces"], [/round|soft|friendly|bubbl|puffy/i, "Fredoka"], [/black|heavy|chunky|ultra/i, "Archivo Black"], [/wide|extended/i, "Unbounded"], [/geometric/i, "Outfit"], [/grotesk|grotesque/i, "Space Grotesk"]]
      : [[/mono/i, "IBM Plex Mono"], [/serif/i, "Libre Baskerville"], [/round|soft|friendly/i, "Nunito"], [/geometric/i, "DM Sans"]];
    // Only the main description counts ("grotesque sans … with a monospace accent" is a sans), and "serif" never matches "sans-serif".
    const main = t.split(/[,;]| with | and | paired /i)[0];
    return rules.find(([re]) => re.test(re.source === "serif" ? main.replace(/sans.?serif/gi, "") : main))?.[1] ?? (role === "display" ? "Manrope" : "Inter");
  };
  return {
    display: chosen.find((f) => f.role === "display")?.family ?? pick(kit.typography.display, "display"),
    body: chosen.find((f) => f.role === "body")?.family ?? pick(kit.typography.body, "body"),
  };
}

export type TypeStep = { name: string; px: number; lh: number; weight: number; font: "display" | "body"; sample: string };
export function typeScale(ratio: number, heavy: boolean): TypeStep[] {
  const s = (n: number) => Math.round(16 * ratio ** n);
  const w = heavy ? 800 : 700;
  return [
    { name: "Display", px: s(5), lh: 1.0, weight: w, font: "display", sample: "Bold moves" },
    { name: "H1", px: s(4), lh: 1.1, weight: w, font: "display", sample: "Page title" },
    { name: "H2", px: s(3), lh: 1.15, weight: w, font: "display", sample: "Section title" },
    { name: "H3", px: s(2), lh: 1.2, weight: w, font: "display", sample: "Card title" },
    { name: "Body L", px: s(1), lh: 1.5, weight: 400, font: "body", sample: "Lead paragraph text" },
    { name: "Body", px: 16, lh: 1.5, weight: 400, font: "body", sample: "Regular paragraph text for reading" },
    { name: "Small", px: Math.round(16 / ratio), lh: 1.45, weight: 400, font: "body", sample: "Helper and secondary text" },
    { name: "Label", px: 12, lh: 1.3, weight: 600, font: "body", sample: "Button · tag · label" },
  ];
}

// ---------- The whole system ----------
export function buildSystem(keyword: string, kit: StyleKit, palette: NamedSwatch[], extraColours: string[], fonts: ExtraFont[], tweaks: SystemTweaks = {}) {
  const theme = deriveTheme(kit, palette);
  const traits = `${kit.summary} ${kit.typography.display} ${kit.typography.notes}`;
  const brutal = /brutal|hard.?(drop.?)?shadow|offset shadow|thick (black )?outline/i.test(traits);
  const heavy = /black|heavy|bold|chunky|oversized|ultra/i.test(kit.typography.display);
  const ratio = tweaks.ratio ?? (/oversized|huge|scale jump|very large/i.test(traits) ? 1.333 : 1.25);
  const base = tweaks.spacing ?? 4;
  const r = tweaks.radius ?? theme.radius;
  const f = pickFonts(kit, fonts);
  return {
    keyword,
    roles: colourRoles(theme.accent, [...palette.map((p) => p.hex), ...extraColours]),
    fonts: f,
    ratio,
    type: typeScale(ratio, heavy),
    spacing: [1, 2, 3, 4, 6, 8, 12, 16].map((n) => ({ name: String(n), px: n * base })),
    spacingBase: base,
    radius: [
      { name: "none", px: 0 }, { name: "sm", px: Math.round(r / 2) }, { name: "md", px: r }, { name: "lg", px: Math.max(r * 2, 8) }, { name: "full", px: 999 },
    ],
    shadowStyle: brutal ? "hard offsets, no blur" : theme.surface === "glass" ? "soft and wide, with a light rim" : theme.surface === "clay" ? "puffy, with an inner highlight" : "soft and close",
    shadows: [1, 2, 3].map((lvl) =>
      brutal ? `${2 ** lvl}px ${2 ** lvl}px 0 #111111`
        : theme.surface === "glass" ? `0 ${lvl * 8}px ${lvl * 24}px -${lvl * 6}px rgba(0,0,0,${0.12 + lvl * 0.06}), inset 0 1px 0 rgba(255,255,255,.55)`
        : theme.surface === "clay" ? `0 ${lvl * 6}px ${lvl * 12}px -${lvl * 4}px rgba(0,0,0,.25), inset 0 ${lvl + 2}px ${lvl * 4}px rgba(255,255,255,.5)`
        : `0 ${lvl * 2}px ${lvl * 6}px rgba(0,0,0,${0.06 + lvl * 0.04})`,
    ),
    motion: { fast: Math.round(theme.duration * 0.66), base: theme.duration, slow: Math.round(theme.duration * 1.66), curve: theme.curve },
    // The trend's material, so exports can give concrete CSS for it (not just words).
    surface: (brutal ? "brutal" : theme.surface) as "brutal" | "glass" | "clay" | "flat",
    blur: theme.blur,
  };
}
export type System = ReturnType<typeof buildSystem>;

// ---------- Exports ----------
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function systemCss(s: System): string {
  return [
    `/* ${s.keyword.replace(/[*/<>]/g, "")} design system — Atlas Trend */`, // also lands inside <style> in the HTML guide
    ":root {",
    ...s.roles.flatMap((r) => r.ramp.map((x) => `  --${slug(r.name)}-${x.step}: ${x.hex};`)),
    `  --font-display: ${fontStack(s.fonts.display)};`,
    `  --font-body: ${fontStack(s.fonts.body)};`,
    ...s.type.map((t) => `  --text-${slug(t.name)}: ${t.weight} ${t.px}px/${t.lh} var(--font-${t.font});`),
    ...s.spacing.map((x) => `  --space-${x.name}: ${x.px}px;`),
    ...s.radius.map((x) => `  --radius-${x.name}: ${x.px}px;`),
    ...s.shadows.map((x, i) => `  --shadow-${i + 1}: ${x};`),
    `  --motion-fast: ${s.motion.fast}ms ${s.motion.curve};`,
    `  --motion-base: ${s.motion.base}ms ${s.motion.curve};`,
    `  --motion-slow: ${s.motion.slow}ms ${s.motion.curve};`,
    "}",
  ].join("\n");
}

export function systemTailwind(s: System): string {
  const colors = Object.fromEntries(s.roles.map((r) => [slug(r.name), Object.fromEntries(r.ramp.map((x) => [x.step, x.hex]))]));
  const preset = {
    theme: {
      extend: {
        colors,
        fontFamily: { display: [s.fonts.display, "sans-serif"], body: [s.fonts.body, "sans-serif"] },
        fontSize: Object.fromEntries(s.type.map((t) => [slug(t.name), [`${t.px}px`, { lineHeight: String(t.lh), fontWeight: String(t.weight) }]])),
        spacing: Object.fromEntries(s.spacing.map((x) => [x.name, `${x.px}px`])),
        borderRadius: Object.fromEntries(s.radius.map((x) => [x.name, `${x.px}px`])),
        boxShadow: Object.fromEntries(s.shadows.map((x, i) => [String(i + 1), x])),
        transitionDuration: { fast: `${s.motion.fast}ms`, DEFAULT: `${s.motion.base}ms`, slow: `${s.motion.slow}ms` },
        transitionTimingFunction: { DEFAULT: s.motion.curve },
      },
    },
  };
  return `// ${s.keyword} design system — Atlas Trend\n// tailwind.config.js: presets: [require("./${slug(s.keyword)}-preset.js")]\nmodule.exports = ${JSON.stringify(preset, null, 2)};\n`;
}

// W3C Design Tokens (DTCG) format, which Figma plugins and Style Dictionary read.
export function systemJson(s: System): string {
  const t = (type: string, value: unknown) => ({ $type: type, $value: value });
  return JSON.stringify(
    {
      $description: `${s.keyword} design system, generated by Atlas Trend`,
      color: Object.fromEntries(s.roles.map((r) => [slug(r.name), Object.fromEntries(r.ramp.map((x) => [x.step, t("color", x.hex)]))])),
      font: { display: t("fontFamily", [s.fonts.display, "sans-serif"]), body: t("fontFamily", [s.fonts.body, "sans-serif"]) },
      typography: Object.fromEntries(s.type.map((x) => [slug(x.name), t("typography", { fontFamily: `{font.${x.font}}`, fontSize: `${x.px}px`, lineHeight: x.lh, fontWeight: x.weight })])),
      spacing: Object.fromEntries(s.spacing.map((x) => [x.name, t("dimension", `${x.px}px`)])),
      radius: Object.fromEntries(s.radius.map((x) => [x.name, t("dimension", `${x.px}px`)])),
      shadow: Object.fromEntries(s.shadows.map((x, i) => [String(i + 1), t("shadow", x)])),
      duration: { fast: t("duration", `${s.motion.fast}ms`), base: t("duration", `${s.motion.base}ms`), slow: t("duration", `${s.motion.slow}ms`) },
      easing: t("cubicBezier", s.motion.curve),
    },
    null,
    2,
  );
}

const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const gfont = (family: string) => encodeURIComponent(family).replace(/%20/g, "+");

// A one-page guide that works offline except for the two Google Fonts.
export function systemHtml(s: System): string {
  const swatch = (hex: string, label: string, base: boolean) =>
    `<div class="sw${base ? " base" : ""}" style="background:${hex};color:${contrast(hex, "#FFFFFF") >= 4.5 ? "#fff" : "#111"}">${label}<br>${hex}</div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(s.keyword)} design system</title>
<link href="https://fonts.googleapis.com/css2?family=${gfont(s.fonts.display)}&family=${gfont(s.fonts.body)}&display=swap" rel="stylesheet">
<style>${systemCss(s)}
body{margin:0;font:400 16px/1.5 var(--font-body);color:#111;background:#fff}main{max-width:1100px;margin:0 auto;padding:48px 24px}
h1{font:var(--text-h1);margin:0 0 8px}h2{font:var(--text-h3);margin:48px 0 16px}p.lead{color:#555;margin:0 0 24px}
.row{display:grid;grid-template-columns:140px repeat(10,1fr);gap:4px;align-items:stretch;margin-bottom:6px}.row b{align-self:center}
.sw{font:600 10px/1.3 ui-monospace,monospace;padding:28px 6px 6px;border-radius:6px}.sw.base{outline:3px solid #111;outline-offset:-3px}
.t{display:grid;grid-template-columns:120px 1fr 150px;gap:16px;align-items:baseline;border-bottom:1px dashed #ddd;padding:8px 0}.t span{color:#666;font-size:13px}
.box{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-end}.sp{height:16px;background:var(--primary-500)}.r{width:72px;height:72px;border:3px solid #111}
.sh{width:140px;height:90px;border:2px solid #111;background:#fff;display:grid;place-items:center}small{color:#666}</style></head><body><main>
<h1>${esc(s.keyword)}</h1><p class="lead">Starter design system generated by Atlas Trend from real examples of the trend.</p>
<h2>Colour</h2>${s.roles.map((r) => `<div class="row"><b>${r.name}<br><small>${r.use}</small></b>${r.ramp.map((x) => swatch(x.hex, String(x.step), x.base)).join("")}</div>`).join("")}
<h2>Type</h2><p>Display: <b>${esc(s.fonts.display)}</b> · Body: <b>${esc(s.fonts.body)}</b> · scale ratio ${s.ratio}</p>
${s.type.map((t) => `<div class="t"><span>${t.name}</span><div style="font:${t.weight} ${t.px}px/${t.lh} var(--font-${t.font})">${t.sample}</div><span>${t.px}px / ${t.lh} / ${t.weight}</span></div>`).join("")}
<h2>Spacing</h2><div class="box">${s.spacing.map((x) => `<div><div class="sp" style="width:${x.px}px"></div><small>${x.name} · ${x.px}px</small></div>`).join("")}</div>
<h2>Corners</h2><div class="box">${s.radius.map((x) => `<div><div class="r" style="border-radius:${x.px}px"></div><small>${x.name} · ${x.name === "full" ? "full" : x.px + "px"}</small></div>`).join("")}</div>
<h2>Shadows</h2><div class="box">${s.shadows.map((x, i) => `<div class="sh" style="box-shadow:${x}">Level ${i + 1}</div>`).join("")}</div>
<h2>Motion</h2><p>fast ${s.motion.fast}ms · base ${s.motion.base}ms · slow ${s.motion.slow}ms · <code>${s.motion.curve}</code></p>
</main></body></html>`;
}

