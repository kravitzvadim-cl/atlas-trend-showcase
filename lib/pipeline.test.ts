import { expect, test } from "vitest";
import { runResearch, type Deps } from "./pipeline";
import type { RunEvent, StyleKit } from "./types";

const usage = { usd: 0.01, input: 100, output: 10, searches: 0, models: ["m"] };
const limits = { maxRunUsd: 0.5, maxSources: 16, maxImages: 24 };
const kit: StyleKit = {
  summary: "s", palette: [{ name: "a", hex: "#000000" }], typography: { display: "d", body: "b", notes: "" },
  radius: 24, blur: 20, motion: { curve: "ease", duration_ms: 300, notes: "" },
  related: [],
};
const img = (url: string) => ({ ok: true as const, images: [{ image: url + "/og.png", media_type: "image/png", data: "AA==" }] });

function fakeDeps(over: Partial<Deps> = {}): Deps & { judged: string[] } {
  const judged: string[] = [];
  return {
    judged,
    search: async () => ({ sources: [{ url: "https://a.com", title: "A" }, { url: "https://b.com", title: "B" }], usage: { ...usage, searches: 2 } }),
    preview: async (url) => img(url),
    judge: async (_k, imgs) => {
      judged.push(...imgs.map((i) => i.url));
      return { verdicts: imgs.map((i) => ({ url: i.url, image: i.image, keep: true, reason: "fits" })), usage };
    },
    kit: async () => ({ kit, usage }),
    analyse: async () => ({ palette: [{ hex: "#000000", share: 1 }], thumbs: {} }),
    ...over,
  };
}

async function run(deps: Deps, lim = limits) {
  const events: RunEvent[] = [];
  await runResearch("liquid glass", deps, (e) => events.push(e), lim);
  return events;
}
const steps = (ev: RunEvent[]) => ev.filter((e) => e.type === "step").map((e) => e.type === "step" && `${e.step}:${e.status}`);

test("happy path runs every step in order and ends with the cost", async () => {
  const ev = await run(fakeDeps());
  expect(steps(ev)).toEqual(["search:active", "search:done", "look:active", "look:done", "judge:active", "judge:done", "kit:active", "kit:done"]);
  expect(ev.some((e) => e.type === "kit")).toBe(true);
  const last = ev.at(-1);
  expect(last?.type).toBe("cost");
  if (last?.type === "cost") expect(last.searches).toBe(2);
});

test("a source without a usable image is set aside with its reason and never judged", async () => {
  const deps = fakeDeps({ preview: async (url) => (url === "https://b.com" ? { ok: false, reason: "image unavailable" } : img(url)) });
  const ev = await run(deps);
  const verdicts = ev.filter((e) => e.type === "verdicts").at(-1);
  expect(verdicts?.type === "verdicts" && verdicts.verdicts).toContainEqual({ url: "https://b.com", keep: false, reason: "image unavailable" });
  expect(deps.judged).toEqual(["https://a.com"]);
});

test("when nothing is kept the kit step is skipped, not crashed", async () => {
  const ev = await run(fakeDeps({ judge: async (_k, imgs) => ({ verdicts: imgs.map((i) => ({ url: i.url, image: i.image, keep: false, reason: "not a UI" })), usage }) }));
  expect(steps(ev)).toContain("kit:skipped");
  expect(ev.find((e) => e.type === "step" && e.step === "kit" && e.status === "skipped")).toMatchObject({ detail: "nothing matched" });
  expect(ev.some((e) => e.type === "kit")).toBe(false);
});

test("an API failure marks the step failed and reports a readable error", async () => {
  const ev = await run(fakeDeps({ judge: async () => { throw new Error("Claude declined this request (refusal)"); } }));
  expect(steps(ev)).toContain("judge:failed");
  expect(ev).toContainEqual({ type: "error", message: "Claude declined this request (refusal)" });
  expect(steps(ev)).not.toContain("kit:active");
});

test("no sources found ends gracefully", async () => {
  const ev = await run(fakeDeps({ search: async () => ({ sources: [], usage }) }));
  expect(steps(ev)).toContain("look:skipped");
  expect(ev.at(-1)?.type).toBe("cost");
});

test("a run over budget stops before the next paid step", async () => {
  const deps = fakeDeps({ search: async () => ({ sources: [{ url: "https://a.com", title: "A" }], usage: { ...usage, usd: 0.6 } }) });
  const ev = await run(deps);
  expect(steps(ev)).toContain("judge:skipped");
  expect(deps.judged).toEqual([]);
  expect(ev.at(-1)).toMatchObject({ type: "cost", usd: 0.6 });
});

