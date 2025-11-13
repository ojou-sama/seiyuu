<script lang="ts">
	import Game from "$lib/components/game/Game.svelte";
	import { MODES } from "$lib/modes/modeRegistry";

</script>

<div class="container">
    <Game mode={MODES['genreHunt']}></Game>
</div>