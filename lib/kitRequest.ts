import type { JudgeImage } from "./pipeline";
import { validateKeyword } from "./validate";

const MAX_IMAGES = 20; // provider limit with large images, same as the judge
const MAX_DATA_URI = 1_500_000; // board thumbnails are ~20–80 KB; anything bigger was not made by us

// Refresh a board's kit from the thumbnails it already holds (no new search). Untrusted input: validate everything.
export function parseKitRequest(body: unknown): { keyword: string; images: JudgeImage[] } | null {
  const b = body as { keyword?: unknown; images?: unknown };
  const keyword = validateKeyword(b?.keyword);
  if (!keyword || !Array.isArray(b?.images) || b.images.length < 1 || b.images.length > MAX_IMAGES) return null;
  const images: JudgeImage[] = [];
  for (const raw of b.images as { url?: unknown; title?: unknown; thumb?: unknown }[]) {
    if (typeof raw?.url !== "string" || !/^https?:\/\//i.test(raw.url)) return null;
    if (typeof raw.thumb !== "string" || raw.thumb.length > MAX_DATA_URI) return null;
    const m = raw.thumb.match(/^data:(image\/(?:webp|png|jpeg|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return null;
    images.push({ url: raw.url, image: raw.url, title: typeof raw.title === "string" ? raw.title.slice(0, 120) : "", media_type: m[1], data: m[2] });
  }
  return { keyword, images };
}
