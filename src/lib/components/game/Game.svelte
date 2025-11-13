<script lang="ts">
    import SearchBar from "./SearchBar.svelte";
    import ChainDisplay from "./ChainDisplay.svelte";
    import type { Anime, GameDetails, GameMode } from "$lib/types/game";
	import { fetchAnime } from "$lib/utils/mal";
    import { onMount } from "svelte";
    
    type Props = {
        mode: GameMode;
    };

    const { mode }: Props = $props();

    let details = $state<GameDetails>({
        startTime: Date.now(),
        isOver: false,
        mode,
        rounds: [],
        staffUsage: []
    })

    onMount(async () => {
        const anime = await fetchAnime(1128);
        addRound(anime);
    });

    function handleSelect(selected: Anime) {
        if (mode.validateLink(details, selected)) {
            addRound(selected);
            if (mode.isVictory(details)) {
                // show victory
            }
        } else {
            // show error
        }
    }

    function addRound(anime: Anime) {
        const roundNumber = details.rounds.length + 1;
        const newRound = {
            number: roundNumber,
            anime,
            staffLinks: []
        };

        details.rounds = [...details.rounds, newRound];
    }
</script>

<div class="game-container">
	<div class="game-actions">
		<SearchBar onSelect={handleSelect} />
	</div>
    <ChainDisplay rounds={details.rounds}/>
</div>

<style>
	.game-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

    .game-actions {
        width: 100%;
    }
</style>