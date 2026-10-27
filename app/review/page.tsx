"use client";

import { useCallback, useEffect, useState } from "react";
import { scoreLabels, type Label } from "@/lib/evalStats";
import type { SavedBoard } from "@/lib/run";

type Item = { id: string; trend: string; image: string; thumb: string; url: string; kept: boolean; reason: string };
const KEY = "atlas-review-labels";
const pct = (n: number | null) => (n == null ? "–" : `${Math.round(n * 100)}%`);

export default function Review() {
  const [items, setItems] = useState<Item[]>([]);
  const [labels, setLabels] = useState<Record<string, Label>>({});
  const [i, setI] = useState(0);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    try {
      setLabels(JSON.parse(localStorage.getItem(KEY) ?? "{}"));
    } catch {}
    (async () => {
      const index: { slug: string }[] = await fetch("/showcases/index.json").then((r) => r.json()).catch(() => []);
      const all: Item[] = [];
      for (const { slug } of index) {
        const b: SavedBoard = await fetch(`/showcases/${slug}.json`).then((r) => r.json());
        for (const v of b.verdicts)
          if (v.image) all.push({ id: `${slug}|${v.image}`, trend: b.keyword, image: v.image, thumb: b.board?.thumbs[v.image] ?? v.image, url: v.url, kept: v.keep, reason: v.reason });
      }
      setItems(all);
    })();
  }, []);

  const label = useCallback(
    (l: Label) => {
      const it = items[i];
      if (!it) return;
      const next = { ...labels, [it.id]: l };
      setLabels(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      setI((n) => Math.min(n + 1, items.length - 1));
    },
    [i, items, labels],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") label("correct");
      if (e.key === "2") label("wrong");
      if (e.key === "3") label("unsure");
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
      if (e.key === "ArrowRight") setI((n) => Math.min(items.length - 1, n + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [label, items.length]);

  const done = items.filter((it) => labels[it.id]);
  const results = scoreLabels(done.map((it) => ({ trend: it.trend, kept: it.kept, label: labels[it.id] })));
  const it = items[i];

  async function save() {
    const payload = done.map((d) => ({ id: d.id, trend: d.trend, image: d.image, url: d.url, kept: d.kept, reason: d.reason, label: labels[d.id] }));
    const res = await fetch("/api/labels", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: payload }) }).catch(() => null);
    setSaved(res?.ok ? `Saved ${payload.length} labels to docs/eval/labels.json` : "Couldn't save (only works on your local dev server)");
  }

  return (
    <main className="review">
      <header className="review-top">
        <a href="/" className="logo">Atlas Trend</a>
        <h1>Review Scout's verdicts</h1>
        <p className="muted">You are the ground truth. Was Scout right to keep or set aside each image? Keys: 1 correct · 2 wrong · 3 not sure · ← →</p>
        <div className="progress" aria-label={`${done.length} of ${items.length} reviewed`}>
          <span style={{ transform: `scaleX(${items.length ? done.length / items.length : 0})` }} />
        </div>
        <p className="mono small">{done.length} / {items.length} reviewed</p>
      </header>

      {it && (
        <section className="rcard">
          <a href={it.url} target="_blank" rel="noopener noreferrer" className="rimg">
            <img src={it.thumb} alt={`Example for ${it.trend}: ${it.reason} (opens the source page)`} referrerPolicy="no-referrer" />
          </a>
          <div className="rbody">
            <p className={`verdict ${it.kept ? "kept" : "aside"}`}>Scout {it.kept ? "kept" : "set aside"} this</p>
            <p className="mono small muted">{it.trend} · {i + 1} of {items.length}</p>
            <p className="reason">“{it.reason}”</p>
            <div className="rbtns">
              <button className={`btn${labels[it.id] === "correct" ? " on" : ""}`} onClick={() => label("correct")}>1 · Scout was right</button>
              <button className={`btn-outline${labels[it.id] === "wrong" ? " on" : ""}`} onClick={() => label("wrong")}>2 · Scout was wrong</button>
              <button className={`ghost${labels[it.id] === "unsure" ? " on" : ""}`} onClick={() => label("unsure")}>3 · Not sure</button>
            </div>
          </div>
        </section>
      )}

      <section className="results">
        <h2>Results so far</h2>
        <table>
          <thead>
            <tr><th>Trend</th><th>Labelled</th><th>Accuracy</th><th>Precision (kept were good)</th><th>Recall (good were kept)</th></tr>
          </thead>
          <tbody>
            {Object.entries(results.byTrend).map(([t, s]) => (
              <tr key={t}><td>{t}</td><td className="mono">{s.labelled}</td><td className="mono">{pct(s.accuracy)}</td><td className="mono">{pct(s.precision)}</td><td className="mono">{pct(s.recall)}</td></tr>
            ))}
            <tr className="total"><td>All</td><td className="mono">{results.overall.labelled}</td><td className="mono">{pct(results.overall.accuracy)}</td><td className="mono">{pct(results.overall.precision)}</td><td className="mono">{pct(results.overall.recall)}</td></tr>
          </tbody>
        </table>
        <button className="btn" onClick={save} disabled={!done.length}>Save labels for evaluation</button>
        {saved && <p className="small muted" role="status">{saved}</p>}
      </section>
    </main>
  );
}
