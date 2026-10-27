import { contrast } from "./color";
import { systemCss, systemHtml, systemJson, systemTailwind, toOklch, type Role, type System } from "./designSystem";
import { fontStack } from "./tokens";

// "Use in my project": files for AI coding tools and shadcn, built only from what the board already holds.
export type Facts = { kept: string[]; avoided: string[]; examples: number; sites: number; summary: string; typography: { display: string; body: string; notes: string }; motionNotes: string };
export type Mode = "light" | "dark";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trend";
const clean = (s: string) => s.replace(/[\r\n]+/g, " ").replace(/[<>`]/g, "").trim();
const uniq = (list: string[], n: number) => [...new Set(list.map((s) => clean(s).toLowerCase()).filter(Boolean))].slice(0, n);
const shade = (r: Role, step: number) => r.ramp.find((x) => x.step === step)!.hex;
const base = (r: Role) => r.ramp.find((x) => x.base)!.hex;

// Light or dark follows the board's main background (its ground colour).
export const modeFor = (ground: string): Mode => (toOklch(ground)[0] >= 0.6 ? "light" : "dark");

// ---------- shadcn theme (Tailwind v4) ----------
const AA = 4.5;
// The first candidate that reads at AA on the background, else whichever of white/near-black reads best.
function readable(bg: string, candidates: string[]): string {
  return candidates.find((c) => contrast(bg, c) >= AA) ?? (contrast(bg, "#FFFFFF") >= contrast(bg, "#111111") ? "#FFFFFF" : "#111111");
}

export function shadcnVars(s: System, mode: Mode) {
  const [primary, secondary, neutral, success, warning, danger] = s.roles;
  const L = mode === "light";
  const background = L ? shade(neutral, 50) : shade(neutral, 900);
  const card = L ? "#FFFFFF" : shade(neutral, 800);
  const muted = L ? shade(neutral, 100) : shade(neutral, 800);
  const p = base(primary), sec = L ? shade(secondary, 100) : shade(secondary, 800), acc = L ? shade(primary, 100) : shade(primary, 800);
  const dest = L ? shade(danger, 600) : shade(danger, 500);
  const vars: Record<string, string> = {
    background,
    foreground: readable(background, L ? [shade(neutral, 900)] : [shade(neutral, 50)]),
    card,
    "card-foreground": readable(card, L ? [shade(neutral, 900)] : [shade(neutral, 50)]),
    popover: card,
    "popover-foreground": readable(card, L ? [shade(neutral, 900)] : [shade(neutral, 50)]),
    primary: p,
    "primary-foreground": readable(p, ["#FFFFFF", shade(primary, 900), shade(primary, 50)]),
    secondary: sec,
    "secondary-foreground": readable(sec, L ? [shade(secondary, 900), shade(neutral, 900)] : [shade(secondary, 50), shade(neutral, 50)]),
    muted,
    "muted-foreground": readable(muted, L ? [shade(neutral, 600), shade(neutral, 700), shade(neutral, 800)] : [shade(neutral, 300), shade(neutral, 200), shade(neutral, 100)]),
    accent: acc,
    "accent-foreground": readable(acc, L ? [shade(primary, 900), shade(neutral, 900)] : [shade(primary, 50), shade(neutral, 50)]),
    destructive: dest,
    "destructive-foreground": readable(dest, ["#FFFFFF"]),
    border: L ? shade(neutral, 200) : shade(neutral, 700),
    input: L ? shade(neutral, 200) : shade(neutral, 700),
    ring: p,
    "chart-1": p, "chart-2": base(secondary), "chart-3": base(success), "chart-4": base(warning), "chart-5": base(danger),
  };
  const pairs = ["", "card-", "popover-", "primary-", "secondary-", "muted-", "accent-", "destructive-"].map((k) => {
    const bg = vars[k ? k.slice(0, -1) : "background"], fg = vars[`${k || ""}foreground`];
    return { bg, fg, ratio: contrast(bg, fg) };
  });
  return { vars, pairs, passing: pairs.filter((x) => x.ratio >= AA).length };
}

export function shadcnCss(s: System, mode: Mode): string {
  const { vars } = shadcnVars(s, mode);
  const names = Object.keys(vars);
  return [
    `/* ${clean(s.keyword).replace(/[*/]/g, "")} theme for shadcn/ui (Tailwind v4, ${mode}) — Atlas Trend */`,
    `/* Replace the theme part of your app/globals.css (the :root block and @theme inline) with this. */`,
    `@import "tailwindcss";`,
    "",
    ":root {",
    `  --radius: ${s.radius.find((r) => r.name === "md")!.px}px;`,
    `  --font-sans: ${fontStack(s.fonts.body)};`,
    `  --font-heading: ${fontStack(s.fonts.display)};`,
    ...names.map((n) => `  --${n}: ${vars[n]};`),
    "}",
    "",
    "@theme inline {",
    "  --font-sans: var(--font-sans);",
    "  --font-heading: var(--font-heading);",
    "  --radius-sm: calc(var(--radius) * 0.5);",
    "  --radius-md: var(--radius);",
    "  --radius-lg: calc(var(--radius) * 1.5);",
    "  --radius-xl: calc(var(--radius) * 2);",
    ...names.map((n) => `  --color-${n}: var(--${n});`),
    ...s.shadows.map((x, i) => `  --shadow-${["sm", "md", "lg"][i]}: ${x};`),
    "}",
    "",
    "@layer base {",
    "  * { @apply border-border outline-ring/50; }",
    "  body { @apply bg-background text-foreground; font-family: var(--font-sans); }",
    "  h1, h2, h3, h4 { font-family: var(--font-heading); }",
    "}",
    "",
  ].join("\n");
}

// ---------- Rules for AI coding tools ----------
// A concrete CSS recipe for the trend's material. Models follow code far more reliably than adjectives.
export function surfaceRecipe(s: System, mode: Mode): string[] {
  const p = base(s.roles[0]), sec = base(s.roles[1]), n = s.roles[2];
  const md = s.radius.find((x) => x.name === "md")!.px;
  const head = (title: string, notes: string[]) => ["## Surface recipe: " + title, ...notes.map((x) => `- ${x}`), "", "```css"];
  if (s.surface === "glass") {
    const blur = Math.max(s.blur, 16);
    const backdrop = mode === "dark" ? shade(n, 900) : shade(n, 100);
    return [
      ...head("glass (use this, it is what makes the style)", [
        "Glass only reads over something colourful. The page background is NEVER plain white or flat grey: always use `.glass-backdrop` (soft colour fields from the palette) behind glass panels.",
        "Cards, nav bars, inputs, tabs and pricing panels are `.glass` panels floating over that backdrop. Buttons and tabs are pills (radius-full).",
        "Keep text on glass high contrast; put a solid primary button on top of glass for the main action.",
      ]),
      ".glass-backdrop {",
      `  background:`,
      `    radial-gradient(40% 50% at 15% 20%, color-mix(in oklch, ${p} 70%, transparent), transparent 70%),`,
      `    radial-gradient(35% 45% at 85% 30%, color-mix(in oklch, ${sec} 60%, transparent), transparent 70%),`,
      `    radial-gradient(45% 50% at 60% 90%, color-mix(in oklch, ${shade(s.roles[0], 300)} 60%, transparent), transparent 70%),`,
      `    ${backdrop};`,
      "  background-attachment: fixed;",
      "}",
      ".glass {",
      `  background: ${mode === "dark" ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.28)"};`,
      `  backdrop-filter: blur(${blur}px) saturate(170%);`,
      `  -webkit-backdrop-filter: blur(${blur}px) saturate(170%);`,
      `  border: 1px solid ${mode === "dark" ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.55)"};`,
      `  border-radius: ${Math.max(md, 16)}px;`,
      "  box-shadow: inset 0 1px 0 rgba(255,255,255,.6), inset 0 -1px 0 rgba(255,255,255,.12), 0 24px 48px -24px rgba(0,0,0,.45);",
      "}",
      ".glass-pill { border-radius: 999px; padding: 10px 18px; } /* use together with .glass */",
      "```",
      "",
    ];
  }
  if (s.surface === "clay")
    return [
      ...head("clay", ["Surfaces are opaque, soft and puffy: no hairline borders, no blur. Big radius, soft outer shadow plus an inner highlight and inner shade.", "Use pastel tints (100–300 shades) for surfaces and the base colours for buttons."]),
      ".clay {",
      `  background: ${shade(s.roles[0], 100)};`,
      `  border-radius: ${Math.max(md, 24)}px;`,
      "  border: 0;",
      "  box-shadow: 0 18px 30px -14px rgba(0,0,0,.28), inset 0 6px 10px rgba(255,255,255,.6), inset 0 -8px 14px rgba(0,0,0,.08);",
      "}",
      "```",
      "",
    ];
  if (s.surface === "brutal")
    return [
      ...head("neo-brutalist", ["Flat fills, thick black outlines and hard offset shadows with no blur. Buttons move toward their shadow on press.", "No gradients, no soft shadows, no translucency."]),
      ".brutal {",
      `  background: ${mode === "dark" ? shade(n, 800) : "#FFFFFF"};`,
      "  border: 3px solid #111111;",
      `  border-radius: ${md}px;`,
      "  box-shadow: 4px 4px 0 #111111;",
      "}",
      `.brutal:active { transform: translate(4px, 4px); box-shadow: 0 0 0 #111111; transition: ${s.motion.fast}ms ${s.motion.curve}; }`,
      "```",
      "",
    ];
  return [];
}

