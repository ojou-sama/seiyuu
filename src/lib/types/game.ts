// game data types

export interface GameDetails {
    startTime: number,
    endTime?: number,
    isOver: boolean,
    mode: GameMode,
    rounds: GameRound[],
    overallStaffUsage: Map<number, number>
}

export interface GameRound {
    number: number,
    anime: Anime,
    staffUsed: Staff[],
    roundStaffUsage: Map<number, number>
}

// game mode types

export type TryAddRoundResult = 
    | { success: true; round: GameRound }
    | { success: false; error: string };

export interface GameMode {
    name: string,
    description: string,
    tryAddRound: (gameDetails: GameDetails, newAnime: Anime) => TryAddRoundResult,
    isGameOver: (gameDetails: GameDetails) => boolean,
    ui?: Record<string, unknown>,
}

export type ModeRegistry = {
    [key: string]: GameMode,
}

// anime-related data types

export interface Anime {
	id: number,
	title: string,
	coverImage: string,
	type: string,
    season: string,
	year: number,
	staff?: Staff[],
}

export interface Staff {
	id: number,
	name: string,
	image: string,
	characterName?: string, // character they played in previous anime
	characterRole?: 'Main' | 'Supporting', // role type
}