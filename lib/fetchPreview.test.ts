import { expect, test } from "vitest";
import { extractImages, fetchPageImages as fetchPreview } from "./fetchPreview";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(4096).fill(0)]);
const res = (body: string | Uint8Array, type: string) => new Response(body as BodyInit, { headers: { "content-type": type } });

test("resolves a relative og:image against the page", () => {
  expect(extractImages('<meta property="og:image" content="/a.png">', "https://x.com/p/q")).toEqual(["https://x.com/a.png"]);
});

test("falls back to twitter:image, attribute order agnostic", () => {
  expect(extractImages('<meta content="https://cdn.x/b.jpg" name="twitter:image">', "https://x.com")).toEqual(["https://cdn.x/b.jpg"]);
});

test("returns nothing when the page has no images", () => {
  expect(extractImages("<title>hi</title>", "https://x.com")).toEqual([]);
});

test("collects the gallery images inside a page, skipping logos, icons, svg and tiny images", () => {
  const html = `
    <meta property="og:image" content="/og.png">
    <img src="/logo.png"><img src="/icons/star.png"><img src="/a.svg">
    <img src="/tiny.jpg" width="40" height="40">
    <img data-src="/shots/one.jpg" width="800">
    <img srcset="/shots/two-400.jpg 400w, /shots/two-1600.jpg 1600w">
    <img src="/shots/one.jpg">
    <img src="/shots/three.webp"><img src="/shots/four.png">`;
  expect(extractImages(html, "https://g.com/x", 4)).toEqual([
    "https://g.com/og.png", "https://g.com/shots/one.jpg", "https://g.com/shots/two-1600.jpg", "https://g.com/shots/three.webp",
  ]);
});

test("an image URL that is not an image is unavailable", async () => {
  const fake = async (u: string | URL | Request) =>
    String(u).endsWith("/p") ? res('<meta property="og:image" content="/i.png">', "text/html") : res("<html>", "text/html");
  expect(await fetchPreview("https://x.com/p", fake as typeof fetch)).toEqual({ ok: false, reason: "image unavailable" });
});

test("a page with no preview image says so", async () => {
  const fake = async () => res("<title>x</title>", "text/html");
  expect(await fetchPreview("https://x.com/p", fake as typeof fetch)).toEqual({ ok: false, reason: "no images found" });
});

test("a site that never answers times out instead of hanging", async () => {
  const hang = (_u: unknown, init?: RequestInit) =>
    new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
  expect(await fetchPreview("https://slow.x", hang as typeof fetch, 50)).toEqual({ ok: false, reason: "site too slow or unreachable" });
});

test("returns base64 data for a real image", async () => {
  const fake = async (u: string | URL | Request) =>
    String(u).endsWith("/p") ? res('<meta property="og:image" content="/i.png">', "text/html") : res(PNG, "image/png");
  const r = await fetchPreview("https://x.com/p", fake as typeof fetch);
  expect(r.ok && r.images.map((i) => [i.image, i.media_type])).toEqual([["https://x.com/i.png", "image/png"]]);
});

test("a redirect to a private address is blocked", async () => {
  const fake = async (u: string | URL | Request) =>
    String(u) === "https://x.com/p" ? new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } }) : res("secret", "text/html");
  expect(await fetchPreview("https://x.com/p", fake as typeof fetch)).toEqual({ ok: false, reason: "blocked address" });
});

test("a normal redirect to a public page is followed", async () => {
  const fake = async (u: string | URL | Request) => {
    const url = String(u);
    if (url === "https://x.com/old") return new Response(null, { status: 301, headers: { location: "/new" } });
    if (url === "https://x.com/new") return res('<meta property="og:image" content="/i.png">', "text/html");
    return res(PNG, "image/png");
  };
  const r = await fetchPreview("https://x.com/old", fake as typeof fetch);
  expect(r.ok && r.images[0].image).toBe("https://x.com/i.png");
});

test("javascript: and other non-web URLs are refused", async () => {
  expect(await fetchPreview("javascript:alert(1)", (async () => res("", "text/html")) as unknown as typeof fetch)).toEqual({ ok: false, reason: "blocked address" });
});

test("tracking pixels and other tiny files are not treated as examples", async () => {
  const fake = async (u: string | URL | Request) =>
    String(u).endsWith("/p") ? res('<img src="/shot.gif">', "text/html") : res(new Uint8Array(43), "image/gif");
  expect(await fetchPreview("https://x.com/p", fake as typeof fetch)).toEqual({ ok: false, reason: "image unavailable" });
});


test("the real file format wins over a wrong content-type header", async () => {
  const fake = async (u: string | URL | Request) =>
    String(u).endsWith("/p") ? res('<img src="/shot.webp">', "text/html") : res(PNG, "image/webp");
  const r = await fetchPreview("https://x.com/p", fake as typeof fetch);
  expect(r.ok && r.images[0].media_type).toBe("image/png");
});

test("a file that is not a supported image format is dropped even if labelled as one", async () => {
  const fake = async (u: string | URL | Request) =>
    String(u).endsWith("/p") ? res('<img src="/shot.png">', "text/html") : res(new Uint8Array(4096).fill(7), "image/png");
  expect(await fetchPreview("https://x.com/p", fake as typeof fetch)).toEqual({ ok: false, reason: "image unavailable" });
});
