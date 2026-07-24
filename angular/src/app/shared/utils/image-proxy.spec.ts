import { buildCloudflareImageProxyUrl, isProxiedUrl, deleteProxiedCover } from './image-proxy';

describe('image-proxy utils', () => {
  describe('buildCloudflareImageProxyUrl', () => {
    it('returns null for null or empty url', () => {
      expect(buildCloudflareImageProxyUrl(null)).toBeNull();
      expect(buildCloudflareImageProxyUrl('')).toBeNull();
      expect(buildCloudflareImageProxyUrl('   ')).toBeNull();
    });

    it('returns encoded proxy url for valid raw url', () => {
      expect(buildCloudflareImageProxyUrl('https://example.com/cover.jpg')).toBe(
        '/cdn-cgi/image/format=auto,quality=85/https%3A%2F%2Fexample.com%2Fcover.jpg'
      );
    });
  });

  describe('isProxiedUrl', () => {
    it('returns false for null, empty or non-proxied urls', () => {
      expect(isProxiedUrl(null)).toBe(false);
      expect(isProxiedUrl('')).toBe(false);
      expect(isProxiedUrl('https://example.com/cover.jpg')).toBe(false);
    });

    it('returns true for proxied domain patterns', () => {
      expect(isProxiedUrl('https://bookshelf-image-proxy.workers.dev/covers/123.webp')).toBe(true);
      expect(isProxiedUrl('https://mybucket.r2.cloudflarestorage.com/covers/123.webp')).toBe(true);
      expect(isProxiedUrl('https://xyz.supabase.co/storage/v1/object/public/covers/123.webp')).toBe(true);
    });
  });

  describe('deleteProxiedCover', () => {
    beforeEach(() => {
      globalThis.fetch = jest.fn();
    });

    it('returns false without calling fetch if url is not proxied', async () => {
      const result = await deleteProxiedCover('https://example.com/cover.jpg');
      expect(result).toBe(false);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('sends POST /delete request for proxied urls', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const proxiedUrl = 'https://bookshelf-image-proxy.workers.dev/covers/123.webp';
      const result = await deleteProxiedCover(proxiedUrl, 'https://bookshelf-image-proxy.workers.dev');

      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://bookshelf-image-proxy.workers.dev/delete',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: proxiedUrl }),
        }
      );
    });

    it('returns false on fetch error', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const proxiedUrl = 'https://bookshelf-image-proxy.workers.dev/covers/123.webp';
      const result = await deleteProxiedCover(proxiedUrl);

      expect(result).toBe(false);
    });
  });
});
