# Seiyuu - AI Coding Agent Instructions

## Project Overview
This is a web-based anime chain game built with **SvelteKit 2** and **Svelte 5**. Players link anime together through shared voice actors (seiyuu), with game modes defining specific linking rules. The app is a static SPA using `adapter-static` with client-side rendering only (`ssr: false`).

## Architecture

### Game Mode System
Game modes are the core abstraction. Each mode in `src/lib/modes/` exports a `GameMode` object implementing:
- `tryAddRound(gameDetails, newItem, settings)` - Validates if an item can be added to the chain, returns `{ success: true, round }` or `{ success: false, error }`
- `isGameOver(gameDetails)` - Determines win/lose conditions
- `startGame(gameDetails, settings)` - Initializes the game (can be async), returns `TryAddRoundResult`
- Modes are registered in `modeRegistry.ts` and selected at game initialization

**Example**: `genreHunt.ts` enforces:
- No duplicate anime
- Anime must share Japanese voice actors with the previous anime
- Voice actors can't be reused more than 3 times across the game
- Game ends after 10 rounds

**Generic Architecture**: Game components are mode-agnostic. `Game.svelte` uses Svelte 5 snippets for UI composition, allowing future modes for movies, books, music, etc.

### Data Flow
1. **Search** (passed via snippet) → searches using API client functions
2. **Selection** → fetches full item details to get complete data
3. **Validation** → mode's `tryAddRound()` checks if item can be added
4. **Display** → `ChainDisplay.svelte` renders rounds using snippet-provided chain elements in **reverse order** (newest first)

### API Integration (`src/routes/api/anime/` + `src/lib/api/anime.ts`)
Internal SvelteKit API endpoints proxy to Jikan v4 (unofficial MAL API):
- `POST /api/anime/search` - Search anime by query
- `GET /api/anime/[id]` - Fetch anime + characters with Japanese VAs
- `GET /api/anime/random?topCount=N` - Get random anime from top N

Client wrapper at `src/lib/api/anime.ts` provides typed functions:
- `searchAnime(query)` - Returns top 10 results
- `fetchAnime(id)` - Fetches anime + characters, filters to Main/Supporting Japanese VAs only
- `fetchRandomTopAnime(topCount)` - Gets random anime from top N by popularity
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
- Game logic: `src/lib/modes/` - pure functions defining game rules
- Mode-specific UI: `src/lib/components/anime/` - anime-specific search and chain element components
- Generic game UI: `src/lib/components/game/` - reusable game wrapper components (Game, ChainDisplay, TurnTimer)
- Shared utilities: `src/lib/utils/` - helpers
- API layer: `src/lib/api/` - client wrappers, `src/routes/api/` - server endpoints
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
1. Create `src/lib/components/yourMode/` directory for UI components
2. Create search and chain element components
3. Create `src/lib/modes/yourMode.ts` exporting a `GameMode<TItem>` object:
   - Implement `tryAddRound()` with validation logic returning `TryAddRoundResult`
   - Implement `isGameOver()` for end conditions
   - Implement `startGame()` for initialization (can be async)
4. Register in `modeRegistry.ts`: `export const MODES = { ..., yourMode }`
5. In your page component, pass UI via snippets:
   ```svelte
   <Game {session}>
     {#snippet search({ onSelect, disabled })}
       <YourSearchBar {onSelect} {disabled} ... />
     {/snippet}
     {#snippet chainElement(round)}
       <YourChainElement {round} />
     {/snippet}
   </Game>
   ```

### Modifying Game State
Always update `GameDetails` immutably in `tryAddRound()`:
```typescript
details.rounds = [...details.rounds, newRound];  // ✓ Creates new array
details.overallStaffUsage = new Map(updated);    // ✓ Creates new Map
```

### API Architecture
- Client code calls `src/lib/api/anime.ts` functions
- These make fetch requests to `/api/anime/*` SvelteKit endpoints
- Endpoints proxy to external APIs (currently Jikan)
- **Future**: Replace endpoint implementations with database queries, add caching, WebSocket support
- API functions are passed to UI components via props

## Testing Considerations
- Game modes are pure functions - test `tryAddRound()` with mock `GameDetails` and item objects
- No backend - all game state lives in component `$state` (managed via `GameSession`)
- Initial anime fetched via `startGame()` which is async
- Generic components (`ChainDisplay`, `Game`) work with any mode via Svelte 5 snippets

# Code Style
- Follow SvelteKit and Svelte 5 best practices
- Simple, readable code with comments for complex logic
- Comments should be in all lowercase and use brief language