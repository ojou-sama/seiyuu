<script lang="ts">
	import ChainElement from '$lib/components/game/ChainElement.svelte';
	import type { GameRound } from '$lib/types/game';

	interface Props {
		round: GameRound;
	}

	const { round }: Props = $props();
</script>

<ChainElement {round}>
	{#snippet content()}
		<div class="p-4 border border-gray-300 rounded-lg flex flex-row gap-4">
			{#if round.anime.coverImage}
				<img src={round.anime.coverImage} alt={round.anime.title} class="max-h-[140px] h-auto" />
			{/if}
			<div>
				<h3 class="font-bold m-0">{round.anime.title}</h3>
			</div>
		</div>
	{/snippet}
</ChainElement>
