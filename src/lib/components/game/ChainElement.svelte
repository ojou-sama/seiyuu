<script lang="ts">
	import type { GameRound } from "$lib/types/game";
	import type { Snippet } from 'svelte';

	type Props = {
		round: GameRound;
		content: Snippet; // mode-specific content
	};

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