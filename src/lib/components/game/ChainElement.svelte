<script lang="ts">
	import type { GameRound } from "$lib/types/game";
	import type { Snippet } from 'svelte';

	interface Props {
		round: GameRound;
		content: Snippet;
	}

	const { round, content }: Props = $props();
</script>

<div class="w-full max-w-[520px]">
	<p>Round {round.number}</p>
	{@render content()}
</div>