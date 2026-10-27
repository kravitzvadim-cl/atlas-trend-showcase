import { expect, test } from "vitest";
import { assess } from "./quality";
import type { StyleKit, Verdict } from "./types";

const kit = { palette: [{ name: "a", hex: "#0E1530" }, { name: "b", hex: "#7FB2FF" }, { name: "c", hex: "#FF0000" }] } as StyleKit;
const v = (host: string, n: number, keep = true): Verdict => ({ url: `https://${host}/p`, image: `https://${host}/${n}.png`, keep, reason: "r" });

test("many kept examples from varied sources with confirmed colours score strong", () => {
  const verdicts = ["a.com", "b.com", "c.com", "d.com"].flatMap((h) => [v(h, 1), v(h, 2)]).concat([v("x.com", 1, false), v("y.com", 1, false)]);
  const q = assess(verdicts, kit, [{ hex: "#0E1530", share: 0.5 }, { hex: "#80B0FF", share: 0.3 }, { hex: "#FF0505", share: 0.2 }]);
  expect(q.label).toBe("Strong");
  expect(q.signals.find((s) => s.id === "colours")!.detail).toBe("pixels confirm 3 of 3 model colours");
});

test("a board built from one site with few examples is called thin, and says why", () => {
  const q = assess([v("a.com", 1), v("a.com", 2), v("a.com", 3, false)], kit, [{ hex: "#000000", share: 1 }]);
  expect(q.label).toBe("Thin");
  expect(q.signals.find((s) => s.id === "sources")!.level).toBe("thin");
});

test("fetch failures do not count against the judge's keep rate", () => {
  const verdicts = [v("a.com", 1), v("b.com", 1), { url: "https://c.com", keep: false, reason: "no images found" }];
  expect(assess(verdicts, undefined, []).signals.find((s) => s.id === "keep")!.detail).toBe("2 of 2 judged images kept");
});
