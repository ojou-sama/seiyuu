import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

export const GET: RequestHandler = async ({ url }) => {
	const topCount = Number(url.searchParams.get('topCount') ?? '100');

	const apiURL = new URL(`${API_BASE}/top/anime`);
	apiURL.searchParams.set('type', 'tv');
	apiURL.searchParams.set('filter', 'bypopularity');
	apiURL.searchParams.set('page', Math.ceil(topCount / 25).toString());

	const response = await fetch(apiURL.toString());
	if (!response.ok) {
		return json({ error: `Failed to fetch top ${topCount} anime` }, { status: response.status });
	}

	const data = await response.json();
	const results = data.data || [];

	if (results.length === 0) {
		return json({ error: `No anime found in top ${topCount}` }, { status: 404 });
	}

	// select random anime
	const anime = results[Math.floor(Math.random() * results.length)];
	
	// fetch characters
	const charactersRes = await fetch(`${API_BASE}/anime/${anime.mal_id}/characters`);
	const charactersData = await charactersRes.json();
	const characters = charactersData.data || [];

	const result = {
		id: anime.mal_id,
		title: anime.title,
		titles: anime.titles,
		coverImage: getImageUrl(anime.images),
		type: anime.type,
		year: anime.year,
		season: anime.season,
		staff: extractSeiyuu(characters)
	};

	return json(result);
};