test("an unreported cost is never invented and blocks further paid steps", async () => {
  const deps = fakeDeps({ search: async () => ({ sources: [{ url: "https://a.com", title: "A" }], usage: { ...usage, usd: null } }) });
  const ev = await run(deps);
  expect(steps(ev)).toContain("judge:skipped");
  expect(ev.at(-1)).toMatchObject({ type: "cost", usd: null });
});

test("only the configured number of sources is looked at", async () => {
  const many = Array.from({ length: 5 }, (_, i) => ({ url: `https://s${i}.com`, title: `S${i}` }));
  const ev = await run(fakeDeps({ search: async () => ({ sources: many, usage }) }), { ...limits, maxSources: 2 });
  const last = ev.filter((e) => e.type === "sources").at(-1);
  expect(last?.type === "sources" && last.sources.length).toBe(2);
});

test("a step answered by the backup model says so", async () => {
  const ev = await run(fakeDeps({ judge: async (_k, imgs) => ({ verdicts: imgs.map((i) => ({ url: i.url, image: i.image, keep: true, reason: "ok" })), usage: { ...usage, models: ["backup"], usedFallback: true } }) }));
  expect(ev.find((e) => e.type === "step" && e.step === "judge" && e.status === "done")).toMatchObject({ detail: expect.stringContaining("backup model") });
  expect(ev.at(-1)).toMatchObject({ models: ["m", "backup"] });
});

test("a gallery page contributes several images, each judged and kept on its own", async () => {
  const gallery = { ok: true as const, images: ["1", "2", "3"].map((n) => ({ image: `https://g.com/${n}.jpg`, media_type: "image/jpeg", data: "AA==" })) };
  const kitSaw: string[] = [];
  const deps = fakeDeps({
    search: async () => ({ sources: [{ url: "https://g.com", title: "Gallery" }], usage }),
    preview: async () => gallery,
    judge: async (_k, imgs) => ({ verdicts: imgs.map((i) => ({ url: i.url, image: i.image, keep: i.image !== "https://g.com/2.jpg", reason: "r" })), usage }),
    kit: async (_k, imgs) => { kitSaw.push(...imgs.map((i) => i.image)); return { kit, usage }; },
  });
  const ev = await run(deps);
  const verdicts = ev.filter((e) => e.type === "verdicts").at(-1);
  expect(verdicts?.type === "verdicts" && verdicts.verdicts.length).toBe(3);
  expect(kitSaw).toEqual(["https://g.com/1.jpg", "https://g.com/3.jpg"]);
});

test("the total number of judged images is capped", async () => {
  const deps = fakeDeps({ preview: async (url) => ({ ok: true as const, images: Array.from({ length: 4 }, (_, n) => ({ image: `${url}/${n}.jpg`, media_type: "image/jpeg", data: "AA==" })) }) });
  await run(deps, { ...limits, maxImages: 5 });
  expect(deps.judged.length).toBe(5);
});

test("the board (sampled colours + thumbnails) arrives after judging, even when the kit is over budget", async () => {
  const deps = fakeDeps({ judge: async (_k, imgs) => ({ verdicts: imgs.map((i) => ({ url: i.url, image: i.image, keep: true, reason: "r" })), usage: { ...usage, usd: 0.6 } }) });
  const ev = await run(deps);
  expect(ev.some((e) => e.type === "board")).toBe(true);
  expect(steps(ev)).toContain("kit:skipped");
});

test("adding to a board judges against the original trend and skips the paid kit step", async () => {
  const judgedAs: string[] = [];
  let kitCalls = 0;
  const deps = fakeDeps({
    judge: async (k, imgs) => { judgedAs.push(k); return { verdicts: imgs.map((i) => ({ url: i.url, image: i.image, keep: true, reason: "r" })), usage }; },
    kit: async () => { kitCalls++; return { kit, usage }; },
  });
  const events: RunEvent[] = [];
  await runResearch("glass tab bar", deps, (e) => events.push(e), { ...limits, judgeAs: "liquid glass", skipKit: true });
  expect(judgedAs).toEqual(["liquid glass"]);
  expect(kitCalls).toBe(0);
  expect(events.some((e) => e.type === "board")).toBe(true);
  expect(steps(events)).toContain("kit:skipped");
});

test("an image found on two pages is judged once", async () => {
  const same = { ok: true as const, images: [{ image: "https://site.com/share.jpg", media_type: "image/jpeg", data: "AA==" }] };
  const deps = fakeDeps({ preview: async () => same });
  await run(deps);
  expect(deps.judged).toEqual(["https://a.com"]);
});
