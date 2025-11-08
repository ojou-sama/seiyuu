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

export type LinkType = 'anime' | 'seiyuu';

export interface GameLink {
	type: LinkType;
	anime?: Anime;
	seiyuu?: Seiyuu;
}

export type GameChain = GameLink[];

export type GameMode = 'daily' | 'freeplay';

export interface GameState {
	mode: GameMode;
	startAnimeId: number;
	targetAnimeId: number;
	chain: GameChain;
	completed: boolean;
	moves: number;
	currentOptions?: Anime[] | Seiyuu[]; // currently fetched options for next step
}

export interface DailyPuzzle {
	number: number;
	date: string;
	startAnimeId: number;
	targetAnimeId: number;
	difficulty?: string;
	estimatedMoves?: number;
}

export interface FreeplayPuzzle {
	startAnimeId: number;
	targetAnimeId: number;
	difficulty: 'easy' | 'medium' | 'hard';
	generatedAt: number;
}
