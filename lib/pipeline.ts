import type { PageImages } from "./fetchPreview";
import type { RunEvent, Source, StepId, StyleKit, Usage, Verdict } from "./types";

export type JudgeImage = { url: string; image: string; title: string; media_type: string; data: string };

export type Deps = {
  search(keyword: string): Promise<{ sources: Source[]; usage: Usage }>;
  preview(url: string): Promise<PageImages>;
  judge(keyword: string, images: JudgeImage[]): Promise<{ verdicts: Verdict[]; usage: Usage }>;
  kit(keyword: string, images: JudgeImage[]): Promise<{ kit: StyleKit; usage: Usage }>;
  analyse(images: JudgeImage[]): Promise<{ palette: { hex: string; share: number }[]; thumbs: Record<string, string> }>;
};

// judgeAs: when adding to an existing board, new images are judged against the board's original trend.
// skipKit: adding to a board keeps its kit, so the paid kit step is skipped.
export type Limits = { maxRunUsd: number; maxSources: number; maxImages: number; judgeAs?: string; skipKit?: boolean };
const ORDER: StepId[] = ["search", "look", "judge", "kit"];

export async function runResearch(keyword: string, deps: Deps, emit: (e: RunEvent) => void, limits: Limits): Promise<void> {
  const started = Date.now();
  const total: Usage = { usd: 0, input: 0, output: 0, searches: 0, models: [] };
  let fellBack = false;
  const add = (u: Usage) => {
    for (const m of u.models) if (!total.models.includes(m)) total.models.push(m);
    if (u.usedFallback) fellBack = true;
    total.usd = total.usd === null || u.usd === null ? null : total.usd + u.usd;
    total.input += u.input;
    total.output += u.output;
    total.searches = total.searches === null || u.searches === null ? null : total.searches + u.searches;
  };
  // Paid steps only start while the run is under budget; an unknown cost counts as over budget.
  const overBudget = () => total.usd === null || total.usd >= limits.maxRunUsd;

  let current: StepId = "search";
  let t0 = Date.now();
  const begin = (step: StepId, detail: string) => {
    current = step;
    t0 = Date.now();
    emit({ type: "step", step, status: "active", detail });
  };
  const finish = (detail: string) => {
    emit({ type: "step", step: current, status: "done", detail: fellBack ? `${detail} · backup model` : detail, ms: Date.now() - t0 });
    fellBack = false;
  };
  const skipRest = (from: StepId, detail: string) => {
    for (const step of ORDER.slice(ORDER.indexOf(from))) emit({ type: "step", step, status: "skipped", detail });
  };

  try {
    begin("search", "Searching the web");
    const found = await deps.search(keyword);
    add(found.usage);
    const sources = found.sources.slice(0, limits.maxSources);
    emit({ type: "sources", sources });
    finish(`${sources.length} pages found`);
    if (sources.length === 0) {
      skipRest("look", "no pages found");
      return;
    }

    begin("look", `Collecting images from ${sources.length} pages`);
    const previews = await Promise.all(sources.map((s) => deps.preview(s.url)));
    const images: JudgeImage[] = [];
    const setAside: Verdict[] = [];
    previews.forEach((p, i) => {
      const s = sources[i];
      if (!p.ok) return setAside.push({ url: s.url, keep: false, reason: p.reason });
      s.image = p.images[0].image;
      for (const img of p.images)
        // The same file often appears on several pages of one site; judge it once.
        if (images.length < limits.maxImages && !images.some((i) => i.image === img.image)) images.push({ url: s.url, title: s.title, ...img });
    });
    emit({ type: "sources", sources });
    emit({ type: "verdicts", verdicts: setAside });
    finish(`${images.length} images to check`);
    if (images.length === 0) {
      skipRest("judge", "nothing matched");
      return;
    }

    if (overBudget()) {
      skipRest("judge", "run budget reached");
      return;
    }
    begin("judge", `Checking ${images.length} images against “${limits.judgeAs ?? keyword}”`);
    const judged = await deps.judge(limits.judgeAs ?? keyword, images);
    add(judged.usage);
    const kept = new Set(judged.verdicts.filter((v) => v.keep).map((v) => v.image));
    emit({ type: "verdicts", verdicts: [...judged.verdicts, ...setAside] });
    finish(`${kept.size} kept · ${images.length - kept.size + setAside.length} set aside`);
    if (kept.size === 0) {
      skipRest("kit", "nothing matched");
      return;
    }
    const keptImages = images.filter((i) => kept.has(i.image));
    // Local and free: true colours and thumbnails, available even if the kit step is skipped.
    emit({ type: "board", ...(await deps.analyse(keptImages)) });

    if (limits.skipKit) {
      skipRest("kit", "kept the board's existing kit");
      return;
    }
    if (overBudget()) {
      skipRest("kit", "run budget reached");
      return;
    }
    begin("kit", "Building the style kit");
    const built = await deps.kit(keyword, keptImages);
    add(built.usage);
    emit({ type: "kit", kit: built.kit });
    finish("Style kit ready");
  } catch (err) {
    emit({ type: "step", step: current, status: "failed", detail: "Step failed", ms: Date.now() - t0 });
    emit({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
  } finally {
    emit({ type: "cost", usd: total.usd, inputTokens: total.input, outputTokens: total.output, searches: total.searches, ms: Date.now() - started, models: total.models });
  }
}
