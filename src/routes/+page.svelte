<script lang="ts">
	import Game from "$lib/components/game/Game.svelte";
	import { MODES } from "$lib/modes/modeRegistry";
	import type { GameSession } from "$lib/types/game";

	const mode = MODES['genreHunt'];
	const session: GameSession = {
		mode,
		settings: mode.defaultSettings,
		details: {
			startTime: Date.now(),
			isOver: false,
			rounds: [],
			overallStaffUsage: new Map<number, number>()
		}
	};
</script>

<div class="container">
    <Game {session}></Game>
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>