function sanitizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  if ([...trimmed].some((char) => char.charCodeAt(0) > 255)) {
    return undefined;
  }
  return trimmed;
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
