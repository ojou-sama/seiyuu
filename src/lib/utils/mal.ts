// myanimelist api client using direct jikan api calls
// docs: https://docs.api.jikan.moe/

import type { Anime, Seiyuu, AnimeRole } from '$lib/types/game';

// base url for jikan api v4
const API_BASE = 'https://api.jikan.moe/v4';

/**
 * helper to get best image url from jikan image object
 * prefers jpg/webp formats and larger sizes
 */
function getImageUrl(images: any): string {
	if (!images) return '';
	
	// try jpg first, then webp
	const jpg = images.jpg;
	const webp = images.webp;
	
	// prefer larger sizes: maximum > large > medium > small
	if (jpg?.large_image_url) return jpg.large_image_url;
	if (jpg?.image_url) return jpg.image_url;
	if (webp?.large_image_url) return webp.large_image_url;
	if (webp?.image_url) return webp.image_url;
	
	return '';
}

/**
 * helper to get preferred title from jikan title object
 * prefers english title, falls back to default
 */
function getPreferredTitle(titles: any): string {
	if (!titles) return '';
	if (typeof titles === 'string') return titles;
	
	// handle array of title objects
	if (Array.isArray(titles)) {
		const english = titles.find((t: any) => t.type === 'English');
		const defaultTitle = titles.find((t: any) => t.type === 'Default');
		return english?.title || defaultTitle?.title || titles[0]?.title || '';
	}
	
	// handle object format
	return titles.english || titles.default || '';
}

/**
 * helper to get person name as string
 * handles both string and object formats
 */
function getPersonName(name: any): string {
	if (!name) return '';
	if (typeof name === 'string') return name;
	return name.name || '';
}

/**
 * fetch anime by id with voice actors
 * fetches anime details and characters, filters to main/supporting japanese voice actors
 */
export async function fetchAnime(id: number): Promise<Anime> {
	// fetch anime and characters
	const [animeRes, charactersRes] = await Promise.all([
		fetch(`${API_BASE}/anime/${id}`),
		fetch(`${API_BASE}/anime/${id}/characters`)
	]);

	if (!animeRes.ok || !charactersRes.ok) {
		throw new Error(`anime ${id} not found`);
	}

	const animeData = await animeRes.json();
	const charactersData = await charactersRes.json();

	const anime = animeData.data;
	const characters = charactersData.data || [];

	if (!anime) {
		throw new Error(`anime ${id} not found`);
	}

	const seiyuuMap = new Map<number, Seiyuu>();

	// collect japanese voice actors from main and supporting characters only
	for (const char of characters) {
		// only include main and supporting roles
		if (char.role !== 'Main' && char.role !== 'Supporting') {
			continue;
		}

		// get japanese voice actors
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

	const result: Anime = {
		id: anime.mal_id,
		title: getPreferredTitle(anime.titles),
		coverImage: getImageUrl(anime.images),
		type: anime.type,
		year: anime.year ?? undefined,
		voiceActors: Array.from(seiyuuMap.values())
	};

	return result;
}

/**
 * fetch seiyuu by id with anime roles
 * fetches person details and voice roles, filters to main/supporting roles
 */
export async function fetchSeiyuu(id: number): Promise<Seiyuu> {
	// fetch person and voice actor roles
	const [personRes, voiceRolesRes] = await Promise.all([
		fetch(`${API_BASE}/people/${id}`),
		fetch(`${API_BASE}/people/${id}/voices`)
	]);

	if (!personRes.ok || !voiceRolesRes.ok) {
		throw new Error(`person ${id} not found`);
	}

	const personData = await personRes.json();
	const voiceRolesData = await voiceRolesRes.json();

	const person = personData.data;
	const voiceRoles = voiceRolesData.data || [];

	if (!person) {
		throw new Error(`person ${id} not found`);
	}

	const animeMap = new Map<number, AnimeRole>();

	// collect anime from voice roles (main and supporting only)
	for (const role of voiceRoles) {
		// only include main and supporting roles
		if (role.role !== 'Main' && role.role !== 'Supporting') {
			continue;
		}

		if (role.anime && !animeMap.has(role.anime.mal_id)) {
			animeMap.set(role.anime.mal_id, {
				anime: {
					id: role.anime.mal_id,
					title: getPreferredTitle(role.anime.titles),
					coverImage: getImageUrl(role.anime.images),
					type: undefined,
					year: undefined
				},
				characterName: role.character?.name || '',
				characterRole: role.role
			});
		}
	}

	const result: Seiyuu = {
		id: person.mal_id,
		name: getPersonName(person.name),
		image: getImageUrl(person.images),
		animeRoles: Array.from(animeMap.values())
	};

	return result;
}

/**
 * search anime by name
 * returns top 10 results ordered by member count
 */
export async function searchAnime(search: string): Promise<Anime[]> {
	const url = new URL(`${API_BASE}/anime`);
	url.searchParams.set('q', search);
	url.searchParams.set('order_by', 'members');
	url.searchParams.set('sort', 'desc');
	url.searchParams.set('limit', '10');

	const response = await fetch(url.toString());
	if (!response.ok) {
		return [];
	}

	const data = await response.json();
	const results = data.data || [];

	return results.map((anime: any) => ({
		id: anime.mal_id,
		title: getPreferredTitle(anime.titles),
		coverImage: getImageUrl(anime.images),
		type: anime.type,
		year: anime.year ?? undefined
	}));
}

/**
 * search people by name
 * returns top 10 results ordered by favorites
 */
export async function searchStaff(search: string): Promise<Seiyuu[]> {
	const url = new URL(`${API_BASE}/people`);
	url.searchParams.set('q', search);
	url.searchParams.set('order_by', 'favorites');
	url.searchParams.set('sort', 'desc');
	url.searchParams.set('limit', '10');

	const response = await fetch(url.toString());
	if (!response.ok) {
		return [];
	}

	const data = await response.json();
	const results = data.data || [];

	return results.map((person: any) => ({
		id: person.mal_id,
		name: getPersonName(person.name),
		image: getImageUrl(person.images)
	}));
}
