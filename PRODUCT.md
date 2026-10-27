# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated (owner: "Let's proceed", 2026-10-16): Next.js 15 App Router + TypeScript, @anthropic-ai/sdk (claude-opus-5-5, web_search tool), zod, vitest, plain CSS tokens. Deploy target Vercel (Phase 3). Chosen because it is the most recognised full-stack AI stack for the target roles and keeps one language end to end.

## Users

- Primary: the owner, using it as a personal design-research tool.
- Evaluators: recruiters and hiring managers for AI builder, AI / full-stack engineer, AI product and AI enablement roles. They open a public link and give it about a minute.
- The product is framed for designers, motion designers and web developers who need to see what a visual trend (e.g. "glassmorphism") actually looks like and how to use it.

## Product Purpose

Type a trend keyword; an AI agent gathers real examples from the web, keeps the relevant ones, extracts a style kit (colour, type, spacing, motion, components) and generates an original example page in that style, with a quality score. Success: a recruiter understands the product within 60 seconds and sees the sources and the agent's reasoning; the owner is proud of at least 4 of 5 showcase pages.

## Positioning

Not a mood board and not an image generator: the agent's work is visible (searched, found, kept, rejected, why, time, cost), every claim links to real sources, and the output is a usable style kit plus a live page, not a collage.

## Operating Context

- 5 ready-made showcase boards load instantly; live search runs on demand. The site is private (SITE_PASSWORD) and repo-only, so spend is protected by the password, a per-run budget (MAX_RUN_USD) and the OpenRouter key's credit limit; there is no daily cap.
- Each live search takes tens of seconds; progress is narrated step by step.
- A pet-style mascot is the visual face of the agent: it mirrors search progress (idle, thinking, excited, confused, done) and adds good vibes. It does not chat.

## Capabilities and Constraints

- v1 excludes: accounts, saved collections, Figma export, video/reel analysis, chat with the mascot.
- Sources come from a proper search API; no copying content from Dribbble/Behance. Examples are linked and credited; generated pages are original.
- API keys server-side; public endpoint rate-limited.
- Search: Claude's built-in web_search tool (one API key). Mascot: Scout.

## Brand Commitments

- Name: Atlas Trend (meaning vs. theme not yet asked; do not turn "Atlas" into a motif by assumption).
- Owner reference: 21dev. Owner words: playful yet professional, colourful, inviting.
- Mascot is required.

## Evidence on Hand

- 5 showcase boards built from real searches (public/showcases), with credited 480px previews and a takedown note.
- Measured: ~$0.02 and ~30–45 s per search with Haiku 5.5 (docs/runs, .project-brain/progress.md).
- Judge evaluation against owner labels: 97% accuracy, 96% precision, 100% recall on 79 images (docs/eval/README.md, with limits).
- The replay fixture (public/fixtures/sample-run.ndjson) is synthetic and labelled SAMPLE RUN.

## Product Principles

1. Show the agent's work; the reasoning is the product.
2. Real sources, credited; generated output is original.
3. Instant first impression: showcases never wait on the network.
4. Personality serves clarity: the mascot reports state, it never blocks the task.
5. Honest numbers: time, cost and quality are measured, never invented.
