<script lang="ts">
	import type { GameRound } from "$lib/types/game";
    import ChainElement from "./ChainElement.svelte";
    import ChainLink from "./ChainLink.svelte";

    type Props = {
        rounds: GameRound[]
    };

    const { rounds }: Props = $props();
</script>

<div class="chain-display">
    {#each rounds.slice().reverse() as round, index}
        <ChainElement {round} />
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
        gap: 0;
        width: 100%;
    }
</style>