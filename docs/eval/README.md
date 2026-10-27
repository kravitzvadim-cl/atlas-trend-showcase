# Judge evaluation — 2026-10-16

Ground truth: the project owner reviewed every image the judge (Scout, `anthropic/claude-haiku-5.5`) kept or set aside across the 5 showcase boards (`/review`). Raw labels: `labels.json`.

| Trend | Labelled | Not sure | Accuracy | Precision (kept were good) | Recall (good were kept) |
| --- | --- | --- | --- | --- | --- |
| liquid glass | 16 | 2 | 100% | 100% | 100% |
| neo brutalism | 20 | 0 | 100% | 100% | 100% |
| bento grid | 20 | 0 | 100% | 100% | 100% |
| kinetic typography | 12 | 0 | 100% | 100% | 100% |
| claymorphism | 11 | 1 | 82% | 67% | 100% |
| **All** | **79** | **3** | **97%** | **96%** | **100%** |

Errors (2): both claymorphism, both *kept* — 3D clay illustrations (a globe, a blob character) rather than clay-styled UI. The judge prompt asks for "UI, web or motion design"; clay illustration sits on that boundary.

Honest limits:
- One labeller, 79 images, 5 trends. Small sample.
- Labels were given while seeing Scout's verdict, which can bias toward agreement (anchoring). A blind pass (verdict hidden) would be a stronger test.
- Recall only covers images the pipeline collected; good images it never found are invisible to this test.

Next: re-judge the same images with other models (paid, needs approval) and compare against these labels.
