// game data types

export interface GameDetails {
    startTime: number,
    endTime?: number,
    isOver: boolean,
    mode: GameMode,
    rounds: GameRound[],
    overallStaffUsage: Map<number, number>,
    settings: GameSettings // player-configured settings for this game
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

export interface GameSettings {
    maxStaffUsage?: number, // max staff usage allowed (undefined = unlimited)
    timePerTurn?: number // time limit per turn in seconds (undefined = no limit)
}

export interface GameMode {
    name: string,
    description: string,
    defaultSettings: GameSettings, // default/recommended settings for this mode
    startGame: (gameDetails: GameDetails) => TryAddRoundResult | Promise<TryAddRoundResult>, // initialize the game
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