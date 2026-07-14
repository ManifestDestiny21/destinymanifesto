function sanitizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Strip quotes, BOM/zero-width, and other non-ASCII corruption from paste.
  const cleaned = [...value.trim()]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join("")
    .replace(/^['"]|['"]$/g, "");
  return cleaned || undefined;
}

export function getSupabaseEnv() {
  const url = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error(
      "Missing or invalid Supabase env vars. Re-copy NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from the Supabase dashboard."
    );
  }

  return { url, anonKey };
}
