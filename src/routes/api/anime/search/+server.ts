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

export const POST: RequestHandler = async ({ request }) => {
	const { query } = await request.json();

	if (!query || typeof query !== 'string') {
		return json({ error: 'Query parameter required' }, { status: 400 });
	}

	const url = new URL(`${API_BASE}/anime`);
	url.searchParams.set('q', query);
	url.searchParams.set('limit', '10');

	const response = await fetch(url.toString());
	if (!response.ok) {
		return json({ error: 'Search failed' }, { status: response.status });
	}

	const data = await response.json();
	const results = data.data || [];

	const filteredResults = results.filter((anime: any) => {
		return anime.type !== 'CM' 
			&& anime.type !== 'PV' 
			&& anime.type !== 'Music' 
			&& anime.status !== 'Not yet aired';
	});

	const animeResults = filteredResults.map((anime: any) => ({
		id: anime.mal_id,
		title: anime.title,
		titles: anime.titles,
		coverImage: getImageUrl(anime.images),
		type: anime.type,
		year: anime.year,
		season: anime.season
	}));

	return json(animeResults);
};
