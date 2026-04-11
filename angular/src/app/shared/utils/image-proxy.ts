export function buildCloudflareImageProxyUrl(rawUrl: string | null): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  return `/cdn-cgi/image/format=auto,quality=85/${encodeURIComponent(trimmed)}`;
}
