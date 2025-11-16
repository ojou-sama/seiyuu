<script lang="ts" generics="TItem extends { id: number | string }">
	import { Search } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type SelectHandler = (item: TItem, id: number | string) => Promise<void>;

	interface Props {
		onSelect: (item: TItem) => void;
		disabled?: boolean;
		searchFunction: (query: string) => Promise<TItem[]>;
		fetchItemFunction: (id: number | string) => Promise<TItem>;
		resultItem: Snippet<[TItem, number, boolean, SelectHandler]>;
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

<div class="searchbar" bind:this={containerEl}>
	<div class="input-wrapper">
		<Search class="search-icon" size={20} />
		<input
			bind:value={inputValue}
			onkeydown={handleKeydown}
			placeholder="Search..."
			autocomplete="off"
			disabled={disabled}
		/>
	</div>
	{#if isOpen}
		<div class="menu">
			{#if isLoading}
				<div class="message">Loading...</div>
			{:else if hasError}
				<div class="message error">
					Rate limit reached. Please wait a moment and try again.
				</div>
			{:else if results.length === 0}
				<div class="message">No results found</div>
			{:else}
				{#each results as item, index}
					{@render resultItem(item, index, index === highlightedIndex, handleSelect)}
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
    .searchbar {
        position: relative;
        width: 100%;
    }

    .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .input-wrapper :global(.search-icon) {
        position: absolute;
        left: 10px;
        color: #999;
        pointer-events: none;
    }

    input {
        width: 100%;
        padding: 8px 8px 8px 36px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
    }

    input:focus {
        outline: none;
        border-color: #666;
    }

    .menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        max-height: 300px;
        overflow-y: auto;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 10;
    }

    .message {
        padding: 16px;
        text-align: center;
        color: #999;
    }

    .message.error {
        color: #d32f2f;
    }
</style>