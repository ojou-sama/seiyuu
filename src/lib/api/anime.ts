// client-side api wrapper for anime endpoints

import type { Anime } from '$lib/types/game';

/**
 * search anime by name
 * returns top 10 results ordered by member count
 */
export async function searchAnime(query: string): Promise<Anime[]> {
	const response = await fetch('/api/anime/search', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});

	if (!response.ok) {
		throw new Error(`Search failed: ${response.status}`);
	}

	return response.json();
}

/**
 * fetch anime by id with voice actors
 * fetches anime details and characters, filters to main/supporting japanese voice actors
 */
export async function fetchAnime(id: number | string): Promise<Anime> {
	const response = await fetch(`/api/anime/${id}`);

	if (!response.ok) {
		throw new Error(`Anime ${id} not found`);
	}

	return response.json();
}

/**
 * fetch random anime from top N anime
 */
export async function fetchRandomTopAnime(topCount: number = 100): Promise<Anime> {
	const response = await fetch(`/api/anime/random?topCount=${topCount}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch random anime`);
	}

	return response.json();
}
