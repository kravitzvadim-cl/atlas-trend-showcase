import { quantize, type Swatch } from "./color";

// Browser only: re-sample a board's colours from its thumbnails (data URIs, so the canvas is never tainted).
export async function samplePalette(thumbs: string[]): Promise<Swatch[]> {
  const canvas = Object.assign(document.createElement("canvas"), { width: 48, height: 48 });
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const rgb: number[] = [];
  for (const src of thumbs.filter((t) => t.startsWith("data:"))) {
    const img = new Image();
    img.src = src;
    try {
      await img.decode();
    } catch {
      continue;
    }
    ctx.drawImage(img, 0, 0, 48, 48);
    const { data } = ctx.getImageData(0, 0, 48, 48);
    for (let i = 0; i < data.length; i += 4) rgb.push(data[i], data[i + 1], data[i + 2]);
  }
  return quantize(new Uint8Array(rgb), 6);
}
