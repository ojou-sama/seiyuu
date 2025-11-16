<script lang="ts" generics="TItem extends { id: number | string }">
	import { Search } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type SelectHandler = (item: TItem, id: number | string) => Promise<void>;

	interface Props {
		onSelect: (item: TItem) => void;
		disabled?: boolean;
		searchFunction: (query: string) => Promise<TItem[]>;
		fetchItemFunction: (id: number | string) => Promise<TItem>;
		resultItem: Snippet<[TItem, number, boolean, SelectHandler, (index: number) => void]>;
	}

	const { onSelect, disabled = false, searchFunction, fetchItemFunction, resultItem }: Props = $props();

	let inputValue = $state('');
	let results: TItem[] = $state([]);
	let isLoading = $state(false);
	let hasError = $state(false);
	let isOpen = $state(false);
	let highlightedIndex = $state(-1);
	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

	// container ref for scoped queries/scrolling
	let containerEl = $state<HTMLElement | null>(null);

	// debounced search
	$effect(() => {
		const value = inputValue;

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		if (disabled) {
			results = [];
			isLoading = false;
			hasError = false;
			isOpen = false;
			return;
		}

		if (value.length <= 0) {
			results = [];
			isLoading = false;
			hasError = false;
			isOpen = false;
			return;
		}

		isLoading = true;
		hasError = false;
		isOpen = true;

		debounceTimeout = setTimeout(async () => {
			try {
				const found = await searchFunction(value);
				if (value === inputValue) {
					results = found;
					isLoading = false;
					highlightedIndex = -1;
				}
			} catch (error) {
				console.error('Search failed:', error);
				if (value === inputValue) {
					hasError = true;
					isLoading = false;
					results = [];
				}
			}
		}, 300);
	});

	// scroll highlighted item into view when index changes
	$effect(() => {
		const idx = highlightedIndex;
		const container = containerEl;
		if (!container || idx < 0) return;

		const items = container.querySelectorAll<HTMLButtonElement>('.menu .item');
		const el = items[idx];
		if (el) {
			requestAnimationFrame(() =>
				el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
			);
		}
	});

	async function handleSelect(item: TItem, id: number | string) {
		try {
			const fullItem = await fetchItemFunction(id);
			onSelect?.(fullItem);
			inputValue = '';
			results = [];
			isOpen = false;
			highlightedIndex = -1;
		} catch (error) {
			console.error('Failed to fetch item:', error);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen || results.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex = highlightedIndex < 0 ? 0 : Math.min(highlightedIndex + 1, results.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, 0);
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < results.length) {
					const item = results[highlightedIndex];
					handleSelect(item, item.id);
				}
				break;
			case 'Escape':
				e.preventDefault();
				isOpen = false;
				highlightedIndex = -1;
				break;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.searchbar')) {
			isOpen = false;
			highlightedIndex = -1;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative w-full" bind:this={containerEl}>
	<div class="relative flex items-center">
		<Search class="absolute left-2.5 text-gray-400 pointer-events-none" size={20} />
		<input
			bind:value={inputValue}
			onkeydown={handleKeydown}
			placeholder="Search..."
			autocomplete="off"
			disabled={disabled}
			class="w-full py-2 pl-9 pr-2 border border-gray-300 rounded focus:outline-none focus:border-gray-600 text-base"
		/>
	</div>
	{#if isOpen}
		<div class="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-300 rounded max-h-[300px] overflow-y-auto shadow-md z-10">
			{#if isLoading}
				<div class="p-4 text-center text-gray-400">Loading...</div>
			{:else if hasError}
				<div class="p-4 text-center text-red-700">
					Rate limit reached. Please wait a moment and try again.
				</div>
			{:else if results.length === 0}
				<div class="p-4 text-center text-gray-400">No results found</div>
			{:else}
				{#each results as item, index}
					{@render resultItem(item, index, index === highlightedIndex, handleSelect, (idx) => highlightedIndex = idx)}
				{/each}
			{/if}
		</div>
	{/if}
</div>