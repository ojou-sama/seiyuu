<script lang="ts">
    import type { GameRound } from "$lib/types/game";

    type Props = {
        round: GameRound;
    };

    const { round }: Props = $props();
</script>

<div class="chain-element">
    <h3>{round.anime.title}</h3>
    {#if round.anime.coverImage}
        <img src={round.anime.coverImage} alt={round.anime.title} />
    {/if}
</div>

<style>
    .chain-element {
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 8px;
        background: white;
    }

    .chain-element img {
        max-width: 200px;
        height: auto;
        border-radius: 4px;
    }
</style>

