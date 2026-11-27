/**
 * Only allow same-site relative paths like "/dashboard". Rejects absolute URLs,
 * protocol-relative "//evil.com", backslash tricks, and "@host" / ".host" suffixes
 * that would otherwise turn `${origin}${next}` into an off-site redirect.
 */
export function safeRedirectPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  if (/[\\\u0000-\u001f]/.test(next)) return null;
  try {
    const base = "https://placeholder.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
