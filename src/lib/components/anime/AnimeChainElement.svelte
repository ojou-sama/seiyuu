<script lang="ts">
	import type { GameRound } from '$lib/types/game';

	type Props = {
		round: GameRound;
	};

	const { round }: Props = $props();
</script>

<div class="chain-element">
	<p>Round {round.number}</p>
	<div class="chain-card">
		{#if round.anime.coverImage}
			<img src={round.anime.coverImage} alt={round.anime.title} />
		{/if}
		<div>
			<h3>{round.anime.title}</h3>
		</div>
	</div>
</div>

<style>
	.chain-element {
		width: min(520px, 100%);
	}

	.chain-card {
		padding: 1em;
		border: 1px solid #ccc;
		border-radius: 8px;
		display: flex;
		flex-direction: row;
		gap: 1em;
	}

	.chain-card img {
		max-height: 140px;
		height: auto;
	}

	h3 {
		margin: 0;
	}
</style>
