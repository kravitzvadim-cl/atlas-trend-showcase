import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { boardFromEvents, fresh, fromSaved, mergeRuns, type Run } from "./run";
import type { RunEvent } from "./types";

const events = readFileSync("public/fixtures/sample-run.ndjson", "utf8").trim().split("\n").map((l) => JSON.parse(l) as RunEvent);

test("a finished run becomes a saved board and opens again as a finished run", () => {
  const saved = boardFromEvents("liquid glass", events, "id1", "2026-10-16T00:00:00Z");
  expect(saved).toMatchObject({ v: 1, id: "id1", keyword: "liquid glass" });
  expect(saved!.board!.palette.length).toBe(5);
  const run = fromSaved(saved!);
  expect(run.done).toBe(true);
  expect(run.steps.kit.status).toBe("done");
});

test("a run without a board is not saved", () => {
  expect(boardFromEvents("x", events.filter((e) => e.type !== "board"), "id", "d")).toBeNull();
});

test("adding more merges new examples, skips duplicates, keeps the kit and adds up the cost", () => {
  const base = fromSaved(boardFromEvents("liquid glass", events, "b", "d")!);
  const dupe = base.verdicts.find((v) => v.keep)!;
  const extra: Run = {
    ...fresh("glass tab bar"),
    done: true,
    sources: [{ url: "https://new.com", title: "New" }],
    verdicts: [dupe, { url: "https://new.com", image: "https://new.com/a.png", keep: true, reason: "glass tabs" }],
    board: { palette: [], thumbs: { "https://new.com/a.png": "data:x" } },
    cost: { type: "cost", usd: 0.02, inputTokens: 10, outputTokens: 1, searches: null, ms: 1000, models: ["m"] },
  };
  const merged = mergeRuns(base, extra, [{ hex: "#000000", share: 1 }]);
  expect(merged.verdicts.length).toBe(base.verdicts.length + 1);
  expect(merged.kit).toEqual(base.kit);
  expect(merged.board!.thumbs["https://new.com/a.png"]).toBe("data:x");
  expect(merged.added).toEqual(["glass tab bar"]);
  expect(merged.cost!.searches).toBeNull();
});
