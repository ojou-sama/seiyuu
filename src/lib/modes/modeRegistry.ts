import type { Anime, GameDetails, ModeRegistry } from '$lib/types/game';

export const MODES: ModeRegistry = {
    genreHunt: {
        name: 'Genre Hunt',
        description: 'Play five anime of a given genre.',
        validateLink: (details: GameDetails, newAnime: Anime) => {
            // check if latest round shares a staff member with the new anime
            // return details.rounds[-1].anime.staff?.some()
            return true
        },
        isVictory: (details: GameDetails) => {
            return details.rounds.length === 10;
        },
        ui: {
            //
        }
    }
};