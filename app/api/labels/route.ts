import { mkdirSync, writeFileSync } from "node:fs";

export const runtime = "nodejs";

// Local only: the owner's review labels become a file the eval scripts can read. Disabled in production.
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development" || process.env.SHOWCASE_ENABLE_REVIEW !== "true") return new Response("Not found", { status: 404 });
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.items) || body.items.length > 2000) return Response.json({ error: "bad labels" }, { status: 400 });
  mkdirSync("docs/eval", { recursive: true });
  writeFileSync("docs/eval/labels.json", JSON.stringify({ savedAt: new Date().toISOString(), items: body.items }, null, 2));
  return Response.json({ ok: true, count: body.items.length });
}
