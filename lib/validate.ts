export function validateKeyword(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const k = raw.replace(/\s+/g, " ").trim();
  return k.length >= 2 && k.length <= 60 ? k : null;
}
