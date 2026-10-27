import { expect, test } from "vitest";
import { snapshotDocument, fileName } from "./exportBoard";

test("the snapshot is a complete standalone page with the board and its styles", () => {
  const html = snapshotDocument("liquid glass", ".x{color:red}", '<div class="board">hi</div>', "16 Oct 2026");
  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain("<style>.x{color:red}</style>");
  expect(html).toContain('<div class="board">hi</div>');
  expect(html).toContain("<title>liquid glass · Atlas Trend</title>");
});

test("the keyword cannot break out of the page title", () => {
  expect(snapshotDocument("</title><script>x</script>", "", "", "d")).not.toContain("<script>x</script>");
});

test("file names are safe and readable", () => {
  expect(fileName("Liquid Glass / 2026!")).toBe("atlas-trend-liquid-glass-2026.html");
});
