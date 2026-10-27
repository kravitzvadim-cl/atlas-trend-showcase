import { expect, test } from "vitest";
import { parseKitRequest } from "./kitRequest";

const img = { url: "https://a.com/p", title: "A", thumb: "data:image/webp;base64,AAAA" };

test("a valid refresh request becomes judge-style images", () => {
  const r = parseKitRequest({ keyword: "liquid glass", images: [img] });
  expect(r).toMatchObject({ keyword: "liquid glass", images: [{ url: "https://a.com/p", media_type: "image/webp", data: "AAAA" }] });
});

test("anything that is not a small inline image from a web page is refused", () => {
  expect(parseKitRequest({ keyword: "x y", images: [] })).toBeNull();
  expect(parseKitRequest({ keyword: "x y", images: [{ ...img, thumb: "https://evil.com/a.png" }] })).toBeNull();
  expect(parseKitRequest({ keyword: "x y", images: [{ ...img, url: "javascript:alert(1)" }] })).toBeNull();
  expect(parseKitRequest({ keyword: "x y", images: Array(21).fill(img) })).toBeNull();
  expect(parseKitRequest({ keyword: "x y", images: [{ ...img, thumb: "data:image/webp;base64," + "A".repeat(2_000_000) }] })).toBeNull();
});
