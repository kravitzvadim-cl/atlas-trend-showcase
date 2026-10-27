import sharp from "sharp";
import { expect, test } from "vitest";
import { analyse } from "./analyse";

const solid = async (hex: string, w = 300, h = 200) =>
  (await sharp({ create: { width: w, height: h, channels: 3, background: hex } }).png().toBuffer()).toString("base64");

test("samples real colours from kept images and makes small thumbnails", async () => {
  const images = [
    { image: "https://a.com/1.png", media_type: "image/png", data: await solid("#0e1530") },
    { image: "https://a.com/2.png", media_type: "image/png", data: await solid("#7fb2ff") },
    { image: "https://a.com/3.png", media_type: "image/png", data: await solid("#0e1530") },
  ];
  const r = await analyse(images);
  expect(r.palette.map((p) => p.hex)).toEqual(["#0E1530", "#7FB2FF"]);
  expect(Math.round(r.palette[0].share * 100)).toBe(67);
  expect(r.thumbs["https://a.com/1.png"]).toMatch(/^data:image\/webp;base64,/);
});

test("an image that cannot be decoded is skipped, not fatal", async () => {
  const r = await analyse([
    { image: "https://a.com/bad.png", media_type: "image/png", data: Buffer.from("not an image").toString("base64") },
    { image: "https://a.com/ok.png", media_type: "image/png", data: await solid("#ffd8ec") },
  ]);
  expect(r.palette.map((p) => p.hex)).toEqual(["#FFD8EC"]);
  expect(Object.keys(r.thumbs)).toEqual(["https://a.com/ok.png"]);
});
