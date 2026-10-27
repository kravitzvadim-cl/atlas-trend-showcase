const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

class Blocked extends Error {}

const MIN_IMAGE_BYTES = 2 * 1024; // smaller files are pixels, spacers and icons

export type PageImage = { image: string; media_type: string; data: string };
export type PageImages = { ok: true; images: PageImage[] } | { ok: false; reason: string };

const SKIP = /\.svg(\?|#|$)|logo|icon|avatar|favicon|sprite|badge|emoji|pixel|spacer|placeholder/i;

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];

// The page's share image first, then the images shown on the page (a gallery's actual examples).
export function extractImages(html: string, pageUrl: string, max = 4): string[] {
  const found: string[] = [];
  const add = (raw?: string) => {
    if (!raw || raw.startsWith("data:") || SKIP.test(raw)) return;
    try {
      const href = new URL(raw.replace(/&amp;/g, "&"), pageUrl).href;
      if (!found.includes(href)) found.push(href);
    } catch {}
  };
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const key of ["og:image", "og:image:url", "twitter:image"]) {
    const tag = metas.find((t) => (attr(t, "property") ?? attr(t, "name"))?.toLowerCase() === key);
    if (tag) {
      add(attr(tag, "content"));
      break;
    }
  }
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const w = Number(attr(tag, "width")), h = Number(attr(tag, "height"));
    if ((w && w < 200) || (h && h < 120)) continue;
    const srcset = attr(tag, "srcset") ?? attr(tag, "data-srcset");
    const largest = srcset?.split(",").map((c) => c.trim().split(/\s+/)[0]).at(-1);
    add(largest ?? attr(tag, "data-src") ?? attr(tag, "src"));
  }
  return found.slice(0, max);
}

// URLs come from the open web, so never let them point the server at itself or a private network.
// ponytail: literal-hostname check only; DNS-rebinding needs a resolving check if this ever runs somewhere sensitive.
function isPublicHttp(u: string): boolean {
  try {
    const { protocol, hostname } = new URL(u);
    if (protocol !== "http:" && protocol !== "https:") return false;
    return !/^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i.test(hostname);
  } catch {
    return false;
  }
}

// Follow redirects by hand so every hop is checked, not just the first URL.
async function safeFetch(url: string, fetchFn: typeof fetch, timeoutMs: number): Promise<{ res: Response; finalUrl: string }> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isPublicHttp(current)) throw new Blocked();
    const res = await fetchFn(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "AtlasTrendBot/0.1 (design research)" },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).href;
      continue;
    }
    return { res, finalUrl: current };
  }
  throw new Error("too many redirects");
}

async function readCapped(res: Response, max: number): Promise<Uint8Array | null> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

// Websites often mislabel images; the model provider checks the real bytes and rejects a mismatch.
function sniffType(b: Uint8Array): string | null {
  const hex = Buffer.from(b.subarray(0, 12)).toString("hex");
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("47494638")) return "image/gif";
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return "image/webp";
  return null;
}

async function fetchImage(url: string, fetchFn: typeof fetch, timeoutMs: number): Promise<PageImage | null> {
  const { res, finalUrl } = await safeFetch(url, fetchFn, timeoutMs);
  const header = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!res.ok || !header.startsWith("image/")) return null;
  const bytes = await readCapped(res, MAX_IMAGE_BYTES);
  if (!bytes || bytes.length < MIN_IMAGE_BYTES) return null;
  const type = sniffType(bytes);
  if (!type) return null;
  return { image: finalUrl, media_type: type, data: Buffer.from(bytes).toString("base64") };
}

export async function fetchPageImages(url: string, fetchFn: typeof fetch = fetch, timeoutMs = 6000, perPage = 4): Promise<PageImages> {
  try {
    const page = await safeFetch(url, fetchFn, timeoutMs);
    if (!page.res.ok) return { ok: false, reason: "page unavailable" };
    const html = await readCapped(page.res, MAX_HTML_BYTES);
    if (!html) return { ok: false, reason: "page too large" };
    const candidates = extractImages(new TextDecoder().decode(html), page.finalUrl, perPage);
    if (candidates.length === 0) return { ok: false, reason: "no images found" };
    const images = (await Promise.all(candidates.map((c) => fetchImage(c, fetchFn, timeoutMs).catch(() => null)))).filter((i) => i !== null);
    return images.length ? { ok: true, images } : { ok: false, reason: "image unavailable" };
  } catch (err) {
    if (err instanceof Blocked) return { ok: false, reason: "blocked address" };
    return { ok: false, reason: "site too slow or unreachable" };
  }
}
