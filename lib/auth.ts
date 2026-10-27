// Site-wide password (HTTP Basic auth). Only active when SITE_PASSWORD is set; any username works.
export function isAuthorized(header: string | null, password: string | undefined): boolean {
  if (!password) return true;
  if (!header?.startsWith("Basic ")) return false;
  let given: string;
  try {
    given = atob(header.slice(6)).split(":").slice(1).join(":");
  } catch {
    return false;
  }
  // Constant-time compare so the password can't be guessed from response timing.
  const a = new TextEncoder().encode(given), b = new TextEncoder().encode(password);
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i] ?? 0) ^ b[i];
  return diff === 0;
}
