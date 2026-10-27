import { expect, test } from "vitest";
import { buildSystem, colourRoles, fromOklch, pickFonts, ramp, systemCss, systemHtml, systemJson, systemTailwind, toOklch } from "./designSystem";
import type { StyleKit } from "./types";

const kit: StyleKit = {
  summary: "Flat, high-contrast blocks with hard black outlines, offset hard drop shadows and bold or oversized type.",
  palette: [], related: [],
  typography: { display: "Heavy, wide grotesque in all caps", body: "Clean neutral grotesque sans-serif", notes: "" },
  radius: 4, blur: 0,
  motion: { curve: "cubic-bezier(0.2, 0.8, 0.2, 1)", duration_ms: 150, notes: "" },
};
const palette = ["#E5E5E4", "#363636", "#FACC27", "#0000FD"].map((hex) => ({ hex, share: 0.25, name: null }));

test("colours survive a trip through OKLCH", () => {
  for (const hex of ["#FACC27", "#0000FD", "#363636", "#FFFFFF", "#000000", "#2BB673"]) expect(fromOklch(toOklch(hex))).toBe(hex);
});

test("a ramp has 10 shades, light to dark, with the original colour in it", () => {
  const r = ramp("#FACC27");
  expect(r.map((x) => x.step)).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
  expect(r.filter((x) => x.base)).toEqual([{ step: 100, hex: "#FACC27", base: true }].map((x) => ({ ...x, step: r.find((y) => y.base)!.step })));
  const L = r.map((x) => toOklch(x.hex)[0]);
  for (let i = 1; i < L.length; i++) expect(L[i]).toBeLessThan(L[i - 1] + 0.02);
});

test("six colour roles, primary first, secondary from a different hue in the palette", () => {
  const roles = colourRoles("#FACC27", palette.map((p) => p.hex));
  expect(roles.map((r) => r.name)).toEqual(["Primary", "Secondary", "Neutral", "Success", "Warning", "Danger"]);
  expect(roles[0].hex).toBe("#FACC27");
  expect(roles[1].hex).toBe("#0000FD");
  expect(roles[2].hex).toBe("#363636");
});

test("fonts: Scout's choice wins, otherwise traits pick from the allowlist", () => {
  expect(pickFonts(kit)).toEqual({ display: "Archivo Black", body: "Inter" }); // "heavy" outranks "wide"
  expect(pickFonts({ ...kit, typography: { ...kit.typography, display: "Chunky black geometric", body: "Classic serif text" } })).toEqual({ display: "Archivo Black", body: "Libre Baskerville" });
  expect(pickFonts(kit, [{ family: "Syne", role: "display" }]).display).toBe("Syne");
  expect(pickFonts({ ...kit, typography: { ...kit.typography, body: "Clean neutral grotesque sans at regular weight, with a monospace accent for labels" } }).body).toBe("Inter");
});

test("a brutalist board gets hard shadows, a bold scale, and tweaks apply", () => {
  const s = buildSystem("neo brutalism", kit, palette, [], []);
  expect(s.shadows[0]).toBe("2px 2px 0 #111111");
  expect(s.ratio).toBe(1.333);
  expect(s.type.find((t) => t.name === "Body")!.px).toBe(16);
  const t = buildSystem("neo brutalism", kit, palette, [], [], { ratio: 1.2, spacing: 8, radius: 12 });
  expect(t.type[0].px).toBe(Math.round(16 * 1.2 ** 5));
  expect(t.spacing.map((x) => x.px)).toEqual([8, 16, 24, 32, 48, 64, 96, 128]);
  expect(t.radius.find((r) => r.name === "md")!.px).toBe(12);
});

test("the four downloads carry the same values", () => {
  const s = buildSystem("neo <brutalism>", kit, palette, ["#FF5FA2"], []);
  const primary500 = s.roles[0].ramp.find((x) => x.step === 500)!.hex;
  expect(systemCss(s)).toContain(`--primary-500: ${primary500};`);
  expect(systemTailwind(s)).toContain(`"500": "${primary500}"`);
  expect(JSON.parse(systemJson(s)).color.primary["500"]).toEqual({ $type: "color", $value: primary500 });
  expect(systemHtml(s)).toContain("neo &lt;brutalism&gt;");
  expect(systemHtml(s)).not.toContain("<brutalism>");
  expect(systemHtml(buildSystem("x</style><script>", kit, palette, [], []))).not.toContain("</style><script>");
});
