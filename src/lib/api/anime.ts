// client-side api for anime - calls jikan directly
// todo: replace with backend endpoints when we add a server

import type { Anime } from '$lib/types/game';

const API_BASE = 'https://api.jikan.moe/v4';

function getImageUrl(images: any): string {
	if (!images) return '';
	
	const jpg = images.jpg;
	const webp = images.webp;
	
	if (jpg?.large_image_url) return jpg.large_image_url;
	if (jpg?.image_url) return jpg.image_url;
	if (webp?.large_image_url) return webp.large_image_url;
	if (webp?.image_url) return webp.image_url;
	
	return '';
}

function getPersonName(name: any): string {
	if (!name) return '';
	if (typeof name === 'string') return name;
	return name.name || '';
}

function extractSeiyuu(characters: any[]): any[] {
	const seiyuuMap = new Map<number, any>();

	for (const char of characters) {
		if (char.role !== 'Main' && char.role !== 'Supporting') {
			continue;
		}

		const voiceActors = char.voice_actors || [];
		for (const va of voiceActors) {
			if (va.language === 'Japanese' && va.person) {
				if (!seiyuuMap.has(va.person.mal_id)) {
					seiyuuMap.set(va.person.mal_id, {
						id: va.person.mal_id,
						name: getPersonName(va.person.name),
						image: getImageUrl(va.person.images),
						characterName: char.character?.name || '',
						characterRole: char.role
					});
				}
			}
		}
	}

	return Array.from(seiyuuMap.values());
}

/**
 * search anime by name
 * returns top 10 results ordered by member count
 */
export async function searchAnime(query: string): Promise<Anime[]> {
	const url = new URL(`${API_BASE}/anime`);
	url.searchParams.set('q', query);
	url.searchParams.set('limit', '10');

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`Search failed: ${response.status}`);
	}

	const data = await response.json();
	const results = data.data || [];

	const filteredResults = results.filter((anime: any) => {
		return anime.type !== 'CM' 
			&& anime.type !== 'PV' 
			&& anime.type !== 'Music' 
			&& anime.status !== 'Not yet aired';
	});

	return filteredResults.map((anime: any) => ({
		id: anime.mal_id,
		title: anime.title,
		titles: anime.titles,
		coverImage: getImageUrl(anime.images),
		type: anime.type,
		year: anime.year,
		season: anime.season
	}));
}

/**
 * fetch anime by id with voice actors
 * fetches anime details and characters, filters to main/supporting japanese voice actors
 */
export async function fetchAnime(id: number | string): Promise<Anime> {
	const [animeRes, charactersRes] = await Promise.all([
		fetch(`${API_BASE}/anime/${id}`),
		fetch(`${API_BASE}/anime/${id}/characters`)
	]);

	if (!animeRes.ok || !charactersRes.ok) {
		throw new Error(`Anime ${id} not found`);
	}

	const animeData = await animeRes.json();
	const charactersData = await charactersRes.json();

	const anime = animeData.data;
	const characters = charactersData.data || [];

	if (!anime) {
		throw new Error(`Anime ${id} not found`);
	}

	return {
		id: anime.mal_id,
		title: anime.title,
		titles: anime.titles,
		coverImage: getImageUrl(anime.images),
		type: anime.type,
		year: anime.year,
		season: anime.season,
		staff: extractSeiyuu(characters)
	};
}

/**
 * fetch random anime from top N anime
 */
export async function fetchRandomTopAnime(topCount: number = 100): Promise<Anime> {
	const url = new URL(`${API_BASE}/top/anime`);
	url.searchParams.set('filter', 'bypopularity');
	url.searchParams.set('page', Math.ceil(topCount / 25).toString());

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`Failed to fetch random anime`);
	}

	const data = await response.json();
	const results = data.data || [];

	if (results.length === 0) {
		throw new Error(`No anime found in top ${topCount}`);
	}

	// select random anime
	const anime = results[Math.floor(Math.random() * results.length)];
	
	// fetch characters
	const charactersRes = await fetch(`${API_BASE}/anime/${anime.mal_id}/characters`);
	const charactersData = await charactersRes.json();
	const characters = charactersData.data || [];

	return {
		id: anime.mal_id,
		title: anime.title,
		titles: anime.titles,
		coverImage: getImageUrl(anime.images),
		type: anime.type,
		year: anime.year,
		season: anime.season,
		staff: extractSeiyuu(characters)
	};
}
