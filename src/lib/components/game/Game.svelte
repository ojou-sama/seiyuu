<script lang="ts">
	import SearchBar from './SearchBar.svelte';
	import ChainDisplay from './ChainDisplay.svelte';
	import TurnTimer from './TurnTimer.svelte';
	import type { Anime, GameDetails, GameMode } from '$lib/types/game';
	import { onMount } from 'svelte';

	type Props = {
		mode: GameMode;
	};

	const { mode }: Props = $props();

	let isInitialized = $state(false);

	let details = $state<GameDetails>({
		startTime: Date.now(),
		isOver: false,
		mode,
		rounds: [],
		overallStaffUsage: new Map<number, number>(),
		settings: mode.defaultSettings
	});

	onMount(async () => {
		const result = await mode.startGame(details);
		if (!result.success) {
			console.error('Failed to start game:', result.error);
		} else {
			isInitialized = true;
		}
	});

	function handleSelect(selected: Anime) {
		const result = mode.tryAddRound(details, selected);
		if (result.success) {
			if (mode.isGameOver(details)) {
				details.isOver = true;
				details.endTime = Date.now();
				alert('Game is over! You win!');
			}
		} else {
			alert(result.error);
		}
	}

	function handleTimeUp() {
		if (!details.isOver) {
			details.isOver = true;
			details.endTime = Date.now();
			alert('Time is up! Game over.');
		}
	}

	// get the last round's timestamp for timer
	const lastRoundTime = $derived(
		details.rounds.length > 0 ? details.rounds[details.rounds.length - 1].timestamp : details.startTime
	);

	// only show timer when game is active (initialized and not over)
	const isGameActive = $derived(isInitialized && !details.isOver);
</script>

<div class="game-container">
	<div class="game-actions">
		<SearchBar onSelect={handleSelect} disabled={!isGameActive} />
		{#if details.settings.timePerTurn}
			<TurnTimer
				timeLimit={details.settings.timePerTurn}
				startTime={lastRoundTime}
				onTimeUp={handleTimeUp}
				disabled={!isGameActive}
			/>
		{/if}
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
		gap: 1rem;
		width: 100%;
	}

	.game-content {
		padding: 4em 0 1em 0;
	}
</style>
