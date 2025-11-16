<script lang="ts">
	import type { GameRound } from "$lib/types/game";
	import type { Snippet } from 'svelte';
	import ChainLink from "./ChainLink.svelte";

	type Props = {
		rounds: GameRound[];
		chainElement: Snippet<[GameRound]>;
	};

	const { rounds, chainElement }: Props = $props();
</script>

<div class="chain-display">
	{#each rounds.slice().reverse() as round, index}
		{@render chainElement(round)}
		{#if index < rounds.length - 1}
			<ChainLink {round} />
		{/if}
	{/each}
</div>

<style>
	.chain-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
</style>