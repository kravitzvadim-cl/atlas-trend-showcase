# Landing-page ad video: design

Date: 2026-10-23. Status: approved by the owner on 2026-10-23.

## Why

The landing page needs an ad that makes a first-time visitor understand what Atlas Trend is and what it does. The current hero video (`video/hero.mp4`, a 30 s screen recording) stays in the portfolio case study. It doesn't show the newer features, and it looks like a demo, not an ad.

## Goals

- In 30 seconds, a viewer gets it: type a trend, get real credited examples with reasons, ask for more, turn it into a design system, and drop the kit into your code or AI coding tool.
- Show the new features: Ask Scout, the design system, and "Use in my project" (rules for AI coding tools, a shadcn theme).
- Look like a professional product ad, with real-looking people in good quality: a designer and a developer working together.
- Stay true as the tool changes. It sells the idea in stylised shots, not exact screen recordings.

## Non-goals

- Not a tutorial or a full feature tour.
- Not a replacement for the portfolio hero video.
- No voice-over (my call: the captions carry it, so it works muted).
- 16:9 only (owner, 2026-10-23). No vertical cut planned; faces and key screens kept near centre where possible so a rough vertical cut stays an option.

## Anti-goals (a failure even if it looks good)

- Fake proof: no testimonials, quotes, customer names, logos or invented numbers. The people are AI-generated actors in a product ad, nothing more.
- Showing features the tool doesn't have.
- Garbled AI text on screens.
- The two faces changing between shots.
- Hype copy against the brand voice: no exclamation marks, no "revolutionary", no emoji (`docs/brand/README.md`).

## Decided by the owner

- Made with Higgsfield.
- Story: the designer hunts for inspiration and references; the developer helps reach the design goal; they work together, and Atlas Trend is the bridge.
- Cool music in the background.
- Setting: playful, yet professional.
- The script below (approved in chat on 2026-10-23: "Sounds good").

## The script

Trend shown: **neo brutalism** (owner, 2026-10-23). Our proof test showed an AI building a clearly on-trend neo-brutalist page from the exported kit alone (`docs/proof/neo-brutalism-*`), so shot 5 shows a real result. Liquid glass was set aside because its proof page came out weak.

30 s, 16:9, six shots of about 5 s each. Captions on screen, no voice. Music: bouncy, upbeat funk, lifting into the end card.

**Setting:** a bright creative studio with a colour-blocked wall, sticky notes, plants and two big screens.
**People:** the designer (he, late 20s, relaxed, sketchbook nearby) and the developer (she, early 30s, headphones around her neck, dark code editor). The designer as "he" comes from the owner; the developer's look is my call.

| # | Time | Shot | Caption |
|---|---|---|---|
| 1 | 0–5 s | The designer scrolls an endless wall of saved screenshots and sighs. Sticky notes behind him: "bolder?", "louder?", "refs?" | Hunting for the look? |
| 2 | 5–10 s | He types **neo brutalism** into one clean search bar. The screen blooms into a mood board of real examples, each with a small credit tag. A few cards slide aside with a short reason. | Type a trend. Scout finds real examples, and says why. |
| 3 | 10–15 s | Close-up: colours lift off the images into swatches; type and buttons snap into place. He types "add a pricing card, softer accent" and the card pops in. He grins. | Ask for more. It builds it. |
| 4 | 15–20 s | He spins his chair and waves the developer over. She leans in. One click, and the board folds into a design-system sheet: shades, type sizes, spacing. | One click: a design system. |
| 5 | 20–25 s | At her desk she drops one file into her project. Files fan out (AI-tool rules, a shadcn theme) and a page builds itself in the same look. | Drop the kit into your code, or your AI tool. |
| 6 | 25–30 s | Both look at the finished page on the big screen and fist-bump. Cut to the end card: logo, headline, CTA. | **Type a trend. Get the kit, with receipts.** Try Atlas Trend |

## How it gets made (my calls, open to the grilling)

1. **Characters first.** Make one reference image each of the designer and the developer in Higgsfield, approved by the owner, and build every shot from those, so faces stay the same.
2. **Shots.** One Higgsfield image-to-video clip per shot, about 5 s each. Screens are generated glowing or near-blank on purpose.
3. **Screens and text in the edit, not in the AI.** The tool's look is laid onto the screens in the edit, using real Atlas Trend visuals (showcase boards, the design-system block, the kit file list), stylised and slightly soft. Captions are set in the brand fonts. This keeps every word sharp and every feature real.
4. **Music.** Reuse `video/the_mountain-funky-commercial-618217.mp3` (Pixabay, free licence, already downloaded), cut to 30 s with a clean ending. Owner, 2026-10-23: same track as the portfolio video, so it becomes the brand sound, but a different, more energetic 30 s section than the portfolio cut uses, ending cleanly on the end card.
5. **End card.** Built in the brand style (Build Booklet: white page, navy ink, primary fields), not generated.
8. **Scout (owner, 2026-10-23).** The mascot appears small, added in the edit from the existing Scout artwork in `docs/brand/assets/`, never generated: as a flat sticker beside the search bar in shot 2 (`scout-thinking.svg`), and next to the logo on the end card (`scout-excited.svg`).
6. **Output.** `video/ad/` (git-ignored, like the other video files): `ad.mp4` (H.264), `ad.webm`, `ad-poster.jpg`, at 1920×1080. It autoplays muted on the landing page, with an unmute button, and loops.
7. **Budget.** Owner cap, 2026-10-23: **200 Higgsfield credits** for the whole ad, quality first (pick the better model when the price fits). Keep characters + six shots under about 140 so the rest covers retakes. If a real quote shows it cannot fit, stop and ask; never cut quality quietly. The cost is quoted per step (characters, then shots, then retakes), and spend is reported as measured. The last known balance was 483 credits; check it again before quoting.

## Constraints

- The owner approves the character images before any video is generated.
- No paid generation without an owner OK and a cap.
- Nothing published or deployed. Video files stay out of git; this document and notes go in git.
- The Higgsfield connection dropped in the session where this was written. It must be reconnected before generating.

## Left to the builder

- Exact prompts, camera moves and which Higgsfield model to use (quote cost per model first).
- Cut timing to the music's beats.
- How the screen overlays are tracked onto the generated screens. If a shot's screen moves too much to track, regenerate it with a steadier camera instead.
