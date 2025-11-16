// game data types

export interface GameSession {
    mode: GameMode,
    settings: GameSettings,
    details: GameDetails
}

export interface GameSettings {
    maxStaffUsage?: number, // max staff usage allowed (undefined = unlimited)
    timePerTurn?: number // time limit per turn in seconds (undefined = no limit)
}

export interface GameDetails {
    startTime: number,
    endTime?: number,
    isOver: boolean,
    rounds: GameRound[],
    overallStaffUsage: Map<number, number>,
}

export interface GameRound {
    number: number,
    anime: Anime,
    staffUsed: Staff[],
    roundStaffUsage: Map<number, number>,
    timestamp: number // when this round was added
}

// game mode types

export type TryAddRoundResult = 
    | { success: true; round: GameRound }
    | { success: false; error: string };

export interface GameMode {
    name: string,
    description: string,
    defaultSettings: GameSettings,
    startGame: (gameDetails: GameDetails, settings?: GameSettings) => TryAddRoundResult | Promise<TryAddRoundResult>, // initialize the game
    tryAddRound: (gameDetails: GameDetails, newAnime: Anime, settings?: GameSettings) => TryAddRoundResult,
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
	titles: Title[],
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

export interface Title {
    type: string,
    title: string,
}