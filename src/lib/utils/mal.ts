// myanimelist api client using direct jikan api calls
// docs: https://docs.api.jikan.moe/

import type { Anime, Staff } from '$lib/types/game';

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
 * helper to get person name as string
 * handles both string and object formats
 */
function getPersonName(name: any): string {
	if (!name) return '';
	if (typeof name === 'string') return name;
	return name.name || '';
}

function extractSeiyuu(characters: any[]): Staff[] {
    const seiyuuMap = new Map<number, Staff>();

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

    return Array.from(seiyuuMap.values());
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

	const result: Anime = {
		id: anime.mal_id,
		title: anime.title,
		titles: anime.titles,
		coverImage: getImageUrl(anime.images),
		type: anime.type,
		year: anime.year,
		season: anime.season,
		staff: extractSeiyuu(characters)
	};

	return result;
}

/**
 * fetch seiyuu by id
 * fetches person details
 */
export async function fetchStaff(id: number): Promise<Staff> {
	// fetch person details
	const personRes = await fetch(`${API_BASE}/people/${id}`);

	if (!personRes.ok) {
		throw new Error(`person ${id} not found`);
	}

	const personData = await personRes.json();
	const person = personData.data;

	if (!person) {
		throw new Error(`person ${id} not found`);
	}

	const result: Staff = {
		id: person.mal_id,
		name: getPersonName(person.name),
		image: getImageUrl(person.images),
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
	url.searchParams.set('limit', '10');

	const response = await fetch(url.toString());
	if (!response.ok) {
		return [];
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

/** fetch random anime from top N anime
 */
export async function fetchRandomTopAnime(topCount: number): Promise<Anime> {
    const url = new URL(`${API_BASE}/top/anime`);
    url.searchParams.set('filter', 'bypopularity');
    url.searchParams.set('page', Math.ceil(topCount / 25).toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Failed to fetch top ${topCount} anime`);
    }

    const data = await response.json();
    const results = data.data || [];

    if (results.length === 0) {
        throw new Error(`No anime found in top ${topCount}`);
    }

    // select a random anime from the results
    const anime = results[Math.floor(Math.random() * results.length)];
    const characters = await fetch(`${API_BASE}/anime/${anime.mal_id}/characters`)
        .then(res => res.json())
        .then(data => data.data || []);

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