<script lang="ts">
    import type { Anime } from "$lib/types/game";
    import { searchAnime } from "$lib/utils/mal";

    type Props = {
        onSelect: (anime: Anime) => void;
    };

    const { onSelect }: Props = $props();

    let query: string = $state('');
    let results: Anime[] = $state([]);
    let isLoading: boolean = false;
    let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

    function handleInput() {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        if (query.length < 3) {
            results = [];
            isLoading = false;
            debounceTimeout = undefined;
            return;
        }

        debounceTimeout = setTimeout(async () => {
            const searchTerm = query;
            isLoading = true;

            const found = await searchAnime(searchTerm);

            if (searchTerm === query) {
                results = found;
                isLoading = false;
            }
        }, 300);
    }

    function handleSelect(anime: Anime) {
        onSelect?.(anime);
    }
</script>

<input 
    bind:value={query}
    oninput={handleInput}
    placeholder="Search anime..."
>
{#if results.length}
    <ul>
        {#each results as animeResult}
            <li>
                <button onclick={() => handleSelect(animeResult)}>{animeResult.title}</button>
            </li>
        {/each}
    </ul>
{/if}