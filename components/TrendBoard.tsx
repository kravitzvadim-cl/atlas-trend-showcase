"use client";

import { useEffect, useState } from "react";
import { KitPart } from "@/components/KitParts";
import { DesignSystem } from "@/components/DesignSystem";
import { buildSystem } from "@/lib/designSystem";
import { CATALOG, type Extras } from "@/lib/ask";
import { contrast, nearestName } from "@/lib/color";
import { buildTokens, deriveTheme, fontStack, type NamedSwatch } from "@/lib/tokens";
import type { Source, StyleKit, Verdict } from "@/lib/types";

type Props = {
  keyword: string;
  kit?: StyleKit;
  palette: { hex: string; share: number }[];
  thumbs: Record<string, string>;
  kept: Verdict[];
  setAside: Verdict[];
  sources: Source[];
  onCopy: (label: string) => void;
  onAddMore: (phrase: string) => void;
  onRefreshKit: () => void;
  adding: { phrase: string; status: string } | null;
  added: string[];
  extras: Extras;
  onExtras: (e: Extras) => void;
  onAsk: (request: string) => void;
};

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const SECTIONS = ["Mood board", "Colour", "Type", "Components", "Design system", "Tokens", "Evidence"] as const;
const id = (s: string) => "board-" + s.toLowerCase().replace(/\s+/g, "-");

function Heading({ title, count, note }: { title: string; count?: number; note: string }) {
  return (
    <div className="sh">
      <h2>{title}</h2>
      {count != null && <span className="sh-count mono">×{count}</span>}
      <p>{note}</p>
    </div>
  );
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

function AddMore({ related, added, adding, onAddMore }: { related: string[]; added: string[]; adding: Props["adding"]; onAddMore: Props["onAddMore"] }) {
  const [phrase, setPhrase] = useState("");
  const left = related.filter((r) => !added.includes(r));
  const go = (p: string) => {
    const v = p.replace(/\s+/g, " ").trim();
    if (v.length >= 2 && v.length <= 60 && !adding) onAddMore(v);
  };
  return (
    <div className={`addmore${adding ? " busy" : ""}`} data-noexport>
      <div className="addmore-head">
        <b>Add more examples</b>
        <span className="muted">New finds are judged against this trend and dropped into the board. About 2¢ per search.</span>
      </div>
      {left.length > 0 && (
        <div className="chips">
          {left.map((r) => (
            <button key={r} className="chip" disabled={!!adding} onClick={() => go(r)}>+ {r}</button>
          ))}
        </div>
      )}
      <form className="addmore-form" onSubmit={(e) => { e.preventDefault(); go(phrase); setPhrase(""); }}>
        <label className="sr-only" htmlFor="addmore">Related search</label>
        <input id="addmore" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="Or type a related search…" maxLength={60} disabled={!!adding} />
        <button className="btn" disabled={!!adding}>{adding ? "Adding…" : "Add"}</button>
      </form>
      {adding && (
        <p className="addmore-status" role="status" aria-live="polite">
          <span className="dotpulse" aria-hidden /> “{adding.phrase}”: {adding.status}
        </p>
      )}
      {added.length > 0 && <p className="muted small">Added so far: {added.join(", ")}</p>}
    </div>
  );
}

export function TrendBoard({ keyword, kit, palette, thumbs, kept, setAside, sources, onCopy, onAddMore, onRefreshKit, adding, added, extras, onExtras, onAsk }: Props) {
  // Borrow the model's colour names, but each name only once.
  const used = new Set<string>();
  const named: NamedSwatch[] = palette.map((p) => {
    const name = kit ? nearestName(p.hex, kit.palette.filter((c) => !used.has(c.name))) : null;
    if (name) used.add(name);
    return { ...p, name };
  });
  const theme = kit && named.length ? deriveTheme(kit, named) : null;
  // Colours added with Ask Scout go into the tokens; the stage keeps the sampled theme.
  // Fonts chosen with Ask Scout: display first, then body, so they read in a fixed order.
  const fonts = [...(extras.fonts ?? [])].sort((a, b) => b.role.localeCompare(a.role));
  const display = fonts.find((f) => f.role === "display"), body = fonts.find((f) => f.role === "body");
  const tokens = kit ? buildTokens(keyword, kit, [...named, ...extras.colors.map((c) => ({ hex: c.hex, share: 0, name: c.name }))], fonts) : null;
  // Components sit in the catalog's order, wherever they were asked for.
  const order = Object.keys(CATALOG);
  const parts = [...extras.components].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  // Built even before it's "made", so one click can make it and download the project kit.
  const draftSystem = kit && named.length ? buildSystem(keyword, kit, named, extras.colors.map((c) => c.hex), fonts, extras.system ?? {}) : null;
  const system = extras.system ? draftSystem : null;
  const facts = kit && {
    kept: kept.map((v) => v.reason), avoided: setAside.map((v) => v.reason), examples: kept.length,
    sites: new Set(kept.map((v) => { try { return new URL(v.url).hostname; } catch { return v.url; } })).size,
    summary: kit.summary, typography: kit.typography, motionNotes: kit.motion.notes,
  };
  // Load every font on show: Scout's picks and the system's auto-picked pair.
  const fontKey = [...new Set([...fonts.map((f) => f.family), ...(system ? [system.fonts.display, system.fonts.body] : [])])].join("|");
  useEffect(() => {
    // Families are allowlisted, so the Google Fonts URL is built from known names only.
    for (const family of fontKey ? fontKey.split("|") : []) {
      const single = /^(Archivo Black|Bebas Neue|Anton|Lilita One|Righteous|DM Serif Display|Instrument Serif)$/.test(family); // one weight only
      const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}${single ? "" : ":wght@400;700"}&display=swap`;
      if (!document.querySelector(`link[href="${href}"]`)) document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href }));
    }
  }, [fontKey]);
  const [tab, setTab] = useState<"css" | "tailwind" | "json">("css");
  const [nav, setNav] = useState(0);
  const [toggle, setToggle] = useState(true);
  const [replay, setReplay] = useState(0);
  const byUrl = new Map(sources.map((s) => [s.url, s]));
  const stageVars: React.CSSProperties | undefined = theme ? ({
    "--g": theme.ground, "--a": theme.accent, "--tx": theme.text, "--on-a": theme.onAccent,
    "--r": `${theme.radius}px`, "--b": `${theme.blur}px`, "--curve": theme.curve, "--dur": `${theme.duration}ms`,
    "--fd": display ? fontStack(display.family) : undefined,
    fontFamily: body ? fontStack(body.family) : theme.fontFamily,
  } as React.CSSProperties) : undefined;
  const copy = (text: string, label: string) => navigator.clipboard?.writeText(text).then(() => onCopy(label), () => onCopy("Copy failed"));

  return (
    <div className="board-view">
      <nav className="toc" aria-label="Board sections">
        {SECTIONS.map((s) => (
          <a key={s} href={`#${id(s)}`}>{s}</a>
        ))}
      </nav>

      <section id={id("Mood board")} className="bsec">
        <Heading title="Mood board" count={kept.length} note="Every image links to where it was found" />
        <p className="note credit">The public sample retains source links and style-kit results. Third-party thumbnails are omitted from this copy.</p>
        <div className="mood">
          {kept.map((v, i) => (
            <a key={`${v.url}|${v.image ?? ""}`} className="shot" href={v.url} target="_blank" rel="noopener noreferrer" style={{ "--i": i } as React.CSSProperties}>
              {v.image && thumbs[v.image] && <img src={thumbs[v.image]} alt="" loading="lazy" referrerPolicy="no-referrer" />}
              <span>
                {byUrl.get(v.url)?.title ?? host(v.url)}
                <em>{host(v.url)}</em>
                <small>{v.reason}</small>
              </span>
            </a>
          ))}
        </div>
        <AddMore related={kit?.related ?? []} added={added} adding={adding} onAddMore={onAddMore} />
      </section>

      <section id={id("Colour")} className="bsec">
        <Heading title="Colour" count={named.length} note="Sampled from the kept images' pixels · click to copy" />
        <div className="swatches">
          {[...named, ...extras.colors.map((c) => ({ ...c, share: -1 }))].map((p, i) => {
            const onWhite = contrast(p.hex, "#FFFFFF"), onInk = contrast(p.hex, "#111827");
            const extra = extras.colors.find((c) => c.hex === p.hex && p.share < 0);
            const best = onWhite >= onInk ? { on: "white", ratio: onWhite, fg: "#FFFFFF" } : { on: "ink", ratio: onInk, fg: "#111827" };
            return (
              <div key={p.hex + (extra ? "+" : "")} className={`swatch-wrap${extra ? " added" : ""}`} data-added={extra?.hex}>
              <button className="swatch" aria-label={`Copy ${p.name ?? `colour ${i + 1}`} ${p.hex}`} onClick={() => copy(p.hex, `Copied ${p.hex}`)} style={{ "--i": i } as React.CSSProperties}>
                <span className="sw-c" style={{ background: p.hex }}>
                  <span className={`pill${best.ratio < 4.5 ? " no" : ""}`} style={{ color: best.ratio < 4.5 ? undefined : "#1F2A44" }}>
                    <span style={{ color: best.fg, background: p.hex, borderRadius: 4, padding: "0 4px", marginRight: 4 }}>Aa</span>
                    {best.on} {best.ratio.toFixed(1)}{best.ratio < 4.5 ? " · not for text" : ""}
                  </span>
                </span>
                <span className="sw-m">
                  <b>{p.name ?? `Colour ${i + 1}`}{extra && <span className="new">Added</span>}</b>
                  <span className="mono">{p.hex} · {extra ? extra.note || "added" : `${Math.round(p.share * 100)}%`}</span>
                </span>
              </button>
              {extra && <button className="x" data-noexport aria-label={`Remove ${extra.name}`} onClick={() => onExtras({ ...extras, colors: extras.colors.filter((c) => c !== extra) })}>×</button>}
              </div>
            );
          })}
        </div>
        <p className="note">Percent is how much of the kept images each colour covers. Colours marked Added came from Ask Scout and are included in the tokens. Contrast is measured against white and ink text.</p>
      </section>

      {kit && theme && tokens ? (
        <>
          <section id={id("Type")} className="bsec">
            <Heading title="Type" note="Traits read from the examples" />
            <div className="kitbar" data-noexport>
              <span className="muted small">Type, components and tokens come from the style kit. Added examples since? Rebuild it from all {Math.min(kept.length, 20)} images for a fraction of a cent.</span>
              <button className="ghost" disabled={!!adding} onClick={onRefreshKit}>{adding?.phrase === "style kit" ? "Rebuilding…" : "Refresh style kit"}</button>
            </div>
            <div className="type">
              <div className="spec" style={{ fontFamily: display ? fontStack(display.family) : theme.fontFamily }}>
                <div className="aa" style={{ fontWeight: theme.fontWeight, color: theme.ink }}>Aa</div>
                <div className="spec-line" style={{ fontWeight: theme.fontWeight }}>{keyword}, set in its own voice.</div>
                <p className="muted">{kit.typography.notes || kit.summary}</p>
              </div>
              <div className="spec traits">
                <div><span>Display</span><b>{kit.typography.display}</b></div>
                <div><span>Body</span><b>{kit.typography.body}</b></div>
                <div><span>Motion</span><b>{kit.motion.duration_ms}ms, {kit.motion.curve}</b></div>
              </div>
            </div>
            {fonts.length > 0 && (
              <div className="fontcards">
                {fonts.map((f) => (
                  <div className="fontcard" key={f.role} data-added={`font-${f.role}`}>
                    <span className="muted small">{f.role === "display" ? "Display font · headings" : "Body font · text"}<span className="new">Added</span></span>
                    <div className="fc-aa" style={{ fontFamily: fontStack(f.family), fontWeight: f.role === "display" ? 700 : 400 }}>Aa</div>
                    <b>{f.family}</b>
                    <p style={{ fontFamily: fontStack(f.family) }}>{f.role === "display" ? `${keyword}, headline size` : "Body copy reads like this at 16px, with a comfortable line height for longer text."}</p>
                    <button className="x" data-noexport aria-label={`Remove ${f.family}`} onClick={() => onExtras({ ...extras, fonts: fonts.filter((x) => x !== f) })}>×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id={id("Components")} className="bsec">
            <Heading title="Components" count={5 + extras.components.length} note="Drawn live from this kit's tokens · try them" />
            <div key={replay} className={`stage is-${theme.surface}`} style={stageVars}>
              <div className="surface card" style={{ "--i": 0 } as React.CSSProperties}>
                <h3 style={{ fontWeight: theme.fontWeight }}>Your trip is confirmed</h3>
                <p>Gate B12 · Boarding 18:40 · Seat 14A</p>
                <div className="crow">
                  <button className="tbtn primary">View pass</button>
                  <button className="tbtn secondary">Share</button>
                </div>
                <label className="surface tinput">
                  <span className="sr-only">Sample input</span>
                  <input placeholder="Search destinations…" />
                </label>
              </div>
              <div className="stack">
                <div className="surface tnav" role="group" aria-label="Sample navigation" style={{ "--i": 1, "--nav": nav } as React.CSSProperties}>
                  <span className="tnav-ind" aria-hidden />
                  {["Home", "Trips", "Wallet", "Profile"].map((t, i) => (
                    <button key={t} aria-pressed={nav === i} onClick={() => setNav(i)}>{t}</button>
                  ))}
                </div>
                <div className="surface card" style={{ "--i": 2 } as React.CSSProperties}>
                  <div className="crow between">
                    <span>Price alerts</span>
                    <button className={`ttoggle${toggle ? " on" : ""}`} role="switch" aria-checked={toggle} aria-label="Price alerts" onClick={() => setToggle((t) => !t)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="labels">
              <span>Card</span><span>Buttons</span><span>Input</span><span>Nav</span><span>Toggle</span>
              <span className="mono">r {theme.radius} · blur {theme.blur} · {theme.duration}ms</span>
              <button className="ghost" data-noexport onClick={() => setReplay((r) => r + 1)}>Replay motion</button>
            </div>
            {parts.length > 0 && (
              <>
                <div className="yours">
                  {parts.map((c) => (
                    <div className="tile" key={c} data-added={c}>
                      <div key={replay} className={`stage is-${theme.surface}`} style={stageVars}><KitPart id={c} /></div>
                      <div className="tile-m">{CATALOG[c]}<span className="new">Added</span><span className="mono">r {theme.radius} · blur {theme.blur}</span></div>
                      <button className="x" data-noexport aria-label={`Remove ${CATALOG[c]}`} onClick={() => onExtras({ ...extras, components: extras.components.filter((x) => x !== c) })}>×</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section id={id("Design system")} className="bsec" data-added="system">
            <Heading title="Design system" note={system ? "Built from this board · free · tweak it with Ask Scout" : "Optional · free and instant"} />
            <DesignSystem keyword={keyword} system={system} draft={draftSystem} facts={facts || null} ground={theme.ground} onMake={() => onExtras({ ...extras, system: extras.system ?? {} })} onDownload={download} onAsk={onAsk} />
          </section>

          <section id={id("Tokens")} className="bsec">
            <Heading title="Tokens" note="Copy or download" />
            <div className="tabs" role="group" aria-label="Token format">
              {(["css", "tailwind", "json"] as const).map((t) => (
                <button key={t} aria-pressed={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                  {t === "css" ? "CSS variables" : t === "tailwind" ? "Tailwind" : "JSON"}
                </button>
              ))}
            </div>
            <pre className="code">{tokens[tab]}</pre>
            <div className="dl" data-noexport>
              <button className="btn" onClick={() => copy(tokens[tab], "Tokens copied")}>Copy</button>
              <button className="btn-outline" onClick={() => download("tokens.css", tokens.css)}>Download tokens.css</button>
              <button className="btn-outline" onClick={() => download("tokens.json", tokens.json)}>Download tokens.json</button>
            </div>
          </section>
        </>
      ) : (
        <p className="note">The style kit step was skipped, so type, components and tokens aren't available for this run.</p>
      )}

      <section id={id("Evidence")} className="bsec">
        <Heading title="Evidence" count={setAside.length} note="What Scout set aside, and why" />
        <div className="ev">
          {setAside.map((v) => (
            <div key={`${v.url}|${v.image ?? ""}`}>
              <a href={v.url} target="_blank" rel="noopener noreferrer">{byUrl.get(v.url)?.title ?? host(v.url)}</a>
              <em>{v.reason}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
