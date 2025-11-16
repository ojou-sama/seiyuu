<script lang="ts">
	import SearchBar from '$lib/components/game/SearchBar.svelte';
	import type { Anime } from '$lib/types/game';
	import { searchAnime, fetchAnime } from '$lib/api/anime';

	type Props = {
		onSelect: (anime: Anime) => void;
		disabled?: boolean;
	};

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
	{#snippet resultItem(anime: Anime, index: number, isHighlighted: boolean, handleSelect)}
		<button
			type="button"
			class="item"
			class:highlighted={isHighlighted}
			onclick={() => handleSelect(anime, anime.id)}
		>
			<div class="title">{anime.title}</div>
			{#if getEnglishTitle(anime)}
				<div class="subtitle">{getEnglishTitle(anime)}</div>
			{/if}
		</button>
	{/snippet}
</SearchBar>

<style>
	.item {
		width: 100%;
		padding: 12px;
		cursor: pointer;
		border: none;
		border-bottom: 1px solid #f0f0f0;
		background: white;
		text-align: left;
		font-size: 1rem;
	}

	.item:last-child {
		border-bottom: none;
	}

	.item:hover {
		background: #f5f5f5;
	}

	.item.highlighted {
		background: #f5f5f5;
	}

	.title {
		font-weight: 500;
	}

	.subtitle {
		font-size: 0.875rem;
		color: #666;
		margin-top: 2px;
	}
</style>
