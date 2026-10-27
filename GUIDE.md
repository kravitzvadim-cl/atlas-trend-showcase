# Atlas Trend

Type a visual-design trend ("liquid glass", "neo brutalism", "claymorphism"). An AI agent, Scout, searches the web, collects example images, keeps or sets aside each one with a stated reason, and builds a **Trend Board** for that trend. The board contains:
- a credited mood board
- colours sampled from the real pixels
- type traits
- live components drawn in the trend's style
- copy-ready tokens (CSS / Tailwind / JSON)
- the evidence of what was rejected
- a heuristic quality score

It's a private portfolio project: repo-only, with an optional password.

## Run it

```bash
npm install
cp .env.example .env.local   # add OPENROUTER_API_KEY; optional SITE_PASSWORD and limits
npm run dev -- -p 3100
npx vitest run               # 66 tests
```

Free ways to look around (no API calls):
- `/?replay=1` plays a sample run.
- `/?showcase=claymorphism` opens one of the 5 ready-made boards.
- `/review` is the owner's labelling tool.

## How it works

1. **Search.** OpenRouter's web search tool (Exa) is driven by `anthropic/claude-haiku-5.5`. Only cited URLs are used.
2. **Look.** Each page and its images are fetched server-side, with safeguards:
   - redirect hops are re-checked
   - private addresses are blocked
   - size caps apply
   - the real format is read from the file bytes
3. **Judge.** One vision call returns a keep/set-aside verdict with a reason per image, as structured output. Images are deduplicated and capped at 20.
4. **Kit.** One call extracts the trend's palette, type traits, radius, blur, motion and related searches. Colours are then re-sampled from the pixels with `sharp`.

Every step streams to the UI with its time, and the cost shown is OpenRouter's measured `usage.cost`. A per-run budget stops new paid steps once it's reached. If Anthropic is unavailable, a backup model (`google/gemini-2.5-flash`) is used. Refusals are never retried.

## Evidence

- Judge vs owner labels: **97% accuracy, 96% precision, 100% recall** on 79 images. The write-up includes its limits: `docs/eval/README.md`.
- Measured cost is about $0.02 and 30–45 s per search on Haiku 5.5.
- Design: an independent finish review reached "ship". The shipped design system is in `DESIGN.md`.

## Project records

- `PRODUCT.md`: product truth
- `DESIGN.md`: design system
- `docs/brand/`: brand guidelines for the tool and the public landing page (voice, Scout, LP rules, tokens)
- `docs/landing-page/`: landing page direction
- `.project-brain/`: decisions, progress, next tasks
- `WHAT-SKILL-PERFORMANCE-AUDIT.md`: a critical self-audit of the AI mentor process used to build this
