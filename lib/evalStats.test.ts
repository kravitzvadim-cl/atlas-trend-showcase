import { expect, test } from "vitest";
import { scoreLabels } from "./evalStats";

const item = (trend: string, kept: boolean, label: "correct" | "wrong" | "unsure") => ({ trend, kept, label });

test("accuracy, precision and recall come from the owner's labels; unsure is left out", () => {
  const s = scoreLabels([
    item("a", true, "correct"), // true keep
    item("a", true, "wrong"), // kept but should not be
    item("a", false, "correct"), // true reject
    item("a", false, "wrong"), // rejected but was good
    item("a", false, "unsure"),
  ]);
  expect(s.overall).toMatchObject({ labelled: 4, unsure: 1, accuracy: 0.5, precision: 0.5, recall: 0.5 });
});

test("results are broken down per trend", () => {
  const s = scoreLabels([item("x", true, "correct"), item("y", true, "wrong")]);
  expect(s.byTrend.x.accuracy).toBe(1);
  expect(s.byTrend.y.accuracy).toBe(0);
});

test("no labels gives empty results, not NaN", () => {
  expect(scoreLabels([]).overall).toMatchObject({ labelled: 0, accuracy: null, precision: null, recall: null });
});
