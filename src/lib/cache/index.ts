// client-side caching utilities for anime and seiyuu data

const CACHE_VERSION = 1;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const MAX_CACHE_ENTRIES = 100;

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	version: number;
}

type CacheType = 'anime' | 'seiyuu';

// check if we're in browser (not ssr)
function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// get cache key with prefix
function getCacheKey(type: CacheType, id: number): string {
	return `cache:${type}:${id}`;
}

// check if cache entry is expired
function isExpired(entry: CacheEntry<unknown>): boolean {
	const now = Date.now();
	const age = now - entry.timestamp;
	return age > CACHE_TTL || entry.version !== CACHE_VERSION;
}

// get item from cache
export function getCache<T>(type: CacheType, id: number): T | null {
	if (!isBrowser()) return null;
	
	try {
		const key = getCacheKey(type, id);
		const raw = localStorage.getItem(key);
		
		if (!raw) return null;

		const entry: CacheEntry<T> = JSON.parse(raw);
		
		if (isExpired(entry)) {
			localStorage.removeItem(key);
			return null;
		}

		return entry.data;
	} catch (error) {
		console.error('cache read error:', error);
		return null;
	}
}

// save item to cache
export function setCache<T>(type: CacheType, id: number, data: T): void {
	if (!isBrowser()) return;
	
	try {
		// check cache size and evict oldest if needed
		evictIfNeeded(type);

		const key = getCacheKey(type, id);
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			version: CACHE_VERSION
		};

		localStorage.setItem(key, JSON.stringify(entry));
	} catch (error) {
		console.error('cache write error:', error);
		// if quota exceeded, try to clear old entries
		if (error instanceof Error && error.name === 'QuotaExceededError') {
			clearOldEntries(type);
		}
	}
}

// evict oldest entries if cache is too large
function evictIfNeeded(type: CacheType): void {
	const entries = getCacheEntries(type);
	
	if (entries.length >= MAX_CACHE_ENTRIES) {
		// sort by timestamp (oldest first)
		entries.sort((a, b) => a.timestamp - b.timestamp);
		
		// remove oldest entry
		const oldest = entries[0];
		if (oldest) {
			localStorage.removeItem(oldest.key);
		}
	}
}

// get all cache entries for a type
function getCacheEntries(type: CacheType): Array<{ key: string; timestamp: number }> {
	if (!isBrowser()) return [];
	
	const prefix = `cache:${type}:`;
	const entries: Array<{ key: string; timestamp: number }> = [];

	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(prefix)) {
				const raw = localStorage.getItem(key);
				if (raw) {
					const entry: CacheEntry<unknown> = JSON.parse(raw);
					entries.push({ key, timestamp: entry.timestamp });
				}
			}
		}
	} catch (error) {
		console.error('error reading cache entries:', error);
	}

	return entries;
}

// clear old/expired entries
function clearOldEntries(type: CacheType): void {
	const entries = getCacheEntries(type);
	
	entries.forEach(({ key, timestamp }) => {
		const age = Date.now() - timestamp;
		if (age > CACHE_TTL) {
			localStorage.removeItem(key);
		}
	});
}

// clear all cache for a type
export function clearCache(type?: CacheType): void {
	if (!isBrowser()) return;
	
	try {
		if (type) {
			const prefix = `cache:${type}:`;
			const keysToRemove: string[] = [];

			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith(prefix)) {
					keysToRemove.push(key);
				}
			}

			keysToRemove.forEach(key => localStorage.removeItem(key));
		} else {
			// clear all cache types
			clearCache('anime');
			clearCache('seiyuu');
		}
	} catch (error) {
		console.error('cache clear error:', error);
	}
}

// get cache stats
export function getCacheStats(): { anime: number; seiyuu: number; total: number } {
	const animeEntries = getCacheEntries('anime');
	const seiyuuEntries = getCacheEntries('seiyuu');
	
	return {
		anime: animeEntries.length,
		seiyuu: seiyuuEntries.length,
		total: animeEntries.length + seiyuuEntries.length
	};
}
