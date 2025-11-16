<script lang="ts" generics="TItem">
	import TurnTimer from './TurnTimer.svelte';
	import ChainDisplay from './ChainDisplay.svelte';
	import type { GameSession } from '$lib/types/game';
	import { onMount } from 'svelte';

	interface Props {
		session: GameSession<TItem>;
	}

	const { session: initialSession }: Props = $props();

	let session = $state<GameSession<TItem>>(initialSession);
	let isInitialized = $state(false);

	// get search component from mode
	const SearchComponent = session.mode.searchComponent;

	onMount(async () => {
		const result = await session.mode.startGame(session.details, session.settings);
		if (!result.success) {
			console.error('Failed to start game:', result.error);
		} else {
			isInitialized = true;
		}
	});

	function handleSelect(selected: TItem) {
		const result = session.mode.tryAddRound(session.details, selected, session.settings);
		if (result.success) {
			if (session.mode.isGameOver(session.details)) {
				session.details.isOver = true;
				session.details.endTime = Date.now();
				alert('Game is over! You win!');
			}
		} else {
			alert(result.error);
		}
	}

	function handleTimeUp() {
		if (!session.details.isOver) {
			session.details.isOver = true;
			session.details.endTime = Date.now();
			alert('Time is up! Game over.');
		}
	}

	// get the last round's timestamp for timer
	const lastRoundTime = $derived(
		session.details.rounds.length > 0 ? session.details.rounds[session.details.rounds.length - 1].timestamp : session.details.startTime
	);

	// only show timer when game is active (initialized and not over)
	const isGameActive = $derived(isInitialized && !session.details.isOver);
</script>

<div class="game-container">
	<div class="game-actions">
		<SearchComponent 
			onSelect={handleSelect} 
			disabled={!isGameActive}
		/>
		{#if session.settings.timePerTurn}
			<TurnTimer
				timeLimit={session.settings.timePerTurn}
				startTime={lastRoundTime}
				onTimeUp={handleTimeUp}
				disabled={!isGameActive}
			/>
		{/if}
	</div>
	<div class="game-content">
		<ChainDisplay {session} />
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
