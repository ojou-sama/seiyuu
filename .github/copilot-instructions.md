# Seiyuu - AI Coding Agent Instructions

## Project Overview
This is a web-based anime chain game built with **SvelteKit 2** and **Svelte 5**. Players link anime together through shared voice actors (seiyuu), with game modes defining specific linking rules. The app is a static SPA using `adapter-static` with client-side rendering only (`ssr: false`).

## Architecture

### Game Mode System
Game modes are the core abstraction. Each mode in `src/lib/modes/` exports a `GameMode` object implementing:
- `tryAddRound(gameDetails, newAnime)` - Validates if an anime can be added to the chain, returns `{ success: true, round }` or `{ success: false, error }`
- `isGameOver(gameDetails)` - Determines win/lose conditions
- Modes are registered in `modeRegistry.ts` and selected at game initialization

**Example**: `genreHunt.ts` enforces:
- No duplicate anime
- Anime must share Japanese voice actors with the previous anime
- Voice actors can't be reused more than 3 times across the game
- Game ends after 10 rounds

### Data Flow
1. **Search** (`SearchBar.svelte`) → calls `searchAnime()` (debounced 300ms, min 3 chars)
2. **Selection** → fetches full anime details via `fetchAnime(id)` to get voice actor list
3. **Validation** → mode's `tryAddRound()` checks if anime can be added
4. **Display** → `ChainDisplay.svelte` renders rounds in **reverse order** (newest first)

### MAL API Integration (`src/lib/utils/mal.ts`)
Uses Jikan v4 API (unofficial MAL API). Key functions:
- `fetchAnime(id)` - Fetches anime + characters, filters to Main/Supporting Japanese VAs only
- `searchAnime(query)` - Returns top 10 results
- Voice actors are deduplicated per anime (same VA voicing multiple characters = 1 entry)

**Important**: Only Main and Supporting character roles are included; background characters are filtered out.

## Development Conventions

### Svelte 5 Patterns
- **Runes**: Use `$state`, `$props`, `$derived` - no legacy reactive declarations
- **Props typing**: Define with `type Props = { ... }; const { prop }: Props = $props();`
- **Event handlers**: Use `onclick`, `oninput` attributes, not `on:click` directives
- **Conditionals**: Use `{#if condition}` blocks, not `{#if $variable}` (no $ prefix needed)

### Type Safety
- All game-related types in `src/lib/types/game.ts`
- `Staff` includes optional `characterName` and `characterRole` set during anime fetch
- `GameDetails.overallStaffUsage` and `GameRound.roundStaffUsage` track VA usage counts
- Use discriminated unions for results: `TryAddRoundResult = { success: true, ... } | { success: false, error }`

### File Organization
- Game logic: `src/lib/modes/` - pure functions, no UI
- UI components: `src/lib/components/game/` - game-specific components
- Shared utilities: `src/lib/utils/` - API clients, helpers
- Path alias `$lib` resolves to `src/lib/`

## Key Commands
```bash
npm run dev          # Start dev server (Vite)
npm run build        # Build for production (static output)
npm run preview      # Preview production build
npm run check        # Type-check with svelte-check
npm run lint         # ESLint + Prettier check
npm run format       # Auto-format with Prettier
```

## Common Patterns

### Adding a New Game Mode
1. Create `src/lib/modes/newMode.ts` exporting a `GameMode` object
2. Implement `tryAddRound()` with validation logic returning `TryAddRoundResult`
3. Implement `isGameOver()` for end conditions
4. Register in `modeRegistry.ts`: `export const MODES = { ..., newMode }`
5. Mode is immediately selectable in game initialization

### Modifying Game State
Always update `GameDetails` immutably in `tryAddRound()`:
```typescript
details.rounds = [...details.rounds, newRound];  // ✓ Creates new array
details.overallStaffUsage = new Map(updated);    // ✓ Creates new Map
```

### API Rate Limiting
Jikan API has rate limits. SearchBar includes 300ms debounce; avoid calling `fetchAnime()` unnecessarily (e.g., cache results, fetch only on final selection).

## Testing Considerations
- Game modes are pure functions - test `tryAddRound()` with mock `GameDetails` and `Anime` objects
- No backend - all game state lives in component `$state`
- Initial anime (ID 1128) is hardcoded in `Game.svelte` - consider making configurable

# Code Style
- Follow SvelteKit and Svelte 5 best practices
- Simple, readable code with comments for complex logic
- Comments should be in all lowercase and use brief language