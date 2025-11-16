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

<div class="flex flex-col items-center w-full">
	{#each session.details.rounds.slice().reverse() as round, index}
		<ChainElementComponent {round} />
		{#if index < session.details.rounds.length - 1}
			<ChainLink {round} />
		{/if}
	{/each}
</div>