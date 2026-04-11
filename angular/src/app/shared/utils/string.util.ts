export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function truncateText(text: string | null | undefined, maxWords = 15): string {
  const normalized = (text ?? '').trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return normalized;
  }
  return `${words.slice(0, maxWords).join(' ')}…`;
}