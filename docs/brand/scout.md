# Scout

Scout is Atlas Trend's mascot and the visible face of the agent. It is a round green researcher (`green` body) with a magnifier lens for an eye (`lens` glass, 4px `ink` rim, a short handle) and a small antenna. On the excited pose a `yellow` sparkle appears.

## Always use the real Scout

Scout is defined in code in `components/Scout.tsx` (viewBox `18 18 130 130`). Use that component in the tool, and the same SVG markup (or the Mascot asset files) on the landing page and anywhere else. **Never redraw Scout, trace it, or make a look-alike.** If a new pose is needed, add it to `Scout.tsx` first.

## Moods

Each mood reports a state. Pick the mood from the state; never use one for decoration alone.

| Mood | When | Face |
| --- | --- | --- |
| `idle` | Waiting for a search, or resting beside finished content | Round eyes with highlights, small smile, slow blink |
| `thinking` | A step is running | Slightly lowered eyes, flat mouth, gentle bob (1.6s) |
| `excited` | A run finished, or something good was found | Arched happy eyes, open smile, a yellow sparkle, one hop |
| `confused` | An error, or nothing usable was found | Uneven eyes, wavy mouth, a slight tilt |

## Placement

- **Tool:** inside the status card at 72px, next to a one-line status in body text ("Found 8 pages. Judging 20 images.").
- **Landing page:** larger (96 to 120px), perched on the film stage or a brick, with a white speech bubble (2px `ink` border, 16/16/4/16px corners). Use `idle` or `thinking` in the hero and `excited` in the closing band.
- Scout's speech is always a real status line from a run, never a sales pitch.

## Motion

Blink every 4.5s, bob while thinking, hop once when excited. All of it stops under `prefers-reduced-motion`.

## Don't

- Don't give Scout new colours, outfits, or a mouth that talks.
- Don't put Scout in front of content it would hide, or make it block a task.
- Don't use Scout as a loading spinner on its own; pair it with the status line.
