---
name: Atlas Trend
description: A trend-research agent presented as a toy-brick build booklet, ending in a credited style kit.
colors:
  ground: "#ffffff"
  chip: "#f3f5f9"
  line: "#e3e6ee"
  ink: "#1f2a44"
  ink-2: "#56607a"
  red: "#e8412c"
  red-soft: "#fff4f2"
  red-deep: "#b42a18"
  yellow: "#ffc93c"
  cobalt: "#2f6feb"
  cobalt-soft: "#eaf1fe"
  green: "#2bb673"
  green-deep: "#1a6e46"
  code-night: "#0f1526"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(44px, 6vw, 72px)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    fontFeature: "tnum"
rounded:
  swatch: "7px"
  button: "10px"
  row: "14px"
  card: "18px"
  callout: "20px"
  stage: "24px"
  pill: "99px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "34px"
  button-outline:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "34px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "7px 12px"
  search-field:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    height: "46px"
  chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  set-tile:
    backgroundColor: "#c8351f"
    textColor: "{colors.ground}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  set-tile-light:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  status-card:
    backgroundColor: "{colors.chip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  set-aside-row:
    backgroundColor: "{colors.red-soft}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.button}"
    padding: "8px 12px"
---

# Design System: Atlas Trend

All values live in `app/globals.css` `:root`. The frontmatter above is the source of truth; prose explains where each value goes.

## Overview

*What this is for: the one-paragraph idea every new screen should feel like.*

**Creative North Star: "The Build Booklet"**

Atlas Trend looks like a toy-brick instruction booklet: white pages, navy ink, flat fields of primary colour, rounded-brick corners and 2px rules. A research run reads as numbered build steps that end in a parts list, with Scout (a green round researcher with a lens eye) reporting status. The interface stays flat and bright; the only place that changes material is the Components stage, which deliberately renders each researched trend in that trend's own tokens.

**Key Characteristics:**
- White ground, navy ink, solid primaries; no gradients in the Booklet chrome.
- Rounded-brick geometry (7–24px radii) and 2px structural rules.
- Display in Bricolage Grotesque, UI in Figtree, data in Geist Mono with tabular numbers.
- Flat by default; depth only inside the trend stage.
- One easing curve and a reduced-motion multiplier drive all chrome motion.

## Colors

*What this is for: which colour means what, so new parts don't invent new colours.*

A white page and navy ink carrying four toy-brick primaries as solid fields.

### Primary
- **Booklet Navy** (ink): all text, the primary button, the search field border, the fifth set-tile colour, and the toast.
- **Live Cobalt** (cobalt): "the agent is working here now": active step row and number, live parts callout border, busy add-more box, pulse dot. Also the focus ring, caret, search focus and input focus. Its pale tint (cobalt-soft) backs the active step and chip hover.

### Secondary
- **Brick Red** (red): set-aside and failure, plus the "thin" quality dot. Its tint (red-soft) backs set-aside rows, evidence rows, alerts and the thin score; red-deep is the readable red text on those tints and on reason pills.
- **Done Green** (green): finished steps (with navy number), the review progress bar, the "good" quality dot, and Scout's body. Green-deep is green text: "kept" verdicts, source credits, strong score.

### Tertiary
- **Brick Yellow** (yellow): set tiles, the "ok" quality dot, and Scout's sparkle. Always carries navy text, never white.

### Neutral
- **Page White** (ground): the page and white controls.
- **Chip Grey** (chip): quiet fills: status card, kit bar, thumbnail and image placeholders, inactive tabs, badges.
- **Rule Grey** (line): every 2px structural border, dashed list rows, and outline buttons at rest.
- **Slate** (ink-2): secondary text, counts, captions (passes 4.5:1 on white).
- **Code Night** (code-night): the code panel and active code tab only.

### Named Rules
**The Solid Brick Rule.** Primaries appear as flat solid fields or solid dots. No gradients, no tints mixed into the chrome beyond the -soft fills listed above.

