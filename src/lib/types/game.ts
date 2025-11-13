// game data types

export interface GameDetails {
    startTime: number;
    endTime?: number;
    isOver: boolean;
    mode: GameMode;
    rounds: GameRound[];
    staffUsage: {
        staff: Seiyuu[];
        usageCount: number;
    }[]
}

export interface GameRound {
    number: number,
    anime: Anime,
    staffLinks: {
        staff: Seiyuu[];
        usageCount: number;
    }[]
}

// game mode types

export interface GameMode {
    name: string;
    description: string;
    validateLink: (gameDetails: GameDetails, newAnime: Anime) => boolean;
    isVictory: (gameDetails: GameDetails) => boolean;
    ui?: Record<string, unknown>;
}

export type ModeRegistry = {
    [key: string]: GameMode;
};

// anime-related data types

export interface Anime {
	id: number;
	title: string;
	coverImage: string;
	type?: string;
    season?: string;
	year?: number;
	staff?: Seiyuu[];
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