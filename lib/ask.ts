import { z } from "zod";
import { validateKeyword } from "./validate";

// "Ask Scout": the model only picks actions; the app draws every component from its own templates.
export const CATALOG = {
  buttons: "Buttons",
  input: "Text input",
  search: "Search field",
  card: "Card",
  pricing: "Pricing card",
  toggle: "Toggles",
  checkbox: "Checkboxes",
  tabs: "Tabs",
  badge: "Badges",
  alert: "Alert",
  modal: "Modal",
  avatar: "Avatars",
  progress: "Progress bar",
  slider: "Slider",
  toast: "Toast",
} as const;
export type ComponentId = keyof typeof CATALOG;
const IDS = Object.keys(CATALOG) as [ComponentId, ...ComponentId[]];
const isComponent = (v: unknown): v is ComponentId => typeof v === "string" && Object.hasOwn(CATALOG, v);

// Google Fonts Scout may pick from (an allowlist: font names end up in CSS and in a Google Fonts URL).
export const FONTS = [
  "Inter", "Manrope", "DM Sans", "Plus Jakarta Sans", "Space Grotesk", "Sora", "Outfit", "Urbanist", "Poppins", "Lexend",
  "Work Sans", "IBM Plex Sans", "Rubik", "Archivo", "Archivo Black", "Syne", "Unbounded", "Bricolage Grotesque", "Nunito",
  "Quicksand", "Fredoka", "Baloo 2", "Lilita One", "Righteous", "Bebas Neue", "Anton", "Chakra Petch", "Orbitron",
  "Playfair Display", "Fraunces", "DM Serif Display", "Instrument Serif", "Libre Baskerville", "Space Mono", "JetBrains Mono", "IBM Plex Mono",
] as const;
export type FontName = (typeof FONTS)[number];
export type FontRole = "display" | "body";
const isFont = (v: unknown): v is FontName => typeof v === "string" && (FONTS as readonly string[]).includes(v);
const isRole = (v: unknown): v is FontRole => v === "display" || v === "body";

export type ExtraColor = { name: string; hex: string; note: string };
export type ExtraFont = { family: FontName; role: FontRole };
// system: present once the board has been turned into a design system; holds Scout's tweaks.
export type SystemTweaks = { ratio?: number; spacing?: 4 | 8; radius?: number };
export type Extras = { components: ComponentId[]; colors: ExtraColor[]; fonts?: ExtraFont[]; system?: SystemTweaks }; // fonts/system: absent on older boards
export const emptyExtras: Extras = { components: [], colors: [], fonts: [] };

export const AskSchema = z.strictObject({
  reply: z.string().describe("One short, friendly sentence (max 25 words): what you did, or why you couldn't and the closest thing you can do"),
  actions: z
    .array(
      z.strictObject({
        type: z.enum(["add_component", "remove_component", "add_color", "remove_color", "set_font", "remove_font", "make_system", "set_type_scale", "set_spacing", "set_radius"]),
        component: z.enum([...IDS, "none"]).describe("For component actions; 'none' for colour actions"),
        name: z.string().describe("add_color: a short colour name, e.g. 'Soft sky'; empty otherwise"),
        hex: z.string().describe("Colour actions: #RRGGBB; empty otherwise"),
        note: z.string().describe("add_color: its role in at most 4 words, e.g. 'softer accent'; empty otherwise"),
        font: z.enum([...FONTS, "none"]).describe("set_font: the font family; 'none' otherwise"),
        role: z.enum(["display", "body", "none"]).describe("Font actions: display (headings) or body (text); 'none' otherwise"),
        value: z.number().describe("set_type_scale: ratio 1.125–1.5 (bigger = more contrast between sizes); set_spacing: 4 or 8; set_radius: corner size in px 0–32; 0 otherwise"),
      }),
    )
    .describe("At most 6 actions, in the order asked"),
});
export type AskAnswer = z.infer<typeof AskSchema>;

export const MAX_COLORS = 8;
const MAX_ACTIONS = 6;
const HEX = /^#[0-9a-f]{6}$/i;
const label = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/[\r\n<>]+/g, " ").trim().slice(0, max) : "");

