const FONTS =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@500;600;700&family=Geist+Mono:wght@500&display=swap";

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export const fileName = (keyword: string) =>
  `atlas-trend-${keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.html`;

// A standalone page: the board's markup, the app's CSS inlined, images already embedded as data URIs.
export function snapshotDocument(keyword: string, css: string, boardHtml: string, date: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(keyword)} · Atlas Trend</title>
<link rel="stylesheet" href="${FONTS}">
<style>${css}</style>
<style>.snapshot-note{max-width:1280px;margin:0 auto;padding:16px 32px 0;font:500 13px system-ui;color:#56607a}</style>
</head><body>
<p class="snapshot-note">Saved from Atlas Trend on ${escape(date)}. Images link to their original sources.</p>
${boardHtml}
</body></html>`;
}

// Browser only: collect the page's own CSS and the board markup, then download it as one file.
export function downloadSnapshot(keyword: string, root: HTMLElement) {
  const css = [...document.styleSheets]
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((r) => r.cssText).join("\n");
      } catch {
        return ""; // cross-origin sheet (fonts): linked instead
      }
    })
    .join("\n");
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-noexport]").forEach((el) => el.remove());
  const html = snapshotDocument(keyword, css, clone.outerHTML, new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }));
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  Object.assign(document.createElement("a"), { href: url, download: fileName(keyword) }).click();
  URL.revokeObjectURL(url);
}
