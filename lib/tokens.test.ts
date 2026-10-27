import { expect, test } from "vitest";
import { buildTokens, deriveTheme, motionCurve, surfaceFamily } from "./tokens";
import type { StyleKit } from "./types";

const kit: StyleKit = {
  summary: "s", palette: [{ name: "Deep ground", hex: "#0E1530" }],
  typography: { display: "Rounded grotesk, light", body: "Neutral sans", notes: "" },
  radius: 24, blur: 20, motion: { curve: "spring with slight overshoot", duration_ms: 400, notes: "" },
  related: [],
};
const palette = [
  { hex: "#0E1530", share: 0.5, name: "Deep ground" },
  { hex: "#7FB2FF", share: 0.3, name: null },
  { hex: "#E9F2FF", share: 0.2, name: null },
];

test("motion words map to real curves; explicit cubic-beziers pass through", () => {
  expect(motionCurve("spring with slight overshoot")).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
  expect(motionCurve("cubic-bezier(.2,.8,.2,1)")).toBe("cubic-bezier(.2,.8,.2,1)");
  expect(motionCurve("linear marquee")).toBe("linear");
  expect(motionCurve("whatever")).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
});

test("theme uses the dominant colour as ground, the most saturated as accent, readable text", () => {
  const t = deriveTheme(kit, palette);
  expect(t.ground).toBe("#0E1530");
  expect(t.accent).toBe("#7FB2FF");
  expect(t.text).toBe("#FFFFFF");
  expect(t.glass).toBe(true);
  expect(t.fontWeight).toBe(300);
});

test("token files contain every colour and the shape and motion values", () => {
  const { css, tailwind, json } = buildTokens("liquid glass", kit, palette);
  expect(css).toContain("--color-deep-ground: #0E1530;");
  expect(css).toContain("--color-2: #7FB2FF;");
  expect(css).toContain("--radius: 24px;");
  expect(css).toContain("--blur: 20px;");
  expect(tailwind).toContain('"deep-ground": "#0E1530"');
  expect(JSON.parse(json).motion.duration).toBe("400ms");
});

test("model text cannot inject CSS through token values", () => {
  const evil = { ...kit, motion: { ...kit.motion, curve: "ease; } body { display:none" } };
  expect(buildTokens("x", evil, palette).css).not.toContain("display:none");
});

test("two colours with the same name never produce duplicate token names", () => {
  const dup = [{ hex: "#111111", share: 0.5, name: "Ink" }, { hex: "#222222", share: 0.5, name: "Ink" }];
  const { css } = buildTokens("x", kit, dup);
  expect(css).toContain("--color-ink: #111111;");
  expect(css).toContain("--color-2: #222222;");
});

test("the type specimen uses a colour readable on white, and the display traits pick the font", () => {
  const light = [{ hex: "#FDFDFD", share: 0.6, name: null }, { hex: "#191919", share: 0.4, name: null }];
  const mixed = { ...kit, typography: { display: "Heavy wide grotesque", body: "Neutral sans plus monospace for labels", notes: "" } };
  const t = deriveTheme(mixed, light);
  expect(t.ink).toBe("#191919");
  expect(t.fontFamily).toBe("system-ui, sans-serif");
  expect(t.fontWeight).toBe(800);
});

test("the component stage material follows the trend, not just the blur value", () => {
  expect(surfaceFamily({ ...kit, summary: "Puffy clay cards with soft inner shadows", blur: 12 })).toBe("clay");
  expect(surfaceFamily({ ...kit, summary: "Frosted translucent glass panels", blur: 20 })).toBe("glass");
  expect(surfaceFamily({ ...kit, summary: "Thick borders and hard shadows", blur: 0 })).toBe("flat");
});
