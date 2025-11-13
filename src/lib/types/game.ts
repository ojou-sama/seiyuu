// core game data types

export interface Anime {
	id: number;
	title: string;
	coverImage: string;
	type?: string;
	year?: number;
	voiceActors?: Seiyuu[];
}

export interface Seiyuu {
	id: number;
	name: string;
	image: string;
	animeRoles?: AnimeRole[];
	characterName?: string; // character they played in previous anime
	characterRole?: 'Main' | 'Supporting'; // role type
}

export interface AnimeRole {
	anime: Anime;
	characterName?: string;
	characterRole?: string;
}