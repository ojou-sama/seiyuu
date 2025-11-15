import type { Anime, GameDetails, GameMode, GameRound, Staff, TryAddRoundResult } from '$lib/types/game';
import { fetchRandomTopAnime } from '$lib/utils/mal';

const NAME = 'Genre Hunt';
const DESCRIPTION = 'Play five anime of a given genre.';
const MAX_STAFF_USAGE = 3;
const TIME_PER_TURN = 30;

function getValidOverlappingStaff(
    lastAnime: Anime,
    newAnime: Anime,
    staffUsage: Map<number, number>,
    maxStaffUsage: number,
): Staff[] {
    if (!lastAnime.staff || !newAnime.staff) return [];
    
    const lastAnimeStaffIds = new Set(lastAnime.staff.map(s => s.id));
    
    return newAnime.staff.filter(s => {
        // Must be in both anime
        if (!lastAnimeStaffIds.has(s.id)) return false;
        // Must not have been used 3 or more times
        const usageCount = staffUsage.get(s.id) ?? 0;
        return usageCount < maxStaffUsage;
    });
}

function updateStaffUsage(
    staffUsed: Staff[],
    currentUsage: Map<number, number>
): { overall: Map<number, number>; round: Map<number, number> } {
    const overall = new Map(currentUsage);
    const round = new Map<number, number>();
    
    for (const staff of staffUsed) {
        const newCount = (overall.get(staff.id) ?? 0) + 1;
        overall.set(staff.id, newCount);
        round.set(staff.id, newCount);
    }
    
    return { overall, round };
}

function createRound(
    roundNumber: number,
    anime: Anime,
    staffUsed: Staff[],
    roundStaffUsage: Map<number, number>
): GameRound {
    return {
        number: roundNumber,
        anime,
        staffUsed,
        roundStaffUsage,
        timestamp: Date.now()
    };
}

const tryAddRound = (details: GameDetails, newAnime: Anime): TryAddRoundResult => {
    // Reject if anime already played
    if (details.rounds.some(round => round.anime.id === newAnime.id)) {
        return { success: false, error: `"${newAnime.title}" has already been played!` };
    }
    
    const lastRound = details.rounds[details.rounds.length - 1];
    const roundNumber = details.rounds.length + 1;
    
    // First round: no validation needed
    if (!lastRound) {
        const newRound = createRound(roundNumber, newAnime, [], new Map());
        details.rounds = [...details.rounds, newRound];
        return { success: true, round: newRound };
    }
    
    const lastAnime = lastRound.anime;

    // Check if staff information is available
    if (!lastAnime.staff || !newAnime.staff) {
        return { success: false, error: `"${newAnime.title}" cannot be linked - no staff information available.` };
    }
    
    // Check for overlapping staff
    const lastAnimeStaffIds = new Set(lastAnime.staff.map(s => s.id));
    const allOverlapping = newAnime.staff.filter(s => lastAnimeStaffIds.has(s.id));
    
    if (allOverlapping.length === 0) {
        return { success: false, error: `"${newAnime.title}" cannot be linked - no shared voice actors with "${lastAnime.title}".` };
    }
    
    // Check if any overlapping staff have been used 3+ times
    const overusedStaff = allOverlapping.filter(s => {
        const usageCount = details.overallStaffUsage.get(s.id) ?? 0;
        return usageCount >= (details.settings.maxStaffUsage ?? 0);
    });
    
    if (overusedStaff.length > 0) {
        const staffNames = overusedStaff.map(s => s.name).join(', ');
        return { 
            success: false, 
            error: `"${newAnime.title}" cannot be linked - the following voice actors have been used 3 or more times: ${staffNames}.` 
        };
    }
    
    // Subsequent rounds: must have valid overlapping staff
    const staffUsed = getValidOverlappingStaff(
        lastAnime,
        newAnime,
        details.overallStaffUsage,
        details.settings.maxStaffUsage ?? 0
    );
    
    if (staffUsed.length === 0) {
        return { success: false, error: `"${newAnime.title}" cannot be linked.` };
    }
    
    // Update usage and create round
    const { overall, round: roundStaffUsage } = updateStaffUsage(
        staffUsed,
        details.overallStaffUsage
    );
    
    const newRound = createRound(roundNumber, newAnime, staffUsed, roundStaffUsage);
    details.rounds = [...details.rounds, newRound];
    details.overallStaffUsage = overall;
    
    return { success: true, round: newRound };
}

const startGame = (details: GameDetails): Promise<TryAddRoundResult> => {
    return fetchRandomTopAnime(100)
        .then(startAnime => {
            if (!startAnime) {
                return { success: false, error: 'Failed to select a starting anime.' } as const;
            }
            return tryAddRound(details, startAnime);
        })
        .catch(err => {
            const msg = err instanceof Error ? err.message : String(err);
            return { success: false, error: `Failed to start game: ${msg}` } as const;
        });
}

const isGameOver = (details: GameDetails): boolean => {
    return details.rounds.length >= 10;
}

export const genreHunt: GameMode = {
    name: NAME,
    description: DESCRIPTION,
    defaultSettings: {
        maxStaffUsage: MAX_STAFF_USAGE,
        timePerTurn: TIME_PER_TURN,
    },
    tryAddRound: tryAddRound,
    startGame: startGame,
    isGameOver: isGameOver,
    ui: {}
};

