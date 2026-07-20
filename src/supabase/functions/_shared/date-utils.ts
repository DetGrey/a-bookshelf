/**
 * Converts a Date, ISO string, or timestamp into Supabase Postgres compatible ISO string (+00:00 format).
 * E.g., 2026-07-18T12:00:00.000Z -> 2026-07-18T12:00:00+00:00
 */
export function toSupabaseIsoString(value: Date | string | number | null | undefined): string | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().replace(/\.\d{3}Z$/, '+00:00').replace(/Z$/, '+00:00');
  } catch {
    return null;
  }
}
