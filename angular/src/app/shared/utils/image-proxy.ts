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

export function isProxiedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  return (
    lower.includes('workers.dev') ||
    lower.includes('supabase') ||
    lower.includes('storage') ||
    lower.includes('r2')
  );
}

export async function deleteProxiedCover(
  rawUrl: string | null | undefined,
  baseUrl?: string
): Promise<boolean> {
  if (!rawUrl || !isProxiedUrl(rawUrl)) {
    return false;
  }

  const endpoint = `${(baseUrl || 'https://bookshelf-image-proxy.anenovlar.workers.dev').replace(/\/+$/, '')}/delete`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: rawUrl }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete proxied cover:', error);
    return false;
  }
}
