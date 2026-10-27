import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { buildSystem } from "./designSystem";
import { designRules, modeFor, projectKit, shadcnVars, type Facts } from "./projectKit";
import type { SavedBoard } from "./run";
import { zip } from "./zip";

const boards = ["liquid-glass", "neo-brutalism", "bento-grid", "kinetic-typography", "claymorphism"].map(
  (s) => JSON.parse(readFileSync(`public/showcases/${s}.json`, "utf8")) as SavedBoard,
);
const sys = (b: SavedBoard) => buildSystem(b.keyword, b.kit!, b.board!.palette.map((p) => ({ ...p, name: null })), [], []);
const facts = (b: SavedBoard): Facts => ({
  kept: b.verdicts.filter((v) => v.keep).map((v) => v.reason), avoided: b.verdicts.filter((v) => !v.keep).map((v) => v.reason),
  examples: b.verdicts.filter((v) => v.keep).length, sites: 3, summary: b.kit!.summary, typography: b.kit!.typography, motionNotes: b.kit!.motion.notes,
});

test("every showcase theme passes WCAG AA on every text pair, in both modes", () => {
  for (const b of boards) for (const mode of ["light", "dark"] as const) {
    const { pairs, passing } = shadcnVars(sys(b), mode);
    expect(passing, `${b.keyword} ${mode}: ${JSON.stringify(pairs.filter((p) => p.ratio < 4.5))}`).toBe(pairs.length);
  }
});

test("mode follows the board's background", () => {
  expect(modeFor("#FDFCFC")).toBe("light");
  expect(modeFor("#101014")).toBe("dark");
});

test("the rules carry the real values and the board's own reasons", () => {
  const b = boards[1], s = sys(b), rules = designRules(s, facts(b), "light");
  expect(rules).toContain(`**${s.fonts.display}**`);
  expect(rules).toContain(s.roles[0].ramp.find((x) => x.base)!.hex);
  expect(rules).toContain("## What is NOT this style (avoid)");
  expect(rules).not.toMatch(/no images found/i);
});

test("the ZIP holds every file and unzips cleanly", () => {
  const b = boards[0], files = projectKit(sys(b), facts(b), "dark");
  expect(Object.keys(files).map((k) => k.split("/").slice(1).join("/")).sort()).toEqual([
    "README.md", "ai-tools/.cursor/rules/design.mdc", "ai-tools/AGENTS.md", "ai-tools/CLAUDE.md", "ai-tools/v0-lovable-prompt.md",
    "design-system/design-system.css", "design-system/guide.html", "design-system/preset.js", "design-system/tokens.json", "shadcn/globals.css",
  ]);
  const dir = mkdtempSync(join(tmpdir(), "kit-"));
  writeFileSync(join(dir, "kit.zip"), zip(files));
  execFileSync("unzip", ["-q", "-o", "kit.zip"], { cwd: dir });
  const name = Object.keys(files)[0].split("/")[0];
  expect(readFileSync(join(dir, name, "shadcn/globals.css"), "utf8")).toBe(files[`${name}/shadcn/globals.css`]);
  expect(readFileSync(join(dir, name, "ai-tools/.cursor/rules/design.mdc"), "utf8")).toMatch(/^---\ndescription:/);
});

test("each material gets a concrete CSS recipe", () => {
  const glass = designRules(sys(boards[0]), facts(boards[0]), "light");
  expect(glass).toContain("## Surface recipe: glass");
  expect(glass).toMatch(/backdrop-filter: blur\(\d+px\)/);
  expect(glass).toContain(".glass-backdrop");
  expect(designRules(sys(boards[1]), facts(boards[1]), "light")).toContain("box-shadow: 4px 4px 0 #111111");
  expect(designRules(sys(boards[4]), facts(boards[4]), "light")).toContain("## Surface recipe: clay");
});
