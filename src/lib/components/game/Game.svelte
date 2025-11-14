<script lang="ts">
	import SearchBar from './SearchBar.svelte';
	import ChainDisplay from './ChainDisplay.svelte';
	import type { Anime, GameDetails, GameMode } from '$lib/types/game';
	import { fetchAnime } from '$lib/utils/mal';
	import { onMount } from 'svelte';

	type Props = {
		mode: GameMode;
	};

	const { mode }: Props = $props();

	let details = $state<GameDetails>({
		startTime: Date.now(),
		isOver: false,
		mode,
		rounds: [],
		overallStaffUsage: new Map<number, number>()
	});

	onMount(async () => {
		const anime = await fetchAnime(1128);
		const result = mode.tryAddRound(details, anime);
		if (!result.success) {
			console.error('Failed to add initial anime:', result.error);
		}
	});

	function handleSelect(selected: Anime) {
		const result = mode.tryAddRound(details, selected);
		if (result.success) {
			if (mode.isGameOver(details)) {
				alert('Game is over! You win!');
			}
		} else {
			alert(result.error);
		}
	}
</script>

<div class="game-container">
	<div class="game-actions">
		<SearchBar onSelect={handleSelect} />
	</div>
	<div class="game-content">
		<ChainDisplay rounds={details.rounds} />
	</div>
</div>

<style>
	.game-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 800px;
        padding: 24px;
        margin-top: 16px;
        min-height: 100vh;
        background-color: rgb(255, 248, 239);
	}

	.game-actions {
		display: flex;
		flex-direction: row;
		width: 100%;
	}

    .game-content {
        padding: 4em 0 1em 0;
    }
</style>
