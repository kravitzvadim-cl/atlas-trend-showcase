// Builds the ready-made boards shown on the home screen. Spends real OpenRouter credit (one live search per keyword).
// Usage: node --experimental-strip-types scripts/build-showcases.mts [port] — needs `npm run dev` running.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { boardFromEvents } from "../lib/run.ts";

const ALL = ["liquid glass", "neo brutalism", "bento grid", "kinetic typography", "claymorphism"];
const port = process.argv[2] ?? "3100";
// Optional: rebuild only some boards, e.g. `... 3100 "bento grid"`; the others stay as they are.
const KEYWORDS = process.argv.length > 3 ? process.argv.slice(3) : ALL;
const slug = (k: string) => k.toLowerCase().replace(/[^a-z0-9]+/g, "-");
mkdirSync("public/showcases", { recursive: true });

const index: { slug: string; keyword: string; set: string; colours: string[] }[] = existsSync("public/showcases/index.json") && KEYWORDS !== ALL ? JSON.parse(readFileSync("public/showcases/index.json", "utf8")) : [];
let spent = 0;
for (const keyword of KEYWORDS) {
  const res = await fetch(`http://localhost:${port}/api/research`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ keyword }) });
  const events = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
  const cost = events.find((e) => e.type === "cost");
  spent += cost?.usd ?? 0;
  const board = boardFromEvents(keyword, events, `showcase-${slug(keyword)}`, new Date().toISOString());
  if (!board) {
    console.log(`✗ ${keyword}: no board (${events.find((e) => e.type === "error")?.message ?? "nothing kept"})`);
    continue;
  }
  writeFileSync(`public/showcases/${slug(keyword)}.json`, JSON.stringify(board));
  const entry = { slug: slug(keyword), keyword, set: `AT-${String(ALL.indexOf(keyword) + 1 || index.length + 1).padStart(3, "0")}`, colours: board.board!.palette.map((p) => p.hex) };
  const at = index.findIndex((e) => e.slug === entry.slug);
  if (at >= 0) index[at] = entry;
  else index.push(entry);
  console.log(`✓ ${keyword}: ${board.verdicts.filter((v) => v.keep).length} kept, $${(cost?.usd ?? 0).toFixed(4)}`);
}
writeFileSync("public/showcases/index.json", JSON.stringify(index, null, 2));
console.log(`Done. ${KEYWORDS.length} rebuilt, ${index.length} boards in total, total $${spent.toFixed(4)}`);
