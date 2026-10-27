import { z } from "zod";

export type StepId = "search" | "look" | "judge" | "kit";
export type StepStatus = "active" | "done" | "failed" | "skipped";

export type Source = { url: string; title: string; image?: string };
// url = the page the image came from; image = the judged image itself (absent when the page gave no usable image).
export type Verdict = { url: string; image?: string; keep: boolean; reason: string };

export const StyleKitSchema = z.strictObject({
  summary: z.string().describe("One sentence describing the trend as seen in the kept images"),
  palette: z.array(z.strictObject({ name: z.string(), hex: z.string().describe("#RRGGBB") })).describe("3 to 6 colours"),
  typography: z.strictObject({ display: z.string(), body: z.string(), notes: z.string() }),
  radius: z.number().describe("Typical corner radius in px"),
  blur: z.number().describe("Typical backdrop/blur amount in px, 0 if none"),
  motion: z.strictObject({ curve: z.string(), duration_ms: z.number(), notes: z.string() }),
  related: z.array(z.string()).describe("4 short search phrases for sub-styles or UI uses of THIS trend only, each naming a component or layout (e.g. '<trend> pricing table', '<trend> mobile navigation')"),
});
export type StyleKit = z.infer<typeof StyleKitSchema>;

// usd is the amount OpenRouter reports it charged; null when the provider did not report it (never estimated).
export type Usage = { usd: number | null; input: number; output: number; searches: number | null; models: string[]; usedFallback?: boolean };

export type RunEvent =
  | { type: "step"; step: StepId; status: StepStatus; detail: string; ms?: number }
  | { type: "sources"; sources: Source[] }
  | { type: "verdicts"; verdicts: Verdict[] }
  | { type: "kit"; kit: StyleKit }
  | { type: "board"; palette: { hex: string; share: number }[]; thumbs: Record<string, string> }
  | { type: "cost"; usd: number | null; inputTokens: number; outputTokens: number; searches: number | null; ms: number; models: string[] }
  | { type: "error"; message: string };
