import { appendFileSync, mkdirSync } from "node:fs";
import { parseAskRequest } from "@/lib/ask";
import { askScout } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 60;

// Local development keeps every paid ask on disk (request, answer, cost or error) so it can be checked later.
function log(entry: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  mkdirSync("docs/runs", { recursive: true });
  appendFileSync("docs/runs/asks.ndjson", JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
}

export async function POST(req: Request) {
  if (process.env.SHOWCASE_ENABLE_LIVE !== "true") return Response.json({ error: "Live AI calls are disabled in this showcase. Use the sample boards, or explicitly configure your own local environment." }, { status: 403 });
  const parsed = parseAskRequest(await req.json().catch(() => null));
  if (!parsed) return Response.json({ error: "Scout couldn't read that request. Use 2 to 200 characters." }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY) return Response.json({ error: "The server has no OpenRouter API key." }, { status: 500 });
  try {
    const { answer, usage } = await askScout(parsed);
    log({ request: parsed, answer, usage });
    return Response.json({ reply: answer.reply.slice(0, 240), actions: answer.actions, usage });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scout couldn't answer.";
    log({ request: parsed, error: message });
    return Response.json({ error: message }, { status: 502 });
  }
}
