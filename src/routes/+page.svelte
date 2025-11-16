<script lang="ts">
	import Game from "$lib/components/game/Game.svelte";
	import { MODES } from "$lib/modes/modeRegistry";
	import type { Anime, GameSession } from "$lib/types/game";

	const mode = MODES['genreHunt'];
	const session: GameSession<Anime> = {
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

<div class="flex justify-center items-center">
	<Game {session} />
</div>