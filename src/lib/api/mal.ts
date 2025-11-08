// myanimelist api client using jikan4.js

import Jikan from 'jikan4.js';
import type { Anime, Seiyuu, AnimeRole } from '$lib/types/game';
import { getCache, setCache } from '$lib/cache';

// create jikan client instance
const client = new Jikan.Client();

// helper to get best image url
function getImageUrl(images: any): string {
	return images?.getOrFallback(
        ["jpg", "webp"], 
        ["default", "medium", "large", "maximum"]
    )?.href ?? '';
}

// helper to get preferred title
function getPreferredTitle(title: any): string {
	return title?.english || title?.default || '';
}

// helper to get person name as string
function getPersonName(name: any): string {
	if (typeof name === 'string') return name;
	return name?.name || '';
}

// fetch anime by id with voice actors
export async function fetchAnime(id: number): Promise<Anime> {
	// check cache first
	const cached = getCache<Anime>('anime', id);
	if (cached) {
		return cached;
	}

	// fetch anime and characters
	const [anime, characters] = await Promise.all([
		client.anime.get(id),
		client.anime.getCharacters(id)
	]);

	if (!anime || !characters) {
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
		for (const va of char.voiceActors) {
			if (va.language === 'Japanese' && va.person) {
				if (!seiyuuMap.has(va.person.id)) {
					seiyuuMap.set(va.person.id, {
						id: va.person.id,
						name: getPersonName(va.person.name),
						image: getImageUrl(va.person.image),
						characterName: char.character.name,
						characterRole: char.role
					});
				}
			}
		}
	}

	const result: Anime = {
		id: anime.id,
		title: getPreferredTitle(anime.title),
		coverImage: getImageUrl(anime.image),
		type: anime.type,
		year: anime.year ?? undefined,
		voiceActors: Array.from(seiyuuMap.values())
	};

	// cache result
	setCache('anime', id, result);

	return result;
}

// fetch seiyuu by id with anime roles
export async function fetchSeiyuu(id: number): Promise<Seiyuu> {
	// check cache first
	const cached = getCache<Seiyuu>('seiyuu', id);
	if (cached) {
		return cached;
	}

	// fetch person and voice actor roles
	const [person, voiceRoles] = await Promise.all([
		client.people.get(id),
		client.people.getVoiceActors(id)
	]);

	if (!person || !voiceRoles) {
		throw new Error(`person ${id} not found`);
	}

	const animeMap = new Map<number, AnimeRole>();

	// collect anime from voice roles (main and supporting only)
	for (const role of voiceRoles) {
		// only include main and supporting roles
		if (role.role !== 'Main' && role.role !== 'Supporting') {
			continue;
		}

		if (role.anime && !animeMap.has(role.anime.id)) {
			animeMap.set(role.anime.id, {
				anime: {
					id: role.anime.id,
					title: getPreferredTitle(role.anime.title),
					coverImage: getImageUrl(role.anime.image),
					type: undefined,
					year: undefined
				},
				characterName: role.character.name,
				characterRole: role.role
			});
		}
	}

	const result: Seiyuu = {
		id: person.id,
		name: getPersonName(person.name),
		image: getImageUrl(person.image),
		animeRoles: Array.from(animeMap.values())
	};

	// cache result
	setCache('seiyuu', id, result);

	return result;
}

// search anime by name
export async function searchAnime(search: string): Promise<Anime[]> {
	const results = await client.anime.search(search, { 
		orderBy: 'members',
		sort: 'desc'
	}, 0, 10);

	return results.map(anime => ({
		id: anime.id,
		title: getPreferredTitle(anime.title),
		coverImage: getImageUrl(anime.image),
		type: anime.type,
		year: anime.year ?? undefined
	}));
}

// search people by name
export async function searchStaff(search: string): Promise<Seiyuu[]> {
	const results = await client.people.search(search, {
		orderBy: 'favorites',
		sort: 'desc'
	}, 0, 10);

	return results.map((person) => ({
		id: person.id,
		name: getPersonName(person.name),
		image: getImageUrl(person.image)
	}));
}
