"use client";

import type { SavedBoard } from "@/lib/run";

export type Showcase = { slug: string; keyword: string; set: string; colours: string[] };

const TILE = ["#C8351F", "var(--cobalt)", "var(--yellow)", "var(--green)", "var(--ink)"];

function Strip({ colours }: { colours: string[] }) {
  return (
    <span className="strip" aria-hidden>
      {colours.slice(0, 5).map((c) => (
        <i key={c} style={{ background: c }} />
      ))}
    </span>
  );
}

export function Library({
  showcases,
  recent,
  onShowcase,
  onOpen,
  onDelete,
}: {
  showcases: Showcase[];
  recent: SavedBoard[];
  onShowcase: (slug: string) => void;
  onOpen: (b: SavedBoard) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="library">
      {showcases.length > 0 && (
        <section>
          <h2>Ready-made boards</h2>
          <p className="sub">Built ahead with real searches, open instantly.</p>
          <div className="sets">
            {showcases.map((s, i) => (
              <button key={s.slug} className="set-tile" style={{ "--tile": TILE[i % TILE.length], "--i": i } as React.CSSProperties} onClick={() => onShowcase(s.slug)}>
                <span className="mono">{s.set}</span>
                <b>{s.keyword}</b>
                <Strip colours={s.colours} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Your recent boards</h2>
        <p className="sub">Saved in this browser only. Opening one costs nothing.</p>
        {recent.length ? (
          <ul className="recent">
            {recent.map((b, i) => (
              <li key={b.id} style={{ "--i": i } as React.CSSProperties}>
                <button className="recent-open" onClick={() => onOpen(b)}>
                  <Strip colours={b.board?.palette.map((p) => p.hex) ?? []} />
                  <b>{b.keyword}</b>
                  <span className="muted mono">
                    {new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {b.cost?.usd != null ? ` · $${b.cost.usd.toFixed(3)}` : ""}
                  </span>
                </button>
                <button className="recent-del" aria-label={`Delete ${b.keyword}`} onClick={() => onDelete(b.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Boards you build will appear here.</p>
        )}
      </section>
    </div>
  );
}
