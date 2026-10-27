"use client";

import { useEffect, useRef, useState } from "react";
import { Scout, type Mood } from "@/components/Scout";
import { TrendBoard } from "@/components/TrendBoard";
import { AskScout, type ScoutReply } from "@/components/AskScout";
import { applyActions, emptyExtras, type Extras } from "@/lib/ask";
import { downloadSnapshot } from "@/lib/exportBoard";
import { Library, type Showcase } from "@/components/Library";
import { deleteBoard, listBoards, saveBoard } from "@/lib/history";
import { addUsage, fresh, fromSaved, mergeRuns, reduce, toSaved, type Run, type SavedBoard } from "@/lib/run";
import { samplePalette } from "@/lib/samplePalette";
import { assess } from "@/lib/quality";
import type { RunEvent, StepId } from "@/lib/types";

const STEPS: { id: StepId; title: string; hint: string }[] = [
  { id: "search", title: "Search the web", hint: "pages that show the trend" },
  { id: "look", title: "Look at every page", hint: "collect the example images" },
  { id: "judge", title: "Keep the good ones", hint: "set the rest aside, with reasons" },
  { id: "kit", title: "Build the style kit", hint: "colour, type, shape, motion" },
];

async function readStream(res: Response, onEvent: (e: RunEvent) => void, delayMs = 0) {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      onEvent(JSON.parse(line));
    }
  }
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function moodOf(run: Run | null): Mood {
  if (!run) return "idle";
  if (run.error || (run.done && !run.board)) return "confused";
  if (run.done) return "excited";
  return "thinking";
}

// While a run is going, the step after the last finished one is "now", even in the instant before the
// server announces it, so the cobalt row never disappears between steps.
function currentStep(run: Run): StepId | null {
  if (run.done || run.error) return null;
  const active = STEPS.find((s) => run.steps[s.id].status === "active");
  if (active) return active.id;
  return STEPS.find((s) => run.steps[s.id].status === "waiting")?.id ?? null;
}