export function designRules(s: System, f: Facts, mode: Mode): string {
  const r = (name: string) => s.roles.find((x) => x.name === name)!;
  const md = s.radius.find((x) => x.name === "md")!.px;
  const kept = uniq(f.kept, 8), avoid = uniq(f.avoided.filter((a) => !/no images|duplicate|couldn|timed out|not an image|too (big|large)|blocked/i.test(a)), 6);
  return [
    `# Design rules: ${clean(s.keyword)}`,
    "",
    `Build every screen in this project in the **${clean(s.keyword)}** style. These rules come from ${f.examples} real examples on ${f.sites} sites, researched by Atlas Trend. Don't invent other colours, fonts, sizes or shadows: use the tokens below.`,
    "",
    "## The look",
    clean(f.summary),
    `- Headings: ${clean(f.typography.display)}`,
    `- Text: ${clean(f.typography.body)}`,
    ...(f.typography.notes ? [`- Type notes: ${clean(f.typography.notes)}`] : []),
    `- Motion: ${clean(f.motionNotes) || `${s.motion.base}ms, ${s.motion.curve}`}`,
    `- Mode: ${mode} (background \`${mode === "light" ? shade(r("Neutral"), 50) : shade(r("Neutral"), 900)}\`)`,
    "",
    "## Must follow",
    `- Colour roles: **primary** \`${base(r("Primary"))}\` for main actions and focus; **secondary** \`${base(r("Secondary"))}\` for links and highlights; **neutral** for text, lines and surfaces; success, warning and danger only for status. Use the 50–900 shades for hovers, tints and borders.`,
    `- Fonts: headings in **${s.fonts.display}**, everything else in **${s.fonts.body}** (Google Fonts). Only use the type scale below.`,
    `- Spacing: only multiples from the spacing scale (base ${s.spacingBase}px).`,
    `- Corners: ${md}px on cards, inputs and buttons (radius-md); radius-full only for avatars and pills.`,
    `- Shadows: ${s.shadowStyle}. Only shadow-1 to shadow-3.`,
    `- Motion: ${s.motion.base}ms with \`${s.motion.curve}\`; never slower than ${s.motion.slow}ms. Respect prefers-reduced-motion.`,
    "- Accessibility: body text and controls must meet WCAG AA contrast (4.5:1); keep visible focus rings.",
    "",
    ...surfaceRecipe(s, mode),
    ...(kept.length ? ["## What the examples do", ...kept.map((k) => `- ${k}`), ""] : []),
    ...(avoid.length ? ["## What is NOT this style (avoid)", ...avoid.map((k) => `- ${k}`), ""] : []),
    "## Type scale",
    "| Role | Size | Line height | Weight | Font |",
    "| --- | --- | --- | --- | --- |",
    ...s.type.map((t) => `| ${t.name} | ${t.px}px | ${t.lh} | ${t.weight} | ${t.font === "display" ? s.fonts.display : s.fonts.body} |`),
    "",
    "## Tokens (CSS)",
    "```css",
    systemCss(s),
    "```",
    "",
    `Fonts: \`<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(s.fonts.display).replace(/%20/g, "+")}&family=${encodeURIComponent(s.fonts.body).replace(/%20/g, "+")}&display=swap" rel="stylesheet">\``,
    "",
  ].join("\n");
}

