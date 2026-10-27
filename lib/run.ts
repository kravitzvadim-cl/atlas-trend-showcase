import type { Extras } from "./ask";
import type { RunEvent, Source, StepId, StepStatus, StyleKit, Usage, Verdict } from "./types";

export type StepState = { status: StepStatus | "waiting"; detail?: string; ms?: number };
export type Cost = Extract<RunEvent, { type: "cost" }>;
export type Run = {
  keyword: string;
  steps: Record<StepId, StepState>;
  sources: Source[];
  verdicts: Verdict[];
  kit?: StyleKit;
  board?: { palette: { hex: string; share: number }[]; thumbs: Record<string, string> };
  cost?: Cost;
  error?: string;
  done: boolean;
  added?: string[]; // extra searches merged into this board
  extras?: Extras; // components and colours added with Ask Scout
};

export const fresh = (keyword: string): Run => ({
  keyword,
  steps: { search: { status: "waiting" }, look: { status: "waiting" }, judge: { status: "waiting" }, kit: { status: "waiting" } },
  sources: [],
  verdicts: [],
  done: false,
});

export function reduce(run: Run, e: RunEvent): Run {
  switch (e.type) {
    case "step":
      return { ...run, steps: { ...run.steps, [e.step]: { status: e.status, detail: e.detail, ms: e.ms } } };
    case "sources":
      return { ...run, sources: e.sources };
    case "verdicts":
      return { ...run, verdicts: e.verdicts };
    case "kit":
      return { ...run, kit: e.kit };
    case "board":
      return { ...run, board: { palette: e.palette, thumbs: e.thumbs } };
    case "cost":
      return { ...run, cost: e, done: true };
    case "error":
      return { ...run, error: e.message };
  }
}


// The one portable board format: history, showcases and downloads all use it.
export type SavedBoard = Omit<Run, "done" | "error"> & { v: 1; id: string; createdAt: string; showcase?: boolean };

export function toSaved(run: Run, id: string, createdAt: string): SavedBoard | null {
  if (!run.done || !run.board) return null;
  const { done: _d, error: _e, ...rest } = run;
  return { v: 1, id, createdAt, ...rest };
}

// A paid call made on an open board (kit refresh, Ask Scout) adds its measured cost to the board's receipt.
export function addUsage(run: Run, u: Pick<Usage, "usd" | "input" | "output"> | undefined): Run {
  if (!run.cost || !u) return run;
  const usd = run.cost.usd == null || u.usd == null ? null : run.cost.usd + u.usd;
  return { ...run, cost: { ...run.cost, usd, inputTokens: run.cost.inputTokens + u.input, outputTokens: run.cost.outputTokens + u.output } };
}

export const fromSaved = (b: SavedBoard): Run => ({ ...b, done: true });

export function boardFromEvents(keyword: string, events: RunEvent[], id: string, createdAt: string): SavedBoard | null {
  return toSaved(events.reduce(reduce, fresh(keyword)), id, createdAt);
}

// Fold an "add more" run into an existing board. Existing items win on duplicates; costs add up honestly.
export function mergeRuns(base: Run, extra: Run, palette: { hex: string; share: number }[]): Run {
  const key = (v: Verdict) => v.image ?? v.url;
  const seen = new Set(base.verdicts.map(key));
  const urls = new Set(base.sources.map((s) => s.url));
  const sum = (a: number | null | undefined, b: number | null | undefined) => (a == null || b == null ? null : a + b);
  const cost = base.cost && extra.cost
    ? {
        ...base.cost,
        usd: sum(base.cost.usd, extra.cost.usd),
        searches: sum(base.cost.searches, extra.cost.searches),
        inputTokens: base.cost.inputTokens + extra.cost.inputTokens,
        outputTokens: base.cost.outputTokens + extra.cost.outputTokens,
        ms: base.cost.ms + extra.cost.ms,
        models: [...new Set([...base.cost.models, ...extra.cost.models])],
      }
    : base.cost;
  return {
    ...base,
    sources: [...base.sources, ...extra.sources.filter((s) => !urls.has(s.url))],
    verdicts: [...base.verdicts, ...extra.verdicts.filter((v) => !seen.has(key(v)))],
    board: { palette, thumbs: { ...base.board?.thumbs, ...extra.board?.thumbs } },
    cost,
    added: [...(base.added ?? []), extra.keyword],
  };
}
