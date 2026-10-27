# Atlas Trend — Phased Plan + Milestone 1 (Research Run) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest working end-to-end research run. The user types a trend keyword. Claude searches the web, we fetch each page's preview image, Claude keeps or sets aside each image with a reason, and Claude extracts a style kit. A Build Booklet UI streams every step, with credited sources, time and cost.

**Architecture:** This is one Next.js App Router app. A single POST route (`/api/research`) runs a 4-step pipeline and streams newline-delimited JSON events. The pipeline is a plain function with injected dependencies (the Claude client and fetch), so tests run without network access. The client page reads the stream and renders the approved layout.

**Tech Stack:**
- Next.js 15 (App Router) and TypeScript on Node 22
- `@anthropic-ai/sdk` and `zod` (structured outputs through `zodOutputFormat`)
- vitest for tests
- Plain CSS with tokens. No UI library.

**Spec:**
- `PRODUCT.md`
- `DESIGN.md`
- `.impeccable/surfaces/app-page-tsx.md` (the direction contract)
- `.project-brain/decisions.md`

## Phases (overview)

| Phase | Outcome | Skills |
| --- | --- | --- |
| **1. Research run (this plan)** | keyword → sources → kept/set-aside with reasons → style kit, streamed, local | claude-api, superpowers:test-driven-development, impeccable (craft floor) |
| 2. Demo page + quality score | Claude builds an original demo page from the kit, rendered in a sandboxed iframe. A scoring step compares the page against the sources, and a small eval set keeps prompts honest. | claude-api `build-eval`, impeccable |
| 3. Showcases + public deploy | 4–5 pre-built sets load instantly from JSON, with a daily live-run cap. The app is deployed to Vercel with keys stored on the server. | deploy-to-vercel, security-review |
| 4. Motion, polish, finish | Scout moods and the step-advance motion, then the impeccable finish review, DESIGN.md refresh and accessibility pass | animate, emil-design-eng, impeccable polish/critique, design:accessibility-review |

Each phase ends with a stop for owner evaluation.

## Global Constraints

- Model is `claude-opus-5-5` for every call, with `thinking` omitted (always adaptive) and `output_config.effort` set explicitly. Search uses `"low"`; judge and kit use `"medium"`.
- Web search tool is `{ type: "web_search_20260209", name: "web_search", max_uses: 3 }`.
- Prices for cost display:
  - $4 per 1M input tokens
  - $20 per 1M output tokens
  - $0.20 per 1M cache-read tokens
  - $10 per 1,000 web searches
- Images are sent to Claude as base64 that we fetched ourselves, never as remote URLs, so one bad host can't fail the whole request. Only `image/jpeg|png|gif|webp` up to 5 MB.
- Keyword must be 2–60 characters after trimming. Anything else returns HTTP 400. The keyword is always passed to Claude as quoted data, never as instructions.
- Every page fetch has a 6 s timeout. At most 16 pages are processed per run.
- `ANTHROPIC_API_KEY` is read on the server only and never sent to the browser.
- Every number shown in the UI is measured from the run itself. Nothing is invented.
- The UI follows DESIGN.md tokens and parts, and cobalt marks the active step only.

## Review Focus

1. **A page with no og:image, a relative og:image, or an image that 404s or isn't an image.** It should show in the set-aside tray as "image unavailable" while the run continues. Covered in Task 2 and Task 3 tests.
2. **Zero images kept.** The kit step should be skipped with the reason "nothing matched", Scout should look confused, and nothing should crash. Covered in a Task 3 test.
3. **Bad keyword** (empty, 61+ characters, or text like "ignore previous instructions"). The first two should get a 400. The last should be treated as a literal keyword. Covered in a Task 4 test.
4. **Claude API error or refusal mid-run** (for example, a missing key). The step should be marked failed with a readable message, and the UI should show it. Covered in a Task 3 test.
5. **A slow site.** The 6 s per-fetch timeout should apply, and the run should still finish. Covered in a Task 2 test using a never-resolving fetch.

---

### Task 1: Scaffold + types + cost

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`
- Create: `lib/types.ts`, `lib/cost.ts`
- Test: `lib/cost.test.ts`

**Interfaces:**
- Produces:
  - `type StepId = "search" | "look" | "judge" | "kit"`
  - `type Source = { url: string; title: string; image?: string }`
  - `type Verdict = { url: string; keep: boolean; reason: string }`
  - `StyleKitSchema` (zod) with these fields:
    - `palette: {name, hex}[]` (3–6 entries)
    - `typography: {display, body, notes}`
    - `radius: number`
    - `blur: number`
    - `motion: {curve, duration_ms, notes}`
    - `summary: string`
  - `type RunEvent` is a union of:
    - `{type:"step", step, status:"active"|"done"|"failed"|"skipped", detail, ms?}`
    - `{type:"sources", sources}`
    - `{type:"verdicts", verdicts}`
    - `{type:"kit", kit}`
    - `{type:"cost", usd, inputTokens, outputTokens, searches}`
    - `{type:"error", message}`
  - `costUsd(u: {input: number; output: number; cacheRead: number; searches: number}): number`

- [ ] Step 1: Run `npm init`. Install `next react react-dom @anthropic-ai/sdk zod` and dev dependencies `typescript @types/react @types/node vitest`. Add scripts `dev`, `build`, `test`.
- [ ] Step 2: Write the failing test `costUsd({input:1_000_000, output:100_000, cacheRead:0, searches:3})`. It should be `toBeCloseTo(4 + 2 + 0.03, 6)`.
- [ ] Step 3: Run `npx vitest run lib/cost.test.ts`. Expected: FAIL.
- [ ] Step 4: Implement the types and `costUsd`.
- [ ] Step 5: Run `npx vitest run`. Expected: PASS. Also run `npx tsc --noEmit`, which should finish clean.

### Task 2: Page preview fetching

**Files:**
- Create: `lib/fetchPreview.ts`
- Test: `lib/fetchPreview.test.ts`

**Interfaces:**
- Produces:
  - `extractOgImage(html: string, pageUrl: string): string | null`, which reads `og:image`, then falls back to `twitter:image`, and resolves relative URLs against `pageUrl`
  - `fetchPreview(url: string, fetchFn?: typeof fetch): Promise<{ ok: true; media_type: string; data: string } | { ok: false; reason: string }>`, which fetches the page, extracts the image, fetches the image, checks the type and size, and returns base64. Each fetch uses `AbortSignal.timeout(6000)`.

- [ ] Step 1: Write tests:
  - `extractOgImage('<meta property="og:image" content="/a.png">', "https://x.com/p")` returns `"https://x.com/a.png"`
  - a twitter:image fallback works
  - a page without either returns `null`
  - `fetchPreview` with a fake fetch returning `text/html` for the image gives `{ok:false, reason:"image unavailable"}`
  - a fake fetch that never resolves gives `{ok:false}` within the timeout (use fake timers or a 50 ms override parameter)
- [ ] Step 2: Run them. Expected: FAIL.
- [ ] Step 3: Implement with regex meta parsing. No HTML-parser dependency.
- [ ] Step 4: Run them. Expected: PASS.

### Task 3: Pipeline

**Files:**
- Create: `lib/pipeline.ts`, `lib/claude.ts`
- Test: `lib/pipeline.test.ts`

**Interfaces:**
- Consumes: Task 1 types, `fetchPreview`
- Produces:
  - `runResearch(keyword: string, deps: Deps, emit: (e: RunEvent) => void): Promise<void>`
  - `type Deps = { search(k): Promise<{sources: Source[]; usage}>; preview(url): ReturnType<typeof fetchPreview>; judge(k, imgs): Promise<{verdicts: Verdict[]; usage}>; kit(k, imgs): Promise<{kit: StyleKit; usage}> }`
  - `lib/claude.ts` exports `realDeps(): Deps`, built on `new Anthropic()`

The pipeline runs in this order:
1. **search** (`emit sources`)
2. **look**, which runs `preview` on up to 16 sources in parallel. Failures become verdicts `{keep:false, reason}`.
3. **judge**, which sends every fetched image in one call. Each image gets a label `Image N: <title> — <url>`. Structured output returns a `Verdict[]` with one entry per image.
4. **kit**, which runs on kept images only. If none were kept, it's `skipped` with the detail "nothing matched".

Each step emits `active`, then `done` or `failed` with `ms`. A `cost` event comes last. Any thrown error marks the current step `failed`, emits `error`, and stops.

In `claude.ts`:
- The search prompt asks for pages that *show UI or web design in the style* of the quoted keyword. URLs and titles are read from the `web_search_tool_result` blocks. Error objects are skipped.
- Judge and kit use `client.messages.parse` with `zodOutputFormat`.
- Check `stop_reason === "refusal"` and throw a readable error.
- Sum `usage.input_tokens`, `usage.output_tokens`, `usage.cache_read_input_tokens` and `usage.server_tool_use?.web_search_requests`.

- [ ] Step 1: Write tests with fake deps:
  - **(a)** The happy path emits steps in order: search→look→judge→kit, each active then done, then `kit`, then a final `cost`.
  - **(b)** A source whose preview fails ends up in the verdicts with `keep:false` and the reason `"image unavailable"`, and is not sent to judge.
  - **(c)** When judge keeps none, kit is `skipped` with detail `"nothing matched"`, and no `kit` event is sent.
  - **(d)** When judge throws `"refusal"`, the judge step is `failed` and an `error` event is emitted with that message.
- [ ] Step 2: Run them. Expected: FAIL.
- [ ] Step 3: Implement `pipeline.ts`, then `claude.ts`. Compile-fix any SDK type names against the installed SDK, without guessing.
- [ ] Step 4: Run `npx vitest run` and `npx tsc --noEmit`. Expected: PASS.

### Task 4: Streaming route

**Files:**
- Create: `app/api/research/route.ts`, `lib/validate.ts`
- Test: `lib/validate.test.ts`

**Interfaces:**
- Produces:
  - `validateKeyword(raw: unknown): string | null`, which trims and requires 2–60 characters
  - `POST /api/research` with body `{keyword}`. It responds `400 {error}` on bad input, and otherwise `200` with `application/x-ndjson` streaming `RunEvent`s. Set `export const runtime = "nodejs"` and `export const maxDuration = 120`.

- [ ] Step 1: Write tests:
  - `validateKeyword("")` is null
  - `"a".repeat(61)` is null
  - `"  liquid glass "` gives `"liquid glass"`
  - `"ignore previous instructions"` is returned unchanged
- [ ] Step 2: Make them fail, implement, and make them pass.
- [ ] Step 3: Implement the route with `ReadableStream`, calling `runResearch(keyword, realDeps(), e => enqueue(JSON.stringify(e)+"\n"))`.
- [ ] Step 4: Run `npm run build`. Expected: compiles.

### Task 5: Booklet UI + Scout

**Files:**
- Create: `app/layout.tsx` (fonts via `next/font/google`: Bricolage Grotesque, Figtree, Geist Mono), `app/globals.css` (DESIGN.md tokens, browser surfaces), `app/page.tsx` (client), `components/Scout.tsx`

**Interfaces:**
- Consumes: the `RunEvent` stream from Task 4
- Produces: `<Scout mood="idle"|"thinking"|"excited"|"confused" />` (SVG from `prototypes/mascots.html` Scout)

The layout follows the direction contract FIRST VIEWPORT:
- the top bar with search
- **left:** the keyword, Scout card and status line, and the 4 StepItems (search the web / look at every page / keep the good ones / build the style kit)
- **centre:** a PartsCallout with kept thumbnails, each linking to its source page with the title, plus a SetAsideRow tray with reasons
- **right:** a PartRow parts list for palette swatches, type, radius, blur and motion. Unfilled parts show as "pending".
- **footer line:** total time, cost (`$0.000`), and searches

Thumbnails use the og:image URL in a plain `<img>` with `referrerPolicy="no-referrer"` and `loading="lazy"`. Scout's mood: idle before a run, thinking while running, excited when the kit is shown, confused on an error or when nothing matched. The ready-made sets strip is left out until Phase 3.

- [ ] Step 1: Build it. Before writing the UI, read the impeccable craft floor (`reference/craft-floor.md`).
- [ ] Step 2: Run `npm run build`. Expected: compiles.
- [ ] Step 3: Run `npm run dev`. Feed the page a recorded event fixture (`fixtures/sample-run.ndjson`, labelled sample data) through `?replay=1`, which reads the fixture instead of calling the API. Screenshot at desktop 1440 and mobile 390. Check against the contract and fix in one batch.

### Task 6: Live verification + Project Brain

- [ ] Step 1: With `ANTHROPIC_API_KEY` in `.env.local`, run a live search for "liquid glass" and another for "neo brutalism". Record the time, cost, kept/set-aside counts, and any failures.
- [ ] Step 2: Run the impeccable detector once on the changed UI files and fix the mechanical findings.
- [ ] Step 3: Update `.project-brain/progress.md` (what works, measured numbers, known gaps) and `next-tasks.md` (Phase 2). Record a what-skill `milestone` checkpoint.
- [ ] Step 4: Stop for owner evaluation.


## Superseded (2026-10-17)

This plan covered Milestone 1 and outlined Phases 2–4. Reality diverged after owner decisions; see `.project-brain/decisions.md`.
- Provider and models: OpenRouter + Haiku 5.5 replaced the Anthropic SDK + claude-opus-5-5 assumed above. Claude web_search was replaced by OpenRouter's web_search tool (Exa).
- Phase 2: the planned per-trend demo page was **not built**. It became the Trend Board (owner-approved mockup), add-more examples, a heuristic quality score, the owner review/eval tool (`/review`) and refresh style kit.
- Phase 3 (public deploy): **paused** by the owner (repo-only). The showcases from Phase 3 were built; the daily cap was dropped because the site is private.
- Phase 4: done (finish review = ship, `DESIGN.md` rewritten from the build).