export function projectKit(s: System, f: Facts, mode: Mode): Record<string, string> {
  const name = `${slug(s.keyword)}-kit`;
  const rules = designRules(s, f, mode);
  const kw = clean(s.keyword);
  const { passing, pairs } = shadcnVars(s, mode);
  const readme = [
    `# ${kw} kit`,
    "",
    `Made with Atlas Trend from ${f.examples} real examples. Theme mode: ${mode}. Text contrast: ${passing} of ${pairs.length} pairs pass WCAG AA.`,
    "",
    "## Using an AI coding tool?",
    "- **Claude Code**: copy `ai-tools/CLAUDE.md` into your project root (or paste it into your existing CLAUDE.md).",
    "- **Cursor**: copy the `ai-tools/.cursor/` folder into your project root.",
    "- **Codex and other agents**: copy `ai-tools/AGENTS.md` into your project root.",
    "- **v0, Lovable, Bolt**: paste `ai-tools/v0-lovable-prompt.md` at the start of your chat.",
    "",
    "## Using shadcn/ui?",
    "Replace the theme part of your `app/globals.css` (the `:root` block and `@theme inline`) with `shadcn/globals.css`.",
    "",
    "## Anything else?",
    "`design-system/design-system.css` has every value as CSS variables. `guide.html` shows the whole system.",
    "",
  ].join("\n");
  return {
    [`${name}/README.md`]: readme,
    [`${name}/ai-tools/CLAUDE.md`]: rules,
    [`${name}/ai-tools/AGENTS.md`]: rules,
    [`${name}/ai-tools/.cursor/rules/design.mdc`]: `---\ndescription: Design rules for all UI in this project (${kw})\nglobs: ["**/*.{tsx,jsx,ts,js,html,css,vue,svelte}"]\nalwaysApply: true\n---\n\n${rules}`,
    [`${name}/ai-tools/v0-lovable-prompt.md`]: `Build all UI in this conversation in the ${kw} style, following these design rules exactly:\n\n${rules}`,
    [`${name}/shadcn/globals.css`]: shadcnCss(s, mode),
    [`${name}/design-system/design-system.css`]: systemCss(s),
    [`${name}/design-system/preset.js`]: systemTailwind(s),
    [`${name}/design-system/tokens.json`]: systemJson(s),
    [`${name}/design-system/guide.html`]: systemHtml(s),
  };
}
