<script lang="ts">
    import type { GameRound } from "$lib/types/game";

    type Props = {
        round: GameRound;
    };

    const { round }: Props = $props();
</script>

<div class="chain-link">
    <div class="link-line"></div>
    {#if round.staffUsed && round.staffUsed.length > 0}
        <div class="staff-info">
            {#each round.staffUsed as staff}
                <div class="staff-item">
                    <span class="staff-name">{staff.name}</span>
                    <span class="usage-count">
                        ({round.roundStaffUsage.get(staff.id) || 0}x)
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .chain-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0;
        gap: 0.5rem;
    }

    .link-line {
        width: 2px;
        height: 40px;
        background: #333;
    }

    .staff-info {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
        max-width: 400px;
    }

    .staff-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: #f0f0f0;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .staff-name {
        font-weight: 500;
    }

    .usage-count {
        color: #666;
        font-size: 0.75rem;
    }
</style>