// Model output is untrusted: unknown components, bad colours and duplicates are dropped, never rendered.
export function applyActions(extras: Extras, actions: AskAnswer["actions"]): Extras {
  let { components, colors } = extras;
  let fonts = extras.fonts ?? [];
  let system = extras.system;
  for (const a of actions.slice(0, MAX_ACTIONS)) {
    if (a.type === "add_component" && isComponent(a.component) && !components.includes(a.component)) components = [...components, a.component];
    if (a.type === "remove_component") components = components.filter((c) => c !== a.component);
    const hex = HEX.test(a.hex) ? a.hex.toUpperCase() : null;
    if (a.type === "add_color" && hex && colors.length < MAX_COLORS && !colors.some((c) => c.hex === hex))
      colors = [...colors, { hex, name: label(a.name, 30) || hex, note: label(a.note, 40) }];
    if (a.type === "remove_color" && hex) colors = colors.filter((c) => c.hex !== hex);
    // One font per role: setting a role replaces what was there.
    if (a.type === "set_font" && isFont(a.font) && isRole(a.role)) fonts = [...fonts.filter((f) => f.role !== a.role), { family: a.font, role: a.role }];
    if (a.type === "remove_font" && isRole(a.role)) fonts = fonts.filter((f) => f.role !== a.role);
    // Design system: tweaking it also creates it; out-of-range values are ignored.
    if (a.type === "make_system") system = system ?? {};
    if (a.type === "set_type_scale" && a.value >= 1.125 && a.value <= 1.5) system = { ...system, ratio: Math.round(a.value * 1000) / 1000 };
    if (a.type === "set_spacing" && (a.value === 4 || a.value === 8)) system = { ...system, spacing: a.value };
    if (a.type === "set_radius" && a.value >= 0 && a.value <= 32) system = { ...system, radius: Math.round(a.value) };
  }
  return { components, colors, fonts, ...(system ? { system } : {}) };
}

export type AskRequest = { keyword: string; request: string; summary: string; typeTraits: string; palette: string[]; extras: Extras };

// Everything the browser sends is re-validated here.
export function parseAskRequest(body: unknown): AskRequest | null {
  const b = body as Partial<Record<keyof AskRequest, unknown>> | null;
  const keyword = validateKeyword(b?.keyword);
  const request = typeof b?.request === "string" ? b.request.replace(/\s+/g, " ").trim() : "";
  if (!keyword || request.length < 2 || request.length > 200) return null;
  if (!Array.isArray(b?.palette) || b.palette.length > 12 || !b.palette.every((h) => typeof h === "string" && HEX.test(h))) return null;
  const ex = (b?.extras ?? {}) as Partial<Record<keyof Extras, unknown>>;
  const components = Array.isArray(ex.components) ? ex.components.filter(isComponent) : [];
  const colors: ExtraColor[] = [];
  for (const c of (Array.isArray(ex.colors) ? ex.colors : []).slice(0, MAX_COLORS) as Partial<ExtraColor>[]) {
    const hex = typeof c?.hex === "string" && HEX.test(c.hex) ? c.hex.toUpperCase() : null;
    if (hex && !colors.some((x) => x.hex === hex)) colors.push({ hex, name: label(c.name, 30) || hex, note: label(c.note, 40) });
  }
  const fonts: ExtraFont[] = [];
  for (const f of (Array.isArray(ex.fonts) ? ex.fonts : []) as Partial<ExtraFont>[])
    if (isFont(f?.family) && isRole(f?.role) && !fonts.some((x) => x.role === f.role)) fonts.push({ family: f.family, role: f.role });
  const sys = ex.system as SystemTweaks | undefined;
  const system = sys && typeof sys === "object" ? applyActions(emptyExtras, [
    { type: "make_system", component: "none", name: "", hex: "", note: "", font: "none", role: "none", value: 0 },
    ...([["set_type_scale", sys.ratio], ["set_spacing", sys.spacing], ["set_radius", sys.radius]] as const)
      .filter(([, v]) => typeof v === "number")
      .map(([type, v]) => ({ type, component: "none" as const, name: "", hex: "", note: "", font: "none" as const, role: "none" as const, value: v as number })),
  ]).system : undefined;
  return { keyword, request, summary: label(b?.summary, 300), typeTraits: label(b?.typeTraits, 200), palette: b.palette as string[], extras: { components, colors, fonts, ...(system ? { system } : {}) } };
}
