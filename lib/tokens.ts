import { contrast, readableText, saturation, type Swatch } from "./color";
import type { ExtraFont } from "./ask";
import type { StyleKit } from "./types";

export type NamedSwatch = Swatch & { name: string | null };

const CURVES = {
  back: "cubic-bezier(0.34, 1.56, 0.64, 1)", // easeOutBack (easings.net), for "spring / overshoot / bouncy"
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
};

// The researched trend's motion, as a CSS timing function. Only well-formed values get through.
export function motionCurve(text: string): string {
  const explicit = text.match(/cubic-bezier\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\)/i)?.[0];
  if (explicit) return explicit;
  if (/spring|overshoot|bounc|elastic|back/i.test(text)) return CURVES.back;
  if (/linear|constant|marquee/i.test(text)) return "linear";
  if (/in-out|in out|smooth/i.test(text)) return CURVES.inOut;
  return CURVES.out;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

export function surfaceFamily(kit: StyleKit): "glass" | "clay" | "flat" {
  const text = `${kit.summary} ${kit.typography.notes} ${kit.motion.notes}`;
  if (/clay|puffy|inflat|squish|plasticine|soft.?3d/i.test(text)) return "clay";
  if (kit.blur > 0 && /glass|frost|translucen|blur|refract/i.test(text)) return "glass";
  return "flat";
}

export function deriveTheme(kit: StyleKit, palette: NamedSwatch[]) {
  const ground = palette[0]?.hex ?? "#111827";
  const rest = palette.slice(1);
  const accent = [...rest].sort((a, b) => saturation(b.hex) - saturation(a.hex))[0]?.hex ?? readableText(ground);
  const display = kit.typography.display;
  // The palette colour that reads best on a white page, for type specimens.
  const ink = [...palette].sort((a, b) => contrast(b.hex, "#FFFFFF") - contrast(a.hex, "#FFFFFF"))[0]?.hex ?? "#111827";
  return {
    ground,
    accent,
    text: readableText(ground),
    onAccent: readableText(accent),
    glass: kit.blur > 0,
    // The stage material follows what the trend actually is, not just whether it blurs.
    surface: surfaceFamily(kit),
    radius: clamp(kit.radius, 0, 48),
    blur: clamp(kit.blur, 0, 40),
    ink: contrast(ink, "#FFFFFF") >= 3 ? ink : "#111827",
    fontFamily: /mono/i.test(display) ? "ui-monospace, monospace" : /serif/i.test(display) && !/sans/i.test(display) ? "Georgia, serif" : /round/i.test(display) ? "ui-rounded, system-ui, sans-serif" : "system-ui, sans-serif",
    fontWeight: /thin|light/i.test(kit.typography.display) ? 300 : /black|heavy|bold|condensed/i.test(kit.typography.display) ? 800 : 500,
    curve: motionCurve(kit.motion.curve),
    duration: clamp(kit.motion.duration_ms, 100, 800),
  };
}

// A chosen font as a CSS stack; mono and serif families keep a sensible fallback.
export const fontStack = (family: string) => `"${family}", ${/mono/i.test(family) ? "ui-monospace, monospace" : /serif|baskerville|playfair|fraunces/i.test(family) && !/sans/i.test(family) ? "Georgia, serif" : "system-ui, sans-serif"}`;

export function buildTokens(keyword: string, kit: StyleKit, palette: NamedSwatch[], fonts: ExtraFont[] = []) {
  const t = deriveTheme(kit, palette);
  const seen = new Set<string>();
  const colours = palette.map((p, i) => {
    let n = p.name ? slug(p.name) : `color-${i + 1}`;
    if (!n || seen.has(n)) n = `color-${i + 1}`;
    seen.add(n);
    return [n, p.hex] as const;
  });
  const css = [
    `/* ${keyword.replace(/\*\//g, "")} — Atlas Trend */`,
    ":root {",
    ...colours.map(([n, hex]) => `  --${n.startsWith("color-") ? n : `color-${n}`}: ${hex};`),
    `  --radius: ${t.radius}px;`,
    `  --blur: ${t.blur}px;`,
    `  --motion: ${t.duration}ms ${t.curve};`,
    ...fonts.map((f) => `  --font-${f.role}: ${fontStack(f.family)};`),
    "}",
  ].join("\n");
  const tailwind = [
    "// tailwind.config.js → theme.extend",
    "export default {",
    "  theme: { extend: {",
    `    colors: { ${colours.map(([n, hex]) => `"${n}": "${hex}"`).join(", ")} },`,
    `    borderRadius: { trend: "${t.radius}px" },`,
    `    backdropBlur: { trend: "${t.blur}px" },`,
    `    transitionTimingFunction: { trend: "${t.curve}" },`,
    `    transitionDuration: { trend: "${t.duration}ms" },`,
    ...(fonts.length ? [`    fontFamily: { ${fonts.map((f) => `${f.role}: [${JSON.stringify(f.family)}]`).join(", ")} },`] : []),
    "  } },",
    "};",
  ].join("\n");
  const json = JSON.stringify(
    {
      name: keyword,
      color: Object.fromEntries(colours),
      radius: `${t.radius}px`,
      blur: `${t.blur}px`,
      motion: { curve: t.curve, duration: `${t.duration}ms` },
      typography: { ...kit.typography, ...Object.fromEntries(fonts.map((f) => [`${f.role}Font`, f.family])) },
    },
    null,
    2,
  );
  return { css, tailwind, json };
}
