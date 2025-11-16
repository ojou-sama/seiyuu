<script lang="ts">
	import { onDestroy } from 'svelte';

	type Props = {
		timeLimit: number; // in seconds
		startTime: number; // timestamp when turn started
		onTimeUp: () => void;
		disabled?: boolean;
	};

	const { timeLimit, startTime, onTimeUp, disabled = false }: Props = $props();

	let timeRemaining = $state(timeLimit);
	let intervalId: ReturnType<typeof setInterval> | undefined;

	function updateTimer() {
		const elapsed = Math.floor((Date.now() - startTime) / 1000);
		const remaining = Math.max(0, timeLimit - elapsed);

		timeRemaining = remaining;

		if (remaining <= 0) {
			if (intervalId) {
				clearInterval(intervalId);
			}
			onTimeUp();
		}
	}

	// start interval
	intervalId = setInterval(updateTimer, 100);
	updateTimer(); // immediate update

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div 
	class="flex items-center gap-2 px-4 py-2 rounded text-sm"
	class:bg-gray-100={timeRemaining > 10}
	class:bg-red-50={timeRemaining <= 10}
	class:opacity-50={disabled}
	class:pointer-events-none={disabled}
>
	<div 
		class="font-bold text-xl"
		class:text-gray-800={timeRemaining > 10}
		class:text-red-700={timeRemaining <= 10}
	>
		{formatTime(timeRemaining)}
	</div>
</div>
