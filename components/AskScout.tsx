"use client";

import { useState } from "react";
import { Scout } from "@/components/Scout";
import { CATALOG, type Extras } from "@/lib/ask";

export type ScoutReply = { text: string; usd: number | null; canUndo: boolean; failed?: boolean };

type Props = {
  extras: Extras;
  asking: boolean;
  disabled: boolean;
  reply: ScoutReply | null;
  onAsk: (request: string) => void;
  onUndo: () => void;
};

// The instruction box pinned to the bottom of a board. Scout only picks from the app's own components and colours.
export function AskScout({ extras, asking, disabled, reply, onAsk, onUndo }: Props) {
  const [text, setText] = useState("");
  const go = (t: string) => {
    const v = t.replace(/\s+/g, " ").trim();
    if (v.length < 2 || asking || disabled) return;
    onAsk(v);
    setText("");
  };
  const suggestions = [
    ...(Object.keys(CATALOG) as (keyof typeof CATALOG)[]).filter((c) => !extras.components.includes(c)).slice(0, 3).map((c) => `add ${CATALOG[c].toLowerCase()}`),
    extras.colors.length ? "a darker accent colour" : "a softer accent colour",
    ...(extras.fonts?.length ? [] : ["a display font that fits"]),
  ];

  return (
    <div className={`askdock${asking ? " busy" : ""}`} role="region" aria-label="Ask Scout" data-noexport>
      {(reply || asking) && (
        <div className={`askreply${reply?.failed && !asking ? " failed" : ""}`} role="status" aria-live="polite">
          <Scout mood={asking ? "thinking" : reply?.failed ? "confused" : "excited"} size={28} />
          <span>{asking ? "Scout is on it…" : reply?.text}</span>
          {!asking && reply?.usd != null && <span className="mono muted">${reply.usd.toFixed(4)}</span>}
          {!asking && reply?.canUndo && <button className="ghost" onClick={onUndo}>Undo</button>}
        </div>
      )}
      <form className="askform" onSubmit={(e) => { e.preventDefault(); go(text); }}>
        <Scout mood={asking ? "thinking" : "idle"} size={40} />
        <label className="sr-only" htmlFor="ask">Ask Scout</label>
        <input id="ask" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} autoComplete="off" disabled={disabled}
          placeholder="Ask Scout: add a pricing card and a softer accent…" />
        <button className="btn" disabled={asking || disabled}>{asking ? "Asking…" : "Ask"}</button>
      </form>
      <div className="askchips">
        {suggestions.map((s) => (
          <button key={s} className="chip" disabled={asking || disabled} onClick={() => go(s)}>+ {s.replace(/^add /, "")}</button>
        ))}
        <span className="mono muted small">Haiku · about 0.02¢ an ask</span>
      </div>
    </div>
  );
}
