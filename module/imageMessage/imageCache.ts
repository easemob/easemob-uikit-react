// 图片 Blob URL 缓存，避免切换会话时重复请求
const cache = new Map<string, string>();
const MAX_CACHE_SIZE = 200;

/**
 * 获取图片的缓存 blob URL，如果未缓存则通过 fetch 获取并缓存
 */
export function getCachedImageUrl(url: string): string | undefined {
  return cache.get(url);
}

export async function fetchAndCacheImage(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  // LRU-like eviction: 超过上限时删除最早的条目
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value!;
    URL.revokeObjectURL(cache.get(firstKey)!);
    cache.delete(firstKey);
  }

  cache.set(url, blobUrl);
  return blobUrl;
}
