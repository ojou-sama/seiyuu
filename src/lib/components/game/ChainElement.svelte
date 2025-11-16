<script lang="ts">
	import type { GameRound } from "$lib/types/game";
	import type { Snippet } from 'svelte';

	interface Props {
		round: GameRound;
		content: Snippet;
	}

	const { round, content }: Props = $props();
</script>

<div class="chain-element">
	<p>Round {round.number}</p>
	{@render content()}
</div>

<style>
	.chain-element {
		width: min(520px, 100%);
	}
</style>