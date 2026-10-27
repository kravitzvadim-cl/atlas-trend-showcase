import { appendFileSync, mkdirSync } from "node:fs";
import { config } from "@/lib/config";
import { openRouterDeps } from "@/lib/openrouter";
import { runResearch } from "@/lib/pipeline";
import { validateKeyword } from "@/lib/validate";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (process.env.SHOWCASE_ENABLE_LIVE !== "true") return Response.json({ error: "Live AI calls are disabled in this showcase. Use the sample boards, or explicitly configure your own local environment." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const keyword = validateKeyword(body?.keyword);
  if (!keyword) return Response.json({ error: "Enter a keyword between 2 and 60 characters." }, { status: 400 });
  // Adding to an existing board: search the new phrase, judge against the board's trend, keep its kit.
  const addTo = body?.addTo === undefined ? null : validateKeyword(body.addTo);
  if (body?.addTo !== undefined && !addTo) return Response.json({ error: "Invalid board to add to." }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY) return Response.json({ error: "The server has no OpenRouter API key." }, { status: 500 });

  const limits = { maxRunUsd: config.maxRunUsd, maxSources: config.maxSources, maxImages: config.maxImages, ...(addTo ? { judgeAs: addTo, skipKit: true } : {}) };
  // Local development keeps every run on disk so results can be evaluated later (docs/runs is git-ignored).
  const logFile =
    process.env.NODE_ENV === "development"
      ? `docs/runs/${new Date().toISOString().replace(/[:.]/g, "-")}-${keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ndjson`
      : null;
  if (logFile) mkdirSync("docs/runs", { recursive: true });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await runResearch(keyword, openRouterDeps(), (e) => {
        const line = JSON.stringify(e) + "\n";
        if (logFile) appendFileSync(logFile, line);
        controller.enqueue(enc.encode(line));
      }, limits);
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