**The Tile Cycle Rule.** Ready-made AT-0xx set tiles cycle red, cobalt, yellow, green, ink in that order. The red tile uses the deeper #c8351f so its 12px white set number passes 4.5:1. Red, cobalt and ink tiles take white text at full opacity; yellow and green tiles take navy ink text.

**The Live Cobalt Rule.** Outside the set tiles, cobalt marks only live work, focus and input; never decoration.

## Typography

*What this is for: which font and size to use for each kind of text.*

**Display Font:** Bricolage Grotesque (with system-ui)
**Body Font:** Figtree (with system-ui)
**Label/Mono Font:** Geist Mono (with ui-monospace)

**Character:** A chunky, slightly quirky grotesque for titles against a friendly, legible UI sans; mono is reserved for anything that is data.

### Hierarchy
- **Display** (800, clamp 44–72px, 0.95): the trend board's hero title only.
- **Headline** (800, 44px, 1; 36px under 560px): run title in the left column and review page title (40px).
- **Title** (700, 26px, 1.1): section headings. Board sections use 30px; library sections 22px; set tiles 22px/1.05 at 800.
- **Body** (500, 15px, 1.45): everything else. Lede 17px with 62ch max; small text 13px; labels and buttons 600–700.
- **Label** (Geist Mono 500, 11–13px, tabular): set numbers (AT-0xx), hex values, counts (×N), timings, badges, code (13px/1.7).

### Named Rules
**The Mono Means Data Rule.** Geist Mono is only for numbers, codes, hexes, counts and URLs. Never for headings or prose.

**The Plain Heading Rule.** Section headings are plain navy display h2, optionally followed by a grey mono ×N count. No numbered discs and no small labels above headings.

## Layout

*What this is for: how the page is divided and how it reflows on smaller screens.*

The run view is a 72px top bar, a three-column board (380px / fluid / 330px) separated by 2px rules, and a 56px receipt strip. The trend board is a single 1280px-max column with a sticky pill table of contents and sections divided by 2px rules (36px vertical padding). Mood images use a masonry of 220px columns; swatches and tiles use auto-fill grids (150–170px minimum). Spacing steps through 8 / 12 / 16 / 24 / 32px, with column padding 28px × 32px.

Breakpoints: at 1100px the board stacks to one column and padding drops to 16px; at 900px the trend board hero, type specimen and stage stack; at 760px review cards stack; at 560px the logo wordmark hides. Print hides chrome and keeps colours.

## Elevation & Depth

*What this is for: whether things float or sit flat.*

The Booklet chrome is completely flat: no box-shadows. Separation comes from 2px Rule Grey borders, Chip Grey fills, and -soft tinted rows. The only shadows in the product live inside the Components stage, where they belong to the researched trend (see Components).

### Named Rules
**The Flat Page Rule.** The chrome never casts a shadow. Hover lifts a tile or swatch by 3px and darkens its border instead.

## Shapes

*What this is for: how rounded corners and borders should be.*

Rounded-brick corners scale with size: 7px swatches, 10px buttons, 12–14px rows, thumbnails and inputs, 18–20px cards and callouts, 24px stage, full pills for chips, tags and the table of contents. Borders are 2px solid for structure and controls, 1.5px for pills and dashed list rows. The step number is the only circle. The logo is a 2×2 grid of rounded studs in red, yellow, cobalt, green.

## Components

*What this is for: the reusable parts, and how each one looks and behaves.*

### Buttons
- **Shape:** gently rounded (10px), 34px tall (40–42px in forms and review).
- **Primary:** navy fill, white 700 14px text; hover goes to a lighter navy (#2c3a5c).
- **Outline:** white with a 2px navy border.
- **Ghost:** no fill, 2px Rule Grey border; hover darkens the border to Slate.
- **Press:** every button scales to 0.97 on press (160ms). Disabled drops to 50% opacity.

### Chips
- **Style:** white pill, 2px Rule Grey border, 600 13px text.
- **State:** hover turns the border cobalt over a cobalt-soft fill. Reason tags are white pills with red-deep text and a pale red border.

### Cards / Containers
- **Status card:** Chip Grey, 18px corners, holds Scout and a one-line status.
- **Parts callout:** 2px Rule Grey box (20px corners) with a large display ×N count; border and count turn cobalt while live.
- **Swatch card:** white, 2px border, 18px corners, 120px colour field with a white contrast pill, name and mono hex below.
- **Set-aside row:** red-soft fill, struck-through title, red reason tag; rows slide in rather than vanish.

### Inputs / Fields
- **Search:** 46px, 2px navy border, 14px corners, Build button inside; border turns cobalt on focus.
- **Form input:** 40px, 2px Rule Grey border, 12px corners; border turns cobalt on focus.
- **Focus (global):** 2px cobalt outline, 2px offset.

### Navigation
- **Top bar:** logo studs + wordmark, search, actions; 2px bottom rule.
- **Board contents:** sticky row of pill links with 2px Rule Grey borders.
- **Code tabs:** Chip Grey tabs; the active tab joins the Code Night panel.

### Step Item (signature)
A 36px circle number with title and detail, time on the right. Waiting: grey outline. Active: cobalt circle on a cobalt-soft row, slides in. Done: green circle with navy number, pops in. Failed: deep red (#c8351f) with white number. Skipped: 55% opacity.

### Set Tile (signature)
Solid colour brick, 18px corners, min 132px tall, AT-0xx mono set number, 22px display name and a strip of the set's swatches. Follows the Tile Cycle Rule. Drops in with a 50ms stagger; lifts 3px on hover.

### Scout
Inline SVG mascot in Done Green with navy outline and a lens eye. Moods follow the pipeline: idle, thinking (gentle 2px bob), excited (one hop), confused (6° tilt). Blinks every 4.5s. Reports status only; never covers content.

### Components Stage (trend content, not Booklet chrome)
The stage previews the researched trend using that trend's own tokens, set inline from `lib/tokens.ts`: `--g` ground, `--a` accent, `--tx` text, `--on-a` text on accent, `--r` radius, `--b` blur, `--curve` easing, `--dur` duration. Its surface material comes from `surfaceFamily()`:
- **glass:** translucent fill, backdrop blur of `--b`, inner highlight and a soft drop shadow.
- **clay:** opaque puffy surfaces, soft outer shadow with inner highlight and shade, no borders or blur.
- **flat:** tinted fill with a hairline border.

These colours, radii, shadows and curves belong to the trend being shown and must never leak into the Booklet chrome.

### Motion
One easing for all chrome: `--ease` cubic-bezier(0.2, 0.8, 0.2, 1), at 160ms for presses, 240ms for state changes, 280–360ms for entrances. Entrance distances multiply by `--move` (1 normally, 0 under prefers-reduced-motion), so reduced motion keeps fades and drops movement. Adding `?capture` to the URL sets a `capture` class that disables all animation and transitions for review screenshots.

## Do's and Don'ts

*What this is for: quick guardrails to check a new screen against.*

### Do:
- **Do** take every colour from the `:root` tokens; tints only as the listed -soft and -deep variants.
- **Do** use 2px Rule Grey borders for structure and 2px navy for the primary input.
- **Do** put navy text on yellow and green fields, white on red, cobalt and navy.
- **Do** use Geist Mono with tabular numbers for set numbers, hexes, counts and timings.
- **Do** drive motion with `--ease` and multiply distances by `--move`.
- **Do** render researched trends only inside the stage, in their own tokens.

### Don't:
- **Don't** add box-shadows or gradients to the Booklet chrome.
- **Don't** use cobalt for decoration outside the set-tile cycle.
- **Don't** add eyebrow or kicker labels above headings, or numbered discs on section headings.
- **Don't** use red for anything other than set-aside, failure or the thin signal (and its place in the tile cycle).
- **Don't** let trend tokens (`--g`, `--a`, `--tx`, `--r`, `--b`, `--curve`, `--dur`) style anything outside the stage.
