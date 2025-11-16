<script lang="ts">
	import SearchBar from '$lib/components/game/SearchBar.svelte';
	import type { Anime } from '$lib/types/game';
	import { searchAnime, fetchAnime } from '$lib/api/anime';

	interface Props {
		onSelect: (anime: Anime) => void;
		disabled?: boolean;
	}

	const { onSelect, disabled = false }: Props = $props();

	function getEnglishTitle(anime: Anime): string | undefined {
		return anime.titles?.find((t) => t.type === 'English')?.title;
	}
</script>

<SearchBar
	{onSelect}
	{disabled}
	searchFunction={searchAnime}
	fetchItemFunction={fetchAnime}
>
	{#snippet resultItem(anime: Anime, index: number, isHighlighted: boolean, handleSelect, setHighlightedIndex)}
		<button
			type="button"
			class="w-full p-3 cursor-pointer border-0 border-b border-gray-100 text-left text-base last:border-b-0"
			class:bg-gray-100={isHighlighted}
			class:bg-white={!isHighlighted}
			class:hover:bg-gray-50={!isHighlighted}
			onclick={() => handleSelect(anime, anime.id)}
			onmouseenter={() => setHighlightedIndex(index)}
		>
			<div class="font-medium">{anime.title}</div>
			{#if getEnglishTitle(anime)}
				<div class="text-sm text-gray-600 mt-0.5">{getEnglishTitle(anime)}</div>
			{/if}
		</button>
	{/snippet}
</SearchBar>
