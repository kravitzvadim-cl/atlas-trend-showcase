# Atlas Trend

Type a trend. Get the kit, with receipts.

Atlas Trend is a research agent for design trends. You type a trend like "neo brutalism". Scout, its mascot, searches the real web, keeps the examples that actually show the trend, and says why it set the rest aside. Then it hands you a credited style kit: colours sampled from real pixels, type traits, live components and tokens you can paste.

This system covers both surfaces: **the tool** (the Trend Board app) and **the landing page** (the public site on its own domain). They share one brand. The tool is calm and dense; the landing page uses the same parts at poster scale. See *Landing page* for what changes there.

## The idea: the Build Booklet

Atlas Trend looks like a toy-brick instruction booklet: white pages, navy ink, flat fields of primary colour, rounded-brick corners and 2px rules. A research run reads as numbered build steps that end in a parts list. The one place the booklet gives way is the **trend stage**, where each researched trend is drawn in its own tokens.

Three things to keep in mind:
1. **Show the work.** The reasoning is the product. Every step is visible, timed and sourced.
2. **Real sources, credited.** Every example links to the page it came from. Generated output is original.
3. **Honest numbers.** Time, cost and quality are measured, never invented. If a number on the page changes, the page changes.

## Voice

Write like a friendly expert explaining a build step: short, plain, concrete.

- Say what happened, with the number: "Found 8 pages. Judging 20 images." Not "Analysing the web for you…"
- Use **kept** and **set aside**, never "rejected" or "failed". A set-aside reason is quoted as Scout wrote it: "3D dark room scene, not neo brutalism".
- Credit sources by domain: "via neobrutalism.com".
- Numbers come from a real run: "$0.024", "42.3 s", "97% on 79 images". Round only when the page says it is rounded ("~$0.02").
- No hype words, no exclamation marks, no emoji. Scout reports state in one line; it never chats.
- Buttons say exactly what happens: "Browse the boards", "Open board", "Copy".

## Colour

A white page, navy ink and four toy-brick primaries used as **solid fields**.

| Role | Token | Rule |
| --- | --- | --- |
| Page and text | `ground`, `ink`, `ink-2` | White page, navy text. Slate for secondary text. |
| Structure | `line`, `chip` | 2px Rule Grey borders; Chip Grey quiet fills. |
| Live work | `cobalt`, `cobalt-soft` | In the tool, cobalt means "the agent is working here now", plus focus and input. Never decoration. |
| Set aside | `red`, `red-soft`, `red-deep` | Failures and set-aside items. Red text on tints uses `red-deep`. |
| Done, kept | `green`, `green-deep` | Finished steps, kept verdicts, source credits. |
| Highlight | `yellow` | Set tiles, the ok dot, Scout's sparkle, highlight bricks. Always with `ink` text. |
| Code | `code-night` | The code panel only. |

**Solid brick rule.** Primaries appear as flat fields or solid dots. No gradients, no shadows in the booklet chrome. The only tints are the `-soft` fills.

**Tile cycle.** AT-0xx set tiles cycle red, cobalt, yellow, green, ink, in that order. The red tile uses `red-tile` so its white set number passes 4.5:1. Red, cobalt and ink tiles take white text; yellow and green take `ink`.

**Contrast notes.** `ink-2` on `ground` passes. White on `red` fails, so use `red-tile`. White on `cobalt` is 4.4:1, so keep white text on cobalt at 18px bold or larger.

## Type

| Face | Role |
| --- | --- |
| **Bricolage Grotesque** 700–800 | Display and headings. Chunky, slightly quirky, tight tracking (-0.02 to -0.04em). |
| **Figtree** 500–700 | UI and body text. Friendly and very legible. |
| **Geist Mono** 500, tabular numbers | Data only: set numbers, hex values, counts, timings, badges, code. |

All three load from Google Fonts. **Mono means data:** Geist Mono is never used for headings or prose. **Plain headings:** in the tool, section headings are plain navy display text, optionally followed by a grey mono `×N` count.

## Shape and layout

- **Rounded bricks.** Corners come from the radius scale, 7px to 24px, with `radius-pill` for chips and dots.
- **2px rules** do the work shadows usually do. Dashed 2px rows mark list items.
- **Flat by default.** Depth is allowed only inside the trend stage.
- Spacing steps are 8, 12, 16, 24 and 32px. Keep a 16px gutter on phones.

## Scout

Scout is the face of the agent: a round green researcher with a magnifier-lens eye and a small antenna. It shows how the run is going. It never chats, and it never blocks the task. See the *Scout* section and the Mascot assets.

## The trend stage

The Components stage is the one place the booklet steps aside. It draws each researched trend in that trend's own tokens: glass, hard shadows, clay, bento, kinetic type. Keep the trend's look inside the stage, and keep the booklet chrome around it.

## Logo

The mark is four rounded bricks in a 2×2 grid, red, cobalt, yellow and green, with a 3px gap. The lockup is the mark plus "Atlas Trend" in Bricolage Grotesque 800 at about 0.8× the mark's height, set in `ink`. Leave a clear space of one brick around the lockup. Don't recolour the bricks, don't rotate the mark, and don't turn "Atlas" into a globe or map motif.

## Motion

All chrome motion uses one easing curve, `--ease: cubic-bezier(0.2, 0.8, 0.2, 1)`. Movement distances are multiplied by `--move`, which is 1 normally and 0 under reduced motion. Typical durations: 160ms for buttons, 240ms for step and callout state changes, 280–320ms for rows sliding and thumbnails dropping in (staggered 40ms, at most 10 steps).

## Sources

This system was built from `DESIGN.md`, `PRODUCT.md`, `app/globals.css`, `components/Scout.tsx` and the approved landing-page canvas. Component previews are static drawings styled with these tokens, not the app's React components.

There is no dark theme, because the tool doesn't have one. The Booklet is a light-only system by design.