function statusLine(run: Run | null): [string, string] {
  if (!run) return ["Ready when you are", "Type a trend, like “liquid glass” or “bento grids”"];
  if (run.error) return ["Something went wrong", run.error];
  const now = currentStep(run);
  if (now) {
    const step = STEPS.find((s) => s.id === now)!;
    return [`${step.title}…`, run.steps[now].detail ?? step.hint];
  }
  if (run.done && run.board) return ["Board ready", `Built from ${run.verdicts.filter((v) => v.keep).length} kept examples`];
  if (run.done) return ["Nothing usable found", "Try a more specific trend name"];
  return ["Wrapping up…", ""];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [formError, setFormError] = useState("");
  const [replay, setReplay] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [toast, setToast] = useState({ text: "", n: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const [recent, setRecent] = useState<SavedBoard[]>([]);
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const live = useRef(false); // only boards from real searches go into history
  const savedId = useRef<string | null>(null); // history entry the open board belongs to (null = showcase / unsaved)
  const [adding, setAdding] = useState<{ phrase: string; status: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [scoutReply, setScoutReply] = useState<ScoutReply | null>(null);
  const undoExtras = useRef<Extras | null>(null);

  useEffect(() => {
    listBoards().then(setRecent);
    fetch("/showcases/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then(setShowcases)
      .catch(() => setShowcases([]));
  }, []);

  useEffect(() => {
    if (!live.current || !run?.done) return;
    live.current = false;
    savedId.current = crypto.randomUUID();
    const saved = toSaved(run, savedId.current, new Date().toISOString());
    if (saved) saveBoard(saved).then(() => listBoards().then(setRecent));
  }, [run]);

  function openBoard(b: SavedBoard) {
    savedId.current = b.showcase ? null : b.id;
    setReplay(false);
    setShowProcess(false);
    setInput(b.keyword);
    setScoutReply(null);
    setRun(fromSaved(b));
    window.scrollTo({ top: 0 });
  }

  async function addMore(phrase: string) {
    if (!run?.board || adding || asking) return;
    const base = run;
    let extra = fresh(phrase);
    setAdding({ phrase, status: "searching the web" });
    try {
      const res = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ keyword: phrase, addTo: base.keyword }) });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "The research service is unavailable.");
      await readStream(res, (ev) => {
        extra = reduce(extra, ev);
        if (ev.type === "step" && ev.status === "active") setAdding({ phrase, status: ev.detail.toLowerCase() });
      });
      if (extra.error) throw new Error(extra.error);
      const before = base.verdicts.filter((v) => v.keep).length;
      const thumbs = { ...base.board?.thumbs, ...extra.board?.thumbs };
      const palette = await samplePalette(Object.values(thumbs)).catch(() => base.board!.palette);
      const merged = mergeRuns(base, extra, palette.length ? palette : base.board!.palette);
      setRun(merged);
      const gained = merged.verdicts.filter((v) => v.keep).length - before;
      notify(gained > 0 ? `Added ${gained} example${gained === 1 ? "" : "s"}` : "Nothing new matched this time");
      persist(merged);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn't add more examples");
    } finally {
      setAdding(null);
    }
  }

  // Rebuild the style kit from every kept image on the board (no new search). ~½¢ with Haiku.
  async function refreshKit() {
    if (!run?.board || adding) return;
    const base = run;
    const byHost = new Map<string, { url: string; title: string; thumb: string }[]>();
    for (const v of base.verdicts) {
      const thumb = v.keep && v.image ? base.board!.thumbs[v.image] : undefined;
      if (!thumb?.startsWith("data:")) continue;
      const h = new URL(v.url).hostname;
      byHost.set(h, [...(byHost.get(h) ?? []), { url: v.url, title: base.sources.find((s) => s.url === v.url)?.title ?? h, thumb }]);
    }
    // Round-robin across sites so 20 images still represent the whole board.
    const images: { url: string; title: string; thumb: string }[] = [];
    for (let round = 0; images.length < 20 && [...byHost.values()].some((l) => l[round]); round++)
      for (const list of byHost.values()) if (list[round] && images.length < 20) images.push(list[round]);
    if (!images.length) return notify("No images to build a kit from");
    setAdding({ phrase: "style kit", status: `rebuilding from ${images.length} images` });
    try {
      const res = await fetch("/api/kit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ keyword: base.keyword, images }) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.kit) throw new Error(body?.error ?? "Couldn't rebuild the kit.");
      const usd = base.cost?.usd != null && body.usage?.usd != null ? base.cost.usd + body.usage.usd : null;
      const next: Run = { ...base, kit: body.kit, cost: base.cost && { ...base.cost, usd } };
      setRun(next);
      notify(`Style kit rebuilt from ${images.length} images`);
      persist(next);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn't rebuild the kit");
    } finally {
      setAdding(null);
    }
  }

  // Keep an edited board in history; a showcase becomes your own board once you change it.
  function persist(next: Run) {
    savedId.current ??= crypto.randomUUID();
    const saved = toSaved(next, savedId.current, new Date().toISOString());
    if (saved) saveBoard(saved).then(() => listBoards().then(setRecent));
  }

  function setExtras(extras: Extras) {
    if (!run) return;
    const next = { ...run, extras };
    setRun(next);
    persist(next);
  }

  // Ask Scout: one text-only model call returns actions; the board validates and draws them itself.
  async function ask(request: string) {
    if (!run?.board || asking || adding) return;
    const base = run;
    const before = base.extras ?? emptyExtras;
    setAsking(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: base.keyword, request, summary: base.kit?.summary ?? "", typeTraits: base.kit ? `${base.kit.typography.display}; ${base.kit.typography.body}` : "", palette: run.board.palette.map((p) => p.hex).slice(0, 12), extras: before }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.reply) throw new Error(body?.error ?? "Scout couldn't answer.");
      const extras = applyActions(before, Array.isArray(body.actions) ? body.actions : []);
      const changed = JSON.stringify(extras) !== JSON.stringify(before);
      const next = addUsage({ ...base, extras }, body.usage);
      setRun(next);
      persist(next);
      undoExtras.current = changed ? before : null;
      setScoutReply({ text: body.reply, usd: body.usage?.usd ?? null, canUndo: changed });
      // Bring what was just added into view (CSS scroll-behavior keeps this calm under reduced motion).
      const target =
        extras.components.find((c) => !before.components.includes(c)) ??
        extras.colors.find((c) => !before.colors.some((b) => b.hex === c.hex))?.hex ??
        extras.fonts?.find((f) => !before.fonts?.some((b) => b.family === f.family && b.role === f.role))?.role.replace(/^/, "font-") ??
        (JSON.stringify(extras.system) !== JSON.stringify(before.system) ? "system" : undefined);
      if (target) setTimeout(() => document.querySelector(`[data-added="${target}"]`)?.scrollIntoView({ block: "center" }), 80);
    } catch (err) {
      setScoutReply({ text: err instanceof Error ? err.message : "Scout couldn't answer.", usd: null, canUndo: false, failed: true });
    } finally {
      setAsking(false);
    }
  }

  function undo() {
    if (!undoExtras.current) return;
    setExtras(undoExtras.current);
    undoExtras.current = null;
    setScoutReply({ text: "Undone.", usd: null, canUndo: false });
  }

  async function openShowcase(slug: string) {
    const res = await fetch(`/showcases/${slug}.json`).catch(() => null);
    if (res?.ok) openBoard({ ...(await res.json()), showcase: true });
    else notify("That board couldn't be loaded");
  }
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const notify = (text: string) => {
    setToast((t) => ({ text, n: t.n + 1 }));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, text: "" })), 1800);
  };
  const running = !!run && !run.done;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // ?capture: screenshots for design review show settled frames, not mid-animation ones.
    if (params.has("capture")) document.documentElement.classList.add("capture");
    const shared = params.get("showcase"); // shareable link straight to a ready-made board
    if (shared && /^[a-z0-9-]+$/.test(shared)) openShowcase(shared);
    if (params.get("replay") !== "1") return;
    setReplay(true);
    setInput("liquid glass");
    setRun(fresh("liquid glass"));
    fetch("/fixtures/sample-run.ndjson").then((res) => readStream(res, (e) => setRun((r) => r && reduce(r, e)), params.has("instant") ? 0 : 350));
  }, []);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const keyword = input.replace(/\s+/g, " ").trim();
    if (keyword.length < 2 || keyword.length > 60) return setFormError("Use 2 to 60 characters.");
    setFormError("");
    setReplay(false);
    setShowProcess(false);
    setRun(fresh(keyword));
    live.current = true;
    try {
      const res = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ keyword }) });
      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.error ?? "The research service is unavailable.";
        return setRun((r) => r && { ...r, error: msg, done: true });
      }
      await readStream(res, (ev) => setRun((r) => r && reduce(r, ev)));
    } catch {
      setRun((r) => r && { ...r, error: "Lost connection to the research service.", done: true });
    }
  }

  const byUrl = new Map((run?.sources ?? []).map((s) => [s.url, s]));
  const kept = (run?.verdicts ?? []).filter((v) => v.keep);
  const setAside = (run?.verdicts ?? []).filter((v) => !v.keep);
  const now = run ? currentStep(run) : null;
  const judging = now === "judge";
  const [headline, detail] = statusLine(run);
  const kit = run?.kit;
  const boardReady = !!run?.done && !!run.board;

  return (
    <>
      <header className="top">
        <button className="logo" onClick={() => { setRun(null); setReplay(false); setShowProcess(false); }} aria-label="Atlas Trend home">
          <span className="studs" aria-hidden>
            <i style={{ background: "var(--red)" }} />
            <i style={{ background: "var(--yellow)" }} />
            <i style={{ background: "var(--cobalt)" }} />
            <i style={{ background: "var(--green)" }} />
          </span>
          <span>Atlas Trend</span>
        </button>
        <form className="search" onSubmit={start} role="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M20 20l-4.6-4.6" />
          </svg>
          <label htmlFor="q" className="sr-only">
            Trend to research
          </label>
          <input id="q" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Try “liquid glass”" maxLength={60} autoComplete="off" />
          <button className="btn" disabled={running}>{running ? "Building…" : "Build set"}</button>
        </form>
        {formError && <span className="form-error" role="alert">{formError}</span>}
        {replay && <span className="badge">SAMPLE RUN</span>}
      </header>
      <p className="note" role="status">Public showcase: explore sample boards and edit components locally. Live AI requests are disabled by default.</p>

      {boardReady && run?.board && (
        <div className="board-wrap" ref={boardRef}>
          <div className="bhero">
            <div>
              <h1 className="bh1">{run.keyword}</h1>
              <p className="lede">{kit?.summary ?? "Colours and images only: the style kit step was skipped."}</p>
              {(() => {
                const q = assess(run.verdicts, kit, run.board.palette);
                return (
                  <div className="quality" aria-label={`Quality ${q.score}, ${q.label}`}>
                    <span className={`qscore q-${q.label.toLowerCase()}`}>
                      <b className="mono">{q.score}</b> {q.label}
                    </span>
                    {q.signals.map((sig) => (
                      <span key={sig.id} className="qsig" title={sig.detail}>
                        <i className={`lvl-${sig.level}`} aria-hidden />
                        {sig.name}: {sig.detail}
                      </span>
                    ))}
                    <span className="qnote">Quality is a heuristic from this run's own evidence, not a human review.</span>
                  </div>
                );
              })()}
            </div>
            <div className="bside">
              <div className="status mini">
                <Scout mood={adding ? "thinking" : moodOf(run)} size={48} />
                <p>{adding ? (adding.phrase === "style kit" ? "Rebuilding the kit…" : "Adding examples…") : headline}</p>
              </div>
              <div className="bactions" data-noexport>
                <button className="ghost" aria-expanded={showProcess} onClick={() => setShowProcess((v) => !v)}>
                  {showProcess ? "Hide how Scout built it" : "See how Scout built it"}
                </button>
                <button className="ghost" disabled={showProcess} onClick={() => window.print()}>Save as PDF</button>
                <button
                  className="btn"
                  disabled={showProcess}
                  onClick={() => {
                    if (boardRef.current) downloadSnapshot(run.keyword, boardRef.current);
                    notify("Board downloaded");
                  }}
                >
                  Download board
                </button>
              </div>
            </div>
          </div>
          {!showProcess && (
            <>
              <TrendBoard keyword={run.keyword} kit={kit} palette={run.board.palette} thumbs={run.board.thumbs} kept={kept} setAside={setAside} sources={run.sources} onCopy={notify} onAddMore={addMore} onRefreshKit={refreshKit} adding={adding} added={run.added ?? []} extras={run.extras ?? emptyExtras} onExtras={setExtras} onAsk={ask} />
              <AskScout extras={run.extras ?? emptyExtras} asking={asking} disabled={!!adding} reply={scoutReply} onAsk={ask} onUndo={undo} />
            </>
          )}
        </div>
      )}

      {(!boardReady || showProcess) && (
      <main className="board">
        <section className="col" aria-label="Agent progress">
          {boardReady ? <h2 className="h1">{run?.keyword}</h2> : <h1>{run?.keyword ?? "Pick a trend"}</h1>}
          <div className="status" aria-live="polite">
            <Scout mood={moodOf(run)} size={64} />
            <div>
              <p>{headline}</p>
              <small>{detail}</small>
            </div>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => {
              const raw = run?.steps[s.id] ?? { status: "waiting" as const };
              const st = now === s.id && raw.status === "waiting" ? { ...raw, status: "active" as const } : raw;
              return (
                <li key={s.id} className={`step ${st.status}`} aria-current={st.status === "active" ? "step" : undefined}>
                  <span className="n">{i + 1}</span>
                  <div>
                    <b>{s.title}</b>
                    <small>{st.status === "waiting" ? s.hint : st.detail}</small>
                  </div>
                  <span className="t mono">{st.status === "active" ? "running" : st.ms != null ? `${(st.ms / 1000).toFixed(1)}s` : ""}</span>
                </li>
              );
            })}
          </ol>
        </section>

        {!run ? (
          <section className="col" aria-label="Boards">
            <Library
              showcases={showcases}
              recent={recent}
              onShowcase={openShowcase}
              onOpen={openBoard}
              onDelete={(id) => deleteBoard(id).then(() => listBoards().then(setRecent))}
            />
          </section>
        ) : (
        <section className="col" aria-label="Kept examples">
          {run?.error && <div className="alert" role="alert">{run.error}</div>}
          <h2>Kept examples</h2>
          <p className="sub">Each one links back to the page it was found on.</p>
          <div className={`callout${judging ? " live" : ""}`}>
            <div className="callhead">
              <strong className="mono">×{kept.length}</strong>
              <span>kept for the kit</span>
              <span className="mono muted" style={{ marginLeft: "auto" }}>×{setAside.length} set aside</span>
            </div>
            {kept.length ? (
              <div className="thumbs">
                {kept.map((v, i) => {
                  const s = byUrl.get(v.url);
                  return (
                    <a key={`${v.url}|${v.image ?? ""}`} className="thumb" href={v.url} target="_blank" rel="noopener noreferrer" style={{ "--i": i } as React.CSSProperties}>
                      {v.image && run?.board?.thumbs[v.image] && <img src={run.board.thumbs[v.image]} alt="" loading="lazy" referrerPolicy="no-referrer" />}
                      <span>
                        {s?.title ?? host(v.url)}
                        <em>{host(v.url)}</em>
                        <small>{v.reason}</small>
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="empty">{judging ? "Scout is checking every image…" : run?.done ? "Nothing was kept this time." : "Kept examples will appear here."}</p>
            )}
          </div>

          {setAside.length > 0 && (
            <div className="tray">
              <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                Set aside, with reasons
              </h3>
              {setAside.map((v) => (
                <div className="row" key={`${v.url}|${v.image ?? ""}`}>
                  <a href={v.url} target="_blank" rel="noopener noreferrer">{byUrl.get(v.url)?.title ?? host(v.url)}</a>
                  <span className="tag">{v.reason}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        <section className="col" aria-label="Style kit">
          <h2 style={{ fontSize: 20 }}>Parts list</h2>
          <p className="sub">The style kit fills in once the good examples are in.</p>
          {(kit?.palette ?? [null, null, null]).map((c, i) =>
            c ? (
              <div className="part" key={i}>
                <span className="sw" style={{ background: c.hex }} />
                <span>{c.name}</span>
                <span className="q mono">{c.hex.toUpperCase()}</span>
              </div>
            ) : (
              <div className="part pending" key={i}>
                <span className="sw" style={{ background: "var(--chip)" }} />
                <span>Colour {i + 1}</span>
                <span className="q mono">pending</span>
              </div>
            ),
          )}
          {(
            [
              ["Display type", kit?.typography.display, false],
              ["Body type", kit?.typography.body, false],
              ["Corner radius", kit && `${kit.radius}px`, true],
              ["Blur", kit && `${kit.blur}px`, true],
              ["Motion", kit && `${kit.motion.duration_ms}ms, ${kit.motion.curve}`, false],
            ] as const
          ).map(([label, value, numeric]) => (
            <div className={`part${value ? "" : " pending"}`} key={label}>
              <span className="sw" style={{ background: "var(--chip)" }} />
              <span>{label}</span>
              <span className={`q${numeric || !value ? " mono" : ""}`}>{value || "pending"}</span>
            </div>
          ))}
          {kit && <p className="kit-summary">{kit.summary}</p>}
        </section>
      </main>
      )}

      <div className={`toast${toast.text ? " show" : ""}`} role="status" aria-live="polite">{toast.text}</div>

      <footer className="receipt" aria-label="Run receipt">
        {run?.cost ? (
          <>
            <span>Time <b className="mono">{(run.cost.ms / 1000).toFixed(1)}s</b></span>
            <span>Cost <b className="mono">{run.cost.usd === null ? "not reported" : `$${run.cost.usd.toFixed(4)}`}</b></span>
            <span>Searches <b className="mono">{run.cost.searches ?? "not reported"}</b></span>
            <span>Tokens <b className="mono">{(run.cost.inputTokens + run.cost.outputTokens).toLocaleString()}</b></span>
            <span>Models <b className="mono">{run.cost.models.join(", ")}</b></span>
          </>
        ) : (
          <span>Every run shows its real time and cost here.</span>
        )}
      </footer>
    </>
  );
}
