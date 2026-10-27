import { parseKitRequest } from "@/lib/kitRequest";
import { openRouterDeps } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (process.env.SHOWCASE_ENABLE_LIVE !== "true") return Response.json({ error: "Live AI calls are disabled in this showcase. Use the sample boards, or explicitly configure your own local environment." }, { status: 403 });
  const parsed = parseKitRequest(await req.json().catch(() => null));
  if (!parsed) return Response.json({ error: "Invalid kit request." }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY) return Response.json({ error: "The server has no OpenRouter API key." }, { status: 500 });
  try {
    const { kit, usage } = await openRouterDeps().kit(parsed.keyword, parsed.images);
    return Response.json({ kit, usage });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Couldn't rebuild the kit." }, { status: 502 });
  }
}
