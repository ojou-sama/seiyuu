<script lang="ts">
	import { onDestroy } from 'svelte';

	type Props = {
		timeLimit: number; // in seconds
		startTime: number; // timestamp when turn started
		onTimeUp: () => void;
	};

	const { timeLimit, startTime, onTimeUp }: Props = $props();

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

<div class="turn-timer" class:warning={timeRemaining <= 10}>
	<div class="timer-label">Time remaining:</div>
	<div class="timer-value">{formatTime(timeRemaining)}</div>
</div>

<style>
	.turn-timer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #f5f5f5;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.timer-label {
		color: #666;
	}

	.timer-value {
		font-weight: 700;
		font-size: 1.2rem;
		color: #333;
	}

	.turn-timer.warning {
		background: #ffebee;
	}

	.turn-timer.warning .timer-value {
		color: #d32f2f;
	}
</style>
