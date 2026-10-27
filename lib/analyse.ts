import sharp from "sharp";
import { quantize, type Swatch } from "./color";

type Img = { image: string; media_type: string; data: string };

// Free, local image work after judging: true colours from the pixels, and small thumbnails
// so the board shows exactly what was judged (no hotlinking to third-party sites).
export async function analyse(images: Img[]): Promise<{ palette: Swatch[]; thumbs: Record<string, string> }> {
  const pixels: Buffer[] = [];
  const thumbs: Record<string, string> = {};
  for (const img of images) {
    try {
      const buf = Buffer.from(img.data, "base64");
      pixels.push(await sharp(buf).resize(48, 48, { fit: "cover" }).removeAlpha().toColourspace("srgb").raw().toBuffer());
      const thumb = await sharp(buf).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
      thumbs[img.image] = `data:image/webp;base64,${thumb.toString("base64")}`;
    } catch {
      // unreadable image: leave it out of the colours and the board
    }
  }
  return { palette: quantize(new Uint8Array(Buffer.concat(pixels)), 6), thumbs };
}
