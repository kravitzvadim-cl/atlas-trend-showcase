// Proof for "Use in my project": give a model ONLY the exported CLAUDE.md and ask it to build a landing page.
// Paid (Haiku 5.5, owner cap $0.15 for 2–3 trends). Run: npx tsx scripts/proof-kit.mts neo-brutalism liquid-glass claymorphism
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { buildSystem } from "../lib/designSystem";
import { designRules, modeFor, type Facts } from "../lib/projectKit";
import { deriveTheme } from "../lib/tokens";
import type { SavedBoard } from "../lib/run";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const CAP = 0.15;
let spent = 0;
mkdirSync("docs/proof", { recursive: true });

for (const slug of process.argv.slice(2)) {
  if (spent >= CAP * 0.8) { console.log("stopping near the cap"); break; }
  const b = JSON.parse(readFileSync(`public/showcases/${slug}.json`, "utf8")) as SavedBoard;
  const named = b.board!.palette.map((p) => ({ ...p, name: null }));
  const s = buildSystem(b.keyword, b.kit!, named, [], []);
  const kept = b.verdicts.filter((v) => v.keep);
  const facts: Facts = {
    kept: kept.map((v) => v.reason), avoided: b.verdicts.filter((v) => !v.keep).map((v) => v.reason), examples: kept.length,
    sites: new Set(kept.map((v) => new URL(v.url).hostname)).size, summary: b.kit!.summary, typography: b.kit!.typography, motionNotes: b.kit!.motion.notes,
  };
  const rules = designRules(s, facts, modeFor(deriveTheme(b.kit!, named).ground));
  writeFileSync(`docs/proof/${slug}-CLAUDE.md`, rules);
  const t0 = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "content-type": "application/json", "x-title": "Atlas Trend proof" },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-5.5",
      max_tokens: 12000,
      messages: [
        { role: "system", content: `You are a front-end developer. The project's CLAUDE.md follows; obey it for every design decision.\n\n${rules}` },
        { role: "user", content: "Build a single-file HTML landing page for a fictional note-taking app called Fieldnote: a header with nav, a hero with headline and two buttons, three feature cards, a pricing section with two plans, an email sign-up form, and a footer. Inline CSS in one <style> tag, use the fonts link from the rules, no JavaScript. Reply with only the HTML." },
      ],
    }),
  });
  const body = await res.json();
  const usd = body.usage?.cost ?? null;
  spent += usd ?? 0;
  const html = String(body.choices?.[0]?.message?.content ?? "").replace(/^```html\s*|```\s*$/g, "");
  writeFileSync(`docs/proof/${slug}-page.html`, html);
  appendFileSync("docs/runs/proof-kit.ndjson", JSON.stringify({ at: new Date().toISOString(), slug, status: res.status, usd, ms: Date.now() - t0, tokens: body.usage }) + "\n");
  console.log(`${slug}: ${res.status}, $${usd}, ${((Date.now() - t0) / 1000).toFixed(1)}s, ${html.length} chars`);
}
console.log(`total measured: $${spent.toFixed(4)}`);
