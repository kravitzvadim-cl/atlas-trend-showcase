import { nearestName } from "./color";
import type { StyleKit, Verdict } from "./types";

export type Level = "good" | "ok" | "thin";
export type Signal = { id: string; name: string; level: Level; detail: string };

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};
const POINTS: Record<Level, number> = { good: 1, ok: 0.6, thin: 0.2 };

// Heuristic, free, explainable: built only from what the run already recorded. Not a human review.
export function assess(verdicts: Verdict[], kit: StyleKit | undefined, palette: { hex: string; share: number }[]) {
  const kept = verdicts.filter((v) => v.keep);
  const judged = verdicts.filter((v) => v.image); // fetch failures have no image and were never judged
  const hosts = new Map<string, number>();
  for (const v of kept) hosts.set(host(v.url), (hosts.get(host(v.url)) ?? 0) + 1);
  const top = Math.max(0, ...hosts.values());

  const signals: Signal[] = [
    { id: "examples", name: "Examples", level: kept.length >= 8 ? "good" : kept.length >= 4 ? "ok" : "thin", detail: `${kept.length} kept` },
    { id: "sources", name: "Sources", level: hosts.size >= 4 ? "good" : hosts.size >= 2 ? "ok" : "thin", detail: `${hosts.size} different site${hosts.size === 1 ? "" : "s"}` },
    {
      id: "balance",
      name: "Balance",
      level: !kept.length ? "thin" : top / kept.length <= 0.5 ? "good" : top / kept.length <= 0.7 ? "ok" : "thin",
      detail: kept.length ? `largest source gives ${Math.round((top / kept.length) * 100)}%` : "nothing kept",
    },
    {
      id: "keep",
      name: "Keep rate",
      level: !judged.length ? "thin" : kept.length / judged.length >= 0.3 ? "good" : kept.length / judged.length >= 0.15 ? "ok" : "thin",
      detail: `${kept.length} of ${judged.length} judged images kept`,
    },
  ];
  if (kit?.palette.length && palette.length) {
    const hit = kit.palette.filter((c) => nearestName(c.hex, palette.map((p) => ({ name: p.hex, hex: p.hex })))).length;
    const r = hit / kit.palette.length;
    signals.push({ id: "colours", name: "Colours", level: r >= 0.7 ? "good" : r >= 0.4 ? "ok" : "thin", detail: `pixels confirm ${hit} of ${kit.palette.length} model colours` });
  }
  const score = Math.round((signals.reduce((t, s) => t + POINTS[s.level], 0) / signals.length) * 100);
  return { score, label: score >= 80 ? "Strong" : score >= 55 ? "Fair" : "Thin", signals };
}
