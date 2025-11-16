<script lang="ts">
    import type { GameRound } from "$lib/types/game";

    type Props = {
        round: GameRound;
    };

    const { round }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-2 gap-2">
    <div class="w-0.5 h-10 bg-gray-800"></div>
    {#if round.staffUsed && round.staffUsed.length > 0}
        <div class="flex flex-wrap gap-2 justify-center max-w-[400px]">
            {#each round.staffUsed as staff}
                <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                    <span class="font-medium">{staff.name}</span>
                    <span class="text-gray-600 text-xs">
                        ({round.roundStaffUsage.get(staff.id) || 0}x)
                    </span>
                </div>
            {/each}
        </div>
    {/if}
    <div class="w-0.5 h-10 bg-gray-800"></div>
</div>

