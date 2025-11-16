<script lang="ts" generics="TItem">
	import type { GameSession } from "$lib/types/game";
	import ChainLink from "./ChainLink.svelte";

	interface Props {
		session: GameSession<TItem>;
	}

	const { session }: Props = $props();

	// get chain element component from mode
	const ChainElementComponent = session.mode.chainElementComponent;
</script>

<div class="chain-display">
	{#each session.details.rounds.slice().reverse() as round, index}
		<ChainElementComponent {round} />
		{#if index < session.details.rounds.length - 1}
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