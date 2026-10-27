import { expect, test } from "vitest";
import { contrast, quantize, readableText, nearestName } from "./color";

test("contrast follows WCAG: black on white is 21", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
  expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
});

test("readable text picks white on dark grounds and ink on light ones", () => {
  expect(readableText("#0E1530")).toBe("#FFFFFF");
  expect(readableText("#E9F2FF")).toBe("#111827");
});

function pixels(...runs: [string, number][]) {
  const out: number[] = [];
  for (const [hex, n] of runs) for (let i = 0; i < n; i++) out.push(...[1, 3, 5].map((j) => parseInt(hex.slice(j, j + 2), 16)));
  return new Uint8Array(out);
}

test("quantize finds the dominant colours with their share, biggest first", () => {
  const p = quantize(pixels(["#0E1530", 600], ["#7FB2FF", 300], ["#FFD8EC", 100]), 6);
  expect(p.map((c) => c.hex)).toEqual(["#0E1530", "#7FB2FF", "#FFD8EC"]);
  expect(p.map((c) => Math.round(c.share * 100))).toEqual([60, 30, 10]);
});

test("near-identical shades merge instead of filling the palette with duplicates", () => {
  const p = quantize(pixels(["#7FB2FF", 500], ["#80B4FF", 400], ["#0E1530", 100]), 6);
  expect(p.length).toBe(2);
});

test("a sampled colour borrows the name of the closest colour the model described", () => {
  expect(nearestName("#7DB0FC", [{ name: "Refraction tint", hex: "#7FB2FF" }, { name: "Deep ground", hex: "#0E1530" }])).toBe("Refraction tint");
  expect(nearestName("#FF0000", [{ name: "Deep ground", hex: "#0E1530" }])).toBeNull();
});

test("a small but vivid accent makes the palette even when greys cover most of the images", () => {
  const p = quantize(pixels(["#FDFDFD", 400], ["#C8C8C8", 250], ["#E5E5E4", 200], ["#363636", 100], ["#191919", 30], ["#2918DA", 10], ["#FFE14D", 10]), 6);
  expect(p.map((c) => c.hex)).toContain("#FFE14D");
  expect(p.map((c) => c.hex)).toContain("#2918DA");
});
