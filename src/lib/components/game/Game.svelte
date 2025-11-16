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

<div class="flex flex-col items-center w-[800px] p-6 mt-4 min-h-screen bg-[rgb(255,248,239)]">
	<div class="flex flex-row gap-4 w-full">
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
	<div class="py-16 pb-4">
		<ChainDisplay {session} />
	</div>
</div>
