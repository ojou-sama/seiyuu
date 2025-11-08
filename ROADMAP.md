# Seiyuu Relay Game - Project Roadmap

## Project Overview

**Seiyuu Relay** is a web-based puzzle game where players connect a starting anime to a target anime by creating a chain through seiyuu (voice actors). Similar to games like Wordle and its spinoffs, the game offers both a daily challenge mode with fixed start/end points and a freeplay mode with randomly generated puzzles.

### Game Mechanics
- Players start from an **anime** and must reach a **target anime**
- Each link in the chain alternates: **Anime → Seiyuu → Anime → Seiyuu → ... → Target Anime**
- Multiple valid solutions exist since seiyuu work on multiple anime and anime have multiple seiyuu
- **Gameplay flow**: 
  1. Game shows starting anime
  2. Fetch and display all seiyuu who worked on that anime
  3. User picks a seiyuu (can use search to filter the already-loaded list)
  4. Fetch and display all anime that seiyuu worked on
  5. User picks an anime
  6. Repeat until target is reached

### Technical Stack
- **Frontend**: SvelteKit 2.x + TypeScript (SPA)
- **Data Source**: Jikan API (MyAnimeList) via jikan-api.js wrapper (client-side calls)
- **Backend**: Static files only (no server logic)
- **Hosting**: Static hosting (Vercel/Netlify/Cloudflare Pages)

### Architecture Philosophy
- **Minimal backend**: No server routes, no database, just static JSON files
- **Client-side everything**: All API calls, validation, and game logic runs in the browser
- **Pre-generated dailies**: Daily puzzles are curated and pre-generated, committed to repository
- **Direct API integration**: Frontend calls Jikan API (MyAnimeList) directly using jikan-api.js wrapper

---

## Phase 1: Core Data Layer & API Integration

### 1.1 Jikan API Client Setup

**Objective**: Establish reliable communication with the Jikan API (MyAnimeList) to fetch anime and seiyuu data.

**Implementation Details**:
- Install and configure jikan4.js wrapper in `src/lib/api/mal.ts`
- Implement functions for:
  - **Fetching anime by ID with voice actor roster**: Returns anime title, cover image, and list of Japanese voice actors (main/supporting roles only)
  - **Fetching people (seiyuu) by ID with anime roles**: Returns seiyuu name, image, and list of anime voice acting roles (main/supporting only)
  - **Searching anime by name**: For search/autocomplete (used in freeplay puzzle generation)
  - **Searching people by name**: For search/autocomplete within loaded seiyuu lists
- Add proper TypeScript types for all API responses in `src/lib/types/mal.ts`
- Implement error handling with user-friendly messages
- Add caching mechanism using browser localStorage to reduce redundant API calls
- Filter to only include Main and Supporting character roles (exclude Background roles)

**Why This Matters**: The entire game revolves around anime-seiyuu relationships. The jikan-api.js wrapper provides a clean TypeScript interface to MyAnimeList data with built-in error handling. Caching aggressively minimizes API calls and improves performance.

**API Call Pattern**:
```
Game start → Fetch anime details + characters (2 calls)
User picks seiyuu → Fetch person details + voice roles (2 calls)  
User picks anime → Fetch anime details + characters (2 calls)
...repeat
```
Typical game: 8-12 API calls total. With caching, repeated plays use 0-2 calls.

### 1.2 Data Models & Type Definitions

**Objective**: Create consistent data structures that represent the game's core entities.

**Implementation Details**:
- Define TypeScript interfaces in `src/lib/types/game.ts`:
  - `Anime`: id, title (string), coverImage, type, year, voiceActors array
  - `Seiyuu`: id, name (string), image, animeRoles array, characterName, characterRole ('Main' | 'Supporting')
  - `AnimeRole`: anime, characterName, characterRole
  - `GameLink`: represents one step in the chain (type: 'anime' | 'seiyuu', entity: Anime | Seiyuu)
  - `GameChain`: array of GameLinks representing the player's current path
  - `GameState`: complete game state including chain, target, moves, mode, completion status
  - `DailyPuzzle`: startAnimeId, targetAnimeId, date, puzzleNumber
  - `FreeplayPuzzle`: startAnimeId, targetAnimeId, difficulty, generatedAt

**Why This Matters**: TypeScript types provide compile-time safety and make the codebase easier to maintain as complexity grows. Clear data models prevent bugs and make the code self-documenting.

### 1.3 Client-Side Caching System

**Objective**: Minimize redundant API calls by caching fetched anime and seiyuu data.

**Implementation Details**:
- Create caching utility in `src/lib/cache/index.ts`:
  - Store fetched anime details in localStorage with TTL (7 days)
  - Store fetched seiyuu details in localStorage with TTL (7 days)
  - Implement cache size limit (max 100 entries each)
  - LRU eviction when cache is full
  - Cache key format: `anime:{id}`, `seiyuu:{id}`
  - Manual cache clear option in settings
- Before making API call, check cache first
- On successful API response, store in cache

**Why This Matters**: Caching dramatically improves performance and reduces API calls. If a user plays multiple games or revisits the same anime/seiyuu, cached data provides instant responses.

---

## Phase 2: Game Logic & State Management

### 2.1 Core Game Logic

**Objective**: Implement the rules and validation logic that power the gameplay.

**Implementation Details**:
- Create game engine in `src/lib/game/engine.ts`:
  - **Chain validation**: Ensure chain structure is correct (anime → seiyuu → anime → seiyuu...)
  - **Connection validation**: Since we fetch complete lists, validation is simple:
    - When user picks seiyuu: check if seiyuu is in the fetched voiceActors array
    - When user picks anime: check if anime is in the fetched animeRoles array
  - **Win condition check**: Determine if the last anime in chain matches target anime ID
  - **Move tracking**: Count the number of links in the chain
  - **State transitions**: Handle adding/removing links from the chain
  - **Undo functionality**: Remove last link and revert to previous state
- Create helper utilities in `src/lib/game/utils.ts`:
  - Determine if current step requires anime or seiyuu selection
  - Calculate shortest possible path (for statistics after completion)
  - Format chain for display and sharing

**Why This Matters**: The game engine is the brain of the application. It ensures the game rules are followed and provides immediate feedback. Since validation is client-side and we have complete data, it's straightforward.

### 2.2 Client-Side State Management

**Objective**: Manage game state reactively using Svelte's built-in reactivity.

**Implementation Details**:
- Create Svelte stores in `src/lib/stores/`:
  - `gameState.ts`: Writable store containing:
    - Current chain (array of GameLinks)
    - Target anime ID
    - Start anime ID
    - Mode ('daily' | 'freeplay')
    - Completion status
    - Move count
    - Currently fetched options (seiyuu or anime list for current step)
  - `userProgress.ts`: Persistent store (using localStorage) for:
    - Daily puzzle completion status (date → completion data)
    - Personal best scores per puzzle
    - Play statistics (games played, average moves, etc.)
    - Streak tracking for daily mode
    - Freeplay statistics
- Implement store actions:
  - `initializeGame(puzzle)`: Start a new game with given start/target IDs
  - `addLink(entity)`: Add anime or seiyuu to chain, fetch next options
  - `removeLastLink()`: Undo last move, restore previous options
  - `resetGame()`: Clear current chain, keep same puzzle
  - `completeGame()`: Save completion statistics, update streak
  - `loadDailyProgress()`: Check if today's puzzle is already in progress

**Why This Matters**: Reactive state management makes the UI automatically update when game state changes, and localStorage persistence allows players to resume interrupted games.

### 2.3 Local Storage & Save System

**Objective**: Persist game progress and statistics across browser sessions.

**Implementation Details**:
- Create localStorage wrapper in `src/lib/storage/index.ts`:
  - Save/load current game state (separate keys for daily vs freeplay)
  - Save/load user statistics
  - Save daily puzzle completion with date stamp
  - Track last 30 completed puzzles for sharing/stats
  - Handle data migration for future schema changes
  - Implement data structure versioning (`storageVersion: 1`)
- Add data validation when loading from localStorage to prevent corrupted data issues
- Auto-save game state after each move
- Clear completed games after 24 hours (for daily mode)

**Why This Matters**: Players expect their progress to persist, especially for daily puzzles. Without this, closing the browser would lose all progress.

---

## Phase 3: Daily Puzzle System

### 3.1 Puzzle Pool Curation

**Objective**: Create a curated list of high-quality anime suitable for daily puzzles.

**Implementation Details**:
- Create puzzle pool data structure in `static/data/puzzle-pool.json`:
  ```json
  {
    "version": 1,
    "anime": [
      {
        "id": 1535,
        "title": "Death Note",
        "popularity": 95,
        "seiyuuCount": 23,
        "avgConnectionsToOtherPool": 12,
        "tags": ["popular", "long-running"]
      },
      ...
    ]
  }
  ```
- Criteria for inclusion:
  - Popular/well-known anime (MAL popularity/members > threshold)
  - Good seiyuu coverage (at least 10 credited voice actors)
  - Well-connected (seiyuu who worked on multiple other popular anime)
  - Data completeness (has cover image, correct titles, etc.)
- Initial pool size: ~200-300 anime
- Categories: popular shonen, popular seinen, classic anime, recent hits

**Why This Matters**: Not all anime make good puzzles. A curated pool ensures puzzles are recognizable, solvable, and interesting. Since seiyuu automatically come from popular anime, we don't need to curate them separately.

### 3.2 Puzzle Generation Helper Tool

**Objective**: Create a tool that helps generate and validate daily puzzles.

**Implementation Details**:
- Create Node.js script in `scripts/generate-daily-puzzles.ts`:
  - Load puzzle pool
  - Interactive CLI interface:
    - Option 1: "Generate next N days" (auto-generates with variety algorithm)
    - Option 2: "Manually create puzzle" (select start/target from pool)
    - Option 3: "Validate puzzle" (check if path exists between start/target)
  - **Auto-generation algorithm**:
    - Select random start anime from pool
    - Select random target anime from pool (different from start)
    - Ensure at least one connection path exists (BFS search via Jikan API)
    - Vary difficulty throughout the week (easier on Monday, harder on Friday)
    - Avoid repeating same anime within 30 days
  - **Validation**:
    - Call Jikan API to verify connection path exists
    - Calculate estimated difficulty (number of possible paths, seiyuu overlap)
    - Show path preview
  - Output: Update `static/data/daily-puzzles.json`
- Tool features:
  - Preview generated puzzles before committing
  - Regenerate individual days
  - Show statistics (difficulty distribution, anime frequency)
  - Dry-run mode (test without saving)

**Why This Matters**: Manually creating puzzles is tedious. This tool makes it easy to generate months of puzzles quickly while ensuring quality and solvability.

### 3.3 Daily Puzzle Data File

**Objective**: Store pre-generated daily puzzles in a static file.

**Implementation Details**:
- Create `static/data/daily-puzzles.json`:
  ```json
  {
    "version": 1,
    "startDate": "2025-01-01",
    "puzzles": [
      {
        "number": 1,
        "date": "2025-01-01",
        "startAnimeId": 1535,
        "targetAnimeId": 5114,
        "difficulty": "medium",
        "estimatedMoves": 5
      },
      ...
    ]
  }
  ```
- Generate 365 puzzles at a time (covers a full year)
- Update quarterly or when running low
- Commit to repository (no dynamic generation needed)

**Why This Matters**: Pre-generated puzzles mean zero backend logic, instant loading, and guaranteed consistency across all players.

### 3.4 Daily Puzzle Loading

**Objective**: Fetch and load today's daily puzzle in the game.

**Implementation Details**:
- Create utility in `src/lib/puzzles/daily.ts`:
  - `loadTodaysPuzzle()`: Fetch daily-puzzles.json, find today's puzzle by date
  - `loadPuzzleByDate(date)`: Load historical puzzle (for archive mode)
  - Handle edge cases:
    - No puzzle for today (show error, generate random as fallback)
    - Date mismatch (timezone handling)
    - Invalid JSON (show error message)
- Calculate puzzle number from start date
- Cache daily-puzzles.json in memory (refetch once per day)

**Why This Matters**: This is the entry point for daily mode. Needs to be reliable and handle edge cases gracefully.

---

## Phase 4: Freeplay Mode

### 4.1 Random Puzzle Generation

**Objective**: Generate on-demand random puzzles for endless play.

**Implementation Details**:
- Create random puzzle generator in `src/lib/puzzles/random.ts`:
  - Use the same puzzle pool from Phase 3.1
  - Implement difficulty levels:
    - **Easy**: Start and target anime have many common seiyuu (shorter paths)
    - **Medium**: Moderate connection density
    - **Hard**: Fewer connections, requires more steps
  - Generation algorithm:
    - Load puzzle-pool.json
    - Filter by difficulty criteria
    - Randomly select start anime
    - Randomly select target anime (different from start)
    - No validation needed (if both from curated pool, path likely exists)
  - Store generated puzzle in gameState (no persistence needed)
- Client-side generation (no API needed)

**Why This Matters**: Freeplay mode allows dedicated players to practice and play more than once per day, increasing engagement.

### 4.2 Freeplay State Management

**Objective**: Handle freeplay game state separately from daily mode.

**Implementation Details**:
- Extend `gameState` store to track mode clearly
- Modify save system:
  - Daily mode: persistent save (resume on refresh)
  - Freeplay mode: optional save (can abandon without penalty)
- Track freeplay statistics separately:
  - Total freeplay games by difficulty
  - Best freeplay score per difficulty
  - Average moves per difficulty
  - No streak tracking (that's for daily only)
- Allow "New Puzzle" button to abandon current freeplay game

**Why This Matters**: Players should be able to try different freeplay puzzles without affecting their daily progress or statistics.

---

## Phase 5: User Interface Components

### 5.1 Game Board Component

**Objective**: Create the main visual interface showing the current chain.

**Implementation Details**:
- Create `src/lib/components/GameBoard.svelte`:
  - Display the chain as a vertical flow (works better on mobile)
  - Visual representation: 
    ```
    [Start Anime Image]
          ↓
    [Seiyuu Portrait]
          ↓
    [Anime Image]
          ↓
    [Seiyuu Portrait]
          ↓
    ...
          ↓
    [Target Anime Placeholder ⭐]
    ```
  - Show images for anime (cover art) and seiyuu (portrait)
  - Highlight current position (last link pulses or has border)
  - Target shown as placeholder until reached
  - Show move counter at top
  - Responsive design (stack vertically on mobile, can be horizontal on desktop)
  - Smooth animations when new links are added
  - Each link shows name on hover/tap

**Why This Matters**: The game board is the primary interface. It needs to clearly show progress and make the game intuitive to play visually.

### 5.2 Selection Component

**Objective**: Display the list of seiyuu or anime for the current step and allow user selection.

**Implementation Details**:
- Create `src/lib/components/SelectionList.svelte`:
  - Props: `items` (array of anime or seiyuu), `type` ('anime' | 'seiyuu')
  - Display grid of cards with:
    - Entity image (cover or portrait)
    - Entity name
    - For seiyuu: character name they played in previous anime
    - For anime: format (TV/Movie/OVA) and year
  - Built-in search/filter input at top:
    - Filter the already-loaded list (no API calls)
    - Debounced for smooth typing
    - Clear button
  - Keyboard navigation:
    - Arrow keys to navigate
    - Enter to select
    - Type to search
  - Loading state while fetching from API
  - Empty state if no items
  - Responsive grid (1 column mobile, 2-3 columns tablet, 4-5 columns desktop)

**Why This Matters**: This is the primary interaction component. Users spend most of their time here, so it needs to be fast, responsive, and easy to navigate.

### 5.3 Game Controls Component

**Objective**: Provide buttons and controls for game actions.

**Implementation Details**:
- Create `src/lib/components/GameControls.svelte`:
  - "Undo" button: Remove last link from chain (disabled if chain is empty)
  - "Reset" button: Start over from beginning (shows confirmation dialog)
  - "Give Up" button: Reveal one possible solution path (shows confirmation, marks game as incomplete)
  - Move counter display (large, prominent)
  - For daily mode: Timer showing time played (optional)
  - For freeplay mode: "New Puzzle" button (with confirmation if game in progress)
  - Difficulty indicator (for freeplay)
  - Keyboard shortcuts (U for undo, R for reset, etc.)

**Why This Matters**: Players need ways to correct mistakes and manage their game state. These controls provide necessary functionality without cluttering the UI.

### 5.4 Completion Screen Component

**Objective**: Show victory screen when player reaches the target.

**Implementation Details**:
- Create `src/lib/components/CompletionScreen.svelte`:
  - Celebratory animation (confetti, success icon)
  - Display statistics:
    - "You completed in X moves!"
    - Personal best comparison ("2 moves better than your best!")
    - Estimated optimal path (calculated after completion)
  - For daily mode:
    - Puzzle number display
    - Countdown to next daily puzzle (00:00:00)
    - Current streak: "🔥 5 day streak!"
    - Share button (generates spoiler-free text)
  - For freeplay mode:
    - "Play Another" button (same difficulty or change)
    - Difficulty completed indicator
  - Visual summary showing the complete chain (scrollable)
  - Social share preview

**Why This Matters**: Completion is the payoff moment. A satisfying end screen encourages sharing and replay.

### 5.5 Statistics Panel Component

**Objective**: Display player progress and achievements.

**Implementation Details**:
- Create `src/lib/components/StatsPanel.svelte`:
  - Accessible via modal (button in header)
  - **Daily Mode Stats**:
    - Games played
    - Win rate
    - Current streak (big, prominent)
    - Max streak
    - Average moves
    - Best score (fewest moves)
    - Last 7 days: visual calendar showing ✅ for completed days
  - **Freeplay Stats** (by difficulty):
    - Games played per difficulty
    - Average moves per difficulty
    - Best score per difficulty
  - **Overall Stats**:
    - Total games
    - Total playtime (if tracked)
    - Favorite seiyuu (most used in chains)
    - Favorite anime (most used in chains)
  - Data visualization (simple bar charts or graphs)
  - "Clear all data" button (with confirmation)

**Why This Matters**: Statistics give players goals to chase and reasons to keep playing daily. Tracking streaks creates habit formation.

### 5.6 Tutorial/How to Play Component

**Objective**: Teach new players how the game works.

**Implementation Details**:
- Create `src/lib/components/Tutorial.svelte`:
  - Modal/overlay that appears on first visit
  - Step-by-step explanation:
    1. "Start with the shown anime"
    2. "Pick a seiyuu who worked on it"
    3. "Pick an anime that seiyuu worked on"
    4. "Continue until you reach the target!"
  - Visual examples with screenshots/diagrams
  - Example mini-chain showing the concept
  - Explain daily vs freeplay modes
  - Tips: "Start with popular seiyuu for more options"
  - Keyboard shortcuts reference
  - "Got it" button to dismiss
  - Checkbox: "Don't show this again" (save to localStorage)
  - Accessible from header "How to Play" link

**Why This Matters**: The game concept might not be immediately obvious to new players. A tutorial ensures everyone can start playing without confusion.

---

## Phase 6: Page Routes & Navigation

### 6.1 Home Page (Daily Mode)

**Objective**: Main landing page featuring today's daily puzzle.

**Implementation Details**:
- Create/modify `src/routes/+page.svelte`:
  - Load today's daily puzzle from daily-puzzles.json
  - Check localStorage for in-progress game
  - If puzzle already completed today:
    - Show completion screen with stats
    - Show countdown to tomorrow's puzzle
    - Option to view solution
  - If puzzle in progress:
    - Resume game state
    - Show GameBoard with current chain
    - Show SelectionList for next step
  - If new puzzle:
    - Initialize new game
    - Fetch start anime details from Jikan API
    - Show GameBoard with start anime
    - Fetch and show seiyuu list
  - Display puzzle number and date prominently
  - Link to freeplay mode
  - Link to stats panel
  - How to play button
- Show tutorial on first visit

**Why This Matters**: The home page is the primary entry point and should immediately present the daily challenge in a clear, inviting way.

### 6.2 Freeplay Page

**Objective**: Dedicated page for random puzzle mode.

**Implementation Details**:
- Create `src/routes/freeplay/+page.svelte`:
  - Difficulty selector (Easy/Medium/Hard) at top
  - "Generate Puzzle" button (prominent, calls random puzzle generator)
  - Once puzzle generated:
    - Same GameBoard, SelectionList, GameControls as daily mode
    - "New Puzzle" button always available in controls
    - Difficulty indicator badge
  - Freeplay statistics in sidebar (collapsible on mobile)
  - Brief explanation: "Practice with unlimited puzzles!"
  - Link back to daily mode

**Why This Matters**: Separating freeplay into its own route keeps the game modes distinct and allows different UI optimizations.

### 6.3 Archive/History Page (Optional)

**Objective**: Allow players to replay past daily puzzles.

**Implementation Details**:
- Create `src/routes/archive/+page.svelte`:
  - Calendar view showing all past puzzles
  - Each date shows:
    - ✅ if completed
    - 🔒 if not yet released
    - Empty if not attempted
    - Move count if completed
  - Click any past date to load that puzzle
  - Playing archive puzzles doesn't affect:
    - Daily streak
    - Daily statistics
  - Separate stats tracking for archive play
  - Clear indication: "Archive Mode - Playing puzzle #42 from Jan 15"

**Why This Matters**: Players who miss a day or discover the game later can still play previous puzzles, increasing content value and engagement.

### 6.4 Layout & Navigation

**Objective**: Consistent navigation and branding across all pages.

**Implementation Details**:
- Update `src/routes/+layout.svelte`:
  - Header with:
    - Game title/logo (link to home)
    - Navigation: Daily | Freeplay | Archive
    - How to Play button (opens tutorial modal)
    - Stats button (opens stats modal)
    - Settings button (opens settings modal)
  - Mobile-responsive:
    - Hamburger menu on mobile
    - Full nav bar on desktop
  - Footer:
    - Credits (MyAnimeList/Jikan API attribution)
    - GitHub link
    - Version number
  - Global components:
    - Toast notifications for errors
    - Loading indicator for API calls

**Why This Matters**: Consistent navigation helps users understand the app structure and easily switch between modes.

---

## Phase 7: Game Features & Polish

### 7.1 Share Functionality

**Objective**: Enable players to share their results like Wordle.

**Implementation Details**:
- Create share utility in `src/lib/game/share.ts`:
  - Generate shareable text format (no spoilers):
    ```
    Seiyuu Chain #42 🎭
    Completed in 6 moves
    
    🎬 → 👤 → 🎬 → 👤 → 🎬 → 👤 → 🎬
    
    Play at: [URL]
    ```
  - Include puzzle number for daily mode
  - Include difficulty for freeplay mode
  - Don't include actual anime/seiyuu names (spoilers)
  - Copy to clipboard functionality
  - Share API integration (mobile share sheet)
  - Optional: Generate Open Graph image for social media
- Add share button to CompletionScreen
- Toast notification: "Copied to clipboard!"

**Why This Matters**: Social sharing is key to organic growth and creates community around the daily puzzle, similar to Wordle's success.

### 7.2 Settings & Preferences

**Objective**: Allow users to customize their experience.

**Implementation Details**:
- Create `src/lib/components/Settings.svelte`:
  - Theme selection:
    - Light mode
    - Dark mode
    - Auto (system preference)
  - Display preferences:
    - Image quality (high/medium/low for slower connections)
    - Animations on/off
    - Reduced motion mode
  - Accessibility:
    - High contrast mode
    - Font size adjustment
  - Data management:
    - Clear cache
    - Clear statistics (with confirmation)
    - Export statistics (JSON download)
    - Import statistics
  - Save preferences to localStorage
  - Apply settings immediately (reactive)

**Why This Matters**: Customization improves user experience and accessibility, making the game usable for more people.

### 7.3 Accessibility Features

**Objective**: Make the game playable for users with disabilities.

**Implementation Details**:
- Implement throughout all components:
  - ARIA labels for all interactive elements
  - Semantic HTML (proper heading hierarchy)
  - Keyboard navigation:
    - Tab through all interactive elements
    - Arrow keys for grid navigation
    - Enter/Space for selections
    - Escape to close modals
    - Keyboard shortcuts for common actions
  - Focus management:
    - Trap focus in modals
    - Return focus after modal closes
    - Clear focus indicators
  - Screen reader support:
    - Announce game state changes
    - Describe images with alt text
    - Live regions for dynamic updates
  - Color contrast (WCAG AA compliant)
  - No information conveyed by color alone
  - Reduce motion option (respects prefers-reduced-motion)

**Why This Matters**: Accessibility is essential for inclusive design, reaches a wider audience, and is the right thing to do.

### 7.4 Error Handling & Edge Cases

**Objective**: Handle errors gracefully and provide helpful feedback.

**Implementation Details**:
- Create error handling system:
  - Network errors:
    - Show friendly message: "Connection issue. Check your internet."
    - Retry button
    - Offline indicator
  - API errors:
    - Rate limit: "Too many requests. Please wait a moment."
    - 404: "Data not found. This might be a rare anime/seiyuu."
    - Timeout: "Request took too long. Please try again."
  - Data errors:
    - Invalid puzzle data: Fallback to random puzzle
    - Corrupted save data: Clear and restart
    - Missing images: Show placeholder
  - Edge cases:
    - No seiyuu for anime: Show message, allow undo
    - No anime for seiyuu: Show message, allow undo
    - Target anime already in chain: Prevent selection
  - Toast notification component for non-critical errors
  - Modal for critical errors
  - Fallback UI for broken states

**Why This Matters**: Graceful error handling prevents user frustration and makes the app feel polished and reliable.

---

## Phase 8: Performance & Optimization

### 8.1 Caching Strategy

**Objective**: Minimize API calls and improve load times.

**Implementation Details**:
- Implement multi-layer caching:
  - **In-memory cache**: Store current game's fetched data in component state
  - **localStorage cache**: Persist anime/seiyuu data with 7-day TTL
  - **Prefetching**: When user selects seiyuu, prefetch top 3-5 most popular anime they worked on
  - **Image preloading**: Preload images for fetched options
- Cache management:
  - Max 100 anime entries
  - Max 100 seiyuu entries
  - LRU eviction when limit reached
  - Manual clear in settings
- Cache keys:
  ```
  cache:anime:{id}
  cache:seiyuu:{id}
  cache:meta:version
  ```

**Why This Matters**: Good caching makes the game feel instant, reduces API calls dramatically, and improves the experience on slow connections.

### 8.2 Image Optimization

**Objective**: Ensure images load quickly and look good on all devices.

**Implementation Details**:
- Image handling:
  - Use Jikan/MAL image CDN URLs (already optimized)
  - Request appropriate sizes from Jikan API (large vs medium)
  - Lazy load images in selection lists (load as user scrolls)
  - Eager load images for current chain
  - Responsive images:
    - Smaller sizes for mobile
    - Larger sizes for desktop
  - Image placeholders while loading (skeleton screens)
  - Fallback images for 404s (generic anime/seiyuu icon)
  - Use `loading="lazy"` attribute
  - Use `decoding="async"` attribute

**Why This Matters**: Images are a large part of the game's visual appeal. Optimized images improve performance, especially on mobile networks.

### 8.3 Code Splitting & Bundle Optimization

**Objective**: Reduce initial bundle size for faster page loads.

**Implementation Details**:
- Dynamic imports for non-critical components:
  ```javascript
  const Tutorial = () => import('$lib/components/Tutorial.svelte');
  const Stats = () => import('$lib/components/StatsPanel.svelte');
  const Settings = () => import('$lib/components/Settings.svelte');
  ```
- Route-based code splitting (automatic with SvelteKit)
- Lazy load archive page (not needed on first visit)
- Analyze bundle size:
  - Use `vite-bundle-analyzer` or similar
  - Identify large dependencies
  - Replace or optimize heavy libraries
- Tree-shaking (automatic with Vite)
- Minification in production

**Why This Matters**: Faster initial load improves user retention, especially for first-time visitors. Every second counts.

---

## Phase 9: Deployment & Infrastructure

### 9.1 Build Configuration

**Objective**: Configure SvelteKit for static site deployment.

**Implementation Details**:
- Install `@sveltejs/adapter-static`
- Configure in `svelte.config.js`:
  ```javascript
  import adapter from '@sveltejs/adapter-static';
  export default {
    kit: {
      adapter: adapter({
        pages: 'build',
        assets: 'build',
        fallback: 'index.html', // SPA mode
        precompress: false
      })
    }
  };
  ```
- Build scripts in `package.json`:
  - `npm run build`: Production build
  - `npm run preview`: Preview production build locally
- Environment variables (if needed):
  - Create `.env` file
  - No secrets needed (API is public)

**Why This Matters**: Static adapter allows deployment to any static hosting provider (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

### 9.2 Deployment Setup

**Objective**: Deploy the application and set up CI/CD.

**Implementation Details**:
- Choose hosting provider (recommendation: Vercel or Netlify)
- Connect GitHub repository
- Configure build settings:
  - Build command: `npm run build`
  - Output directory: `build`
  - Node version: 18.x or higher
- Set up automated deployment:
  - Deploy on push to `main` branch
  - Preview deployments for pull requests
  - Deployment notifications
- Custom domain setup (if desired):
  - Configure DNS
  - Enable HTTPS (automatic with Vercel/Netlify)
- CDN configuration (automatic with hosting provider)

**Why This Matters**: Automated deployment ensures the live site is always up-to-date and reduces manual work.

### 9.3 Monitoring & Analytics (Optional)

**Objective**: Understand user behavior and catch errors.

**Implementation Details**:
- Privacy-respecting analytics (Plausible, Fathom, or similar):
  - Page views
  - Popular pages
  - User flow
  - No personal data collection
- Track game events (privacy-safe):
  - Daily puzzle completions
  - Average moves
  - Freeplay games started
  - Share button clicks
- Client-side error logging:
  - Catch unhandled errors
  - Log to console in dev
  - Optional: Send to error tracking service (Sentry, etc.)
- Performance monitoring:
  - Core Web Vitals
  - API response times
  - Page load times

**Why This Matters**: Analytics help understand what's working and what needs improvement. Error tracking helps fix issues quickly.

---

## Phase 10: Testing & Quality Assurance

### 10.1 Unit Tests

**Objective**: Ensure core game logic works correctly.

**Implementation Details**:
- Set up Vitest (already fast with Vite)
- Test coverage for:
  - `src/lib/game/engine.ts`: Chain validation, win conditions
  - `src/lib/game/utils.ts`: Helper functions
  - `src/lib/puzzles/random.ts`: Puzzle generation
  - `src/lib/cache/index.ts`: Cache logic
  - `src/lib/storage/index.ts`: localStorage wrapper
- Test structure:
  ```typescript
  describe('Game Engine', () => {
    test('validates correct chain structure', () => {
      // ...
    });
    test('detects win condition', () => {
      // ...
    });
  });
  ```
- Aim for >80% coverage on game logic
- Run tests in CI pipeline

**Why This Matters**: Unit tests catch bugs early and make refactoring safer, especially for complex game logic.

### 10.2 Integration/E2E Tests (Optional)

**Objective**: Verify that components work together correctly.

**Implementation Details**:
- Set up Playwright for E2E testing
- Test critical user flows:
  - Complete a full daily game
  - Complete a freeplay game
  - Use undo functionality
  - Share results
  - View statistics
- Test edge cases:
  - Network errors during game
  - Invalid puzzle data
  - Browser refresh mid-game
- Run in CI on pull requests

**Why This Matters**: Integration tests catch issues that unit tests miss, especially around user workflows.

### 10.3 Manual Testing Checklist

**Objective**: Catch UX issues and browser-specific bugs.

**Implementation Details**:
- Create testing checklist:
  - **Browsers**: Chrome, Firefox, Safari, Edge
  - **Devices**: Mobile (iOS/Android), Tablet, Desktop
  - **Screen sizes**: 320px, 768px, 1024px, 1920px
  - **Network**: Slow 3G, Fast 4G, WiFi
  - **Accessibility**: Keyboard-only, screen reader (NVDA/JAWS)
  - **Edge cases**: Empty cache, midnight rollover, different timezones
- Test daily puzzle consistency (same puzzle on different devices)
- Test share functionality on different platforms
- Visual regression testing (screenshots)

**Why This Matters**: Automated tests can't catch everything. Manual testing reveals UX issues and browser-specific bugs.

---

## Phase 11: Launch Preparation

### 11.1 Pre-Launch Checklist

**Objective**: Ensure everything is ready for public launch.

**Checklist**:
- [ ] 365 daily puzzles pre-generated and tested
- [ ] All core features working (daily, freeplay, stats, share)
- [ ] Tutorial complete and clear
- [ ] Tested on major browsers and devices
- [ ] Accessibility audit complete
- [ ] Performance optimized (Lighthouse score >90)
- [ ] Error handling tested
- [ ] Analytics configured
- [ ] Custom domain configured (if applicable)
- [ ] Social media preview cards working
- [ ] README updated with project info
- [ ] License added
- [ ] Privacy policy (if collecting any data)

**Why This Matters**: A smooth launch creates a good first impression and prevents early user frustration.

### 11.2 Soft Launch & Testing

**Objective**: Test with real users before full public launch.

**Implementation Details**:
- Soft launch to small group:
  - Friends/family
  - Small community (Discord, subreddit)
  - Beta testers
- Gather feedback:
  - Is the tutorial clear?
  - Are puzzles too hard/easy?
  - Any confusing UI elements?
  - Any bugs or errors?
- Iterate based on feedback
- Fix critical issues before public launch

**Why This Matters**: Real users find issues that developers miss. Soft launch allows fixing problems before wider audience.

### 11.3 Launch Strategy

**Objective**: Get initial users and build momentum.

**Ideas**:
- Post to relevant communities:
  - /r/WebGames
  - /r/Anime
  - Hacker News Show HN
  - Product Hunt
- Social media:
  - Twitter/X with gameplay GIF
  - Anime Discord servers
- Content:
  - Write blog post about development
  - Create demo video
  - Explain the game concept clearly
- SEO:
  - Meta tags for social sharing
  - Descriptive title and description
  - Sitemap.xml
  - robots.txt

**Why This Matters**: Even great products need visibility. Strategic launch gets initial users who can provide feedback and share.

---

## Phase 12: Post-Launch Iteration

### 12.1 Monitor & Respond

**Objective**: Track performance and user feedback after launch.

**Actions**:
- Monitor analytics daily (first week)
- Watch for error spikes
- Read user feedback/comments
- Track completion rates
- Identify drop-off points
- Quick bug fixes as needed

### 12.2 Future Feature Ideas

**Potential Additions** (prioritize based on user feedback):
- **Hint system**: Show one seiyuu/anime in the path (costs penalty)
- **Hard mode**: Time limit or move limit
- **Leaderboards**: Fastest completion, fewest moves (requires backend)
- **Custom puzzles**: Users create and share puzzles
- **Themed weeks**: All puzzles from same anime season or genre
- **Achievements**: Badges for streaks, perfect scores, etc.
- **Character mode**: Connect character → anime → character
- **Multiplayer**: Race to solve same puzzle
- **User accounts**: Cross-device sync (requires backend)
- **Multiple languages**: i18n support
- **Dark theme variants**: Different color schemes
- **Sound effects**: Optional audio feedback
- **Alternative layouts**: Horizontal chain option

### 12.3 Maintenance Plan

**Ongoing Tasks**:
- Generate new daily puzzles quarterly
- Update puzzle pool with new popular anime
- Update dependencies monthly
- Monitor Jikan API changes
- Fix bugs as reported
- Performance optimization based on real-world data
- Accessibility improvements
- Content moderation (if user-generated content added)

---

## Implementation Priority

### Minimum Viable Product (MVP) - Phase 1
1. **Phase 1**: Data Layer & API Integration
2. **Phase 2**: Game Logic & State Management
3. **Phase 5.1, 5.2, 5.3**: Core UI (GameBoard, SelectionList, GameControls)
4. **Phase 6.1**: Home Page (Daily Mode)
5. **Phase 3**: Daily Puzzle System
6. **Phase 9**: Deployment

**Goal**: Playable daily puzzle game with basic UI.

### Version 1.0 - Phase 2
7. **Phase 4**: Freeplay Mode
8. **Phase 5.4, 5.5**: Completion Screen, Stats Panel
9. **Phase 7.1**: Share Functionality
10. **Phase 5.6**: Tutorial
11. **Phase 7.3**: Accessibility Features
12. **Phase 8**: Performance Optimization

**Goal**: Full-featured game with polish.

### Version 1.1+ - Phase 3
13. **Phase 6.3**: Archive Mode
14. **Phase 7.2**: Settings & Preferences
15. **Phase 7.4**: Enhanced Error Handling
16. **Phase 10**: Comprehensive Testing
17. **Phase 12**: Future Features (based on feedback)

**Goal**: Enhanced features and polish based on user feedback.

---

## Success Criteria

### Launch Success
- ✅ Daily puzzles work consistently for all users
- ✅ Players can complete games in both modes
- ✅ Game state persists across sessions
- ✅ Share functionality generates clean summaries
- ✅ Responsive on mobile and desktop
- ✅ Accessible via keyboard and screen reader
- ✅ Lighthouse score >90
- ✅ Zero critical bugs

### Engagement Success (30 days post-launch)
- 1000+ unique players
- 50%+ daily puzzle completion rate
- 10%+ share rate
- 3+ average sessions per user
- 60%+ 7-day retention

### Technical Success
- <2s initial load time
- <500ms API response time (from Jikan)
- <1% error rate
- Works offline with cached data
- Supports all modern browsers

---

## Resources & References

### Tools & Libraries
- **SvelteKit**: https://kit.svelte.dev/
- **Jikan API**: https://jikan.moe/
- **jikan4.js**: https://github.com/rizzzigit/jikan4.js
- **MyAnimeList**: https://myanimelist.net/
- **Vite**: https://vitejs.dev/
- **TypeScript**: https://www.typescriptlang.org/

### Design Inspiration
- Wordle: Clean, minimal daily puzzle format
- Connections: Visual grid selection
- Anime games: MyAnimeList interface patterns

### Similar Projects
- Six Degrees of Wikipedia
- Wordle and spinoffs
- Anime quiz games

---

## Appendix: File Structure

```
seiyuu/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── mal.ts                  # Jikan API client
│   │   ├── cache/
│   │   │   └── index.ts                # Caching utilities
│   │   ├── components/
│   │   │   ├── GameBoard.svelte        # Chain visualization
│   │   │   ├── SelectionList.svelte    # Anime/seiyuu selection
│   │   │   ├── GameControls.svelte     # Undo/reset/etc
│   │   │   ├── CompletionScreen.svelte # Victory screen
│   │   │   ├── StatsPanel.svelte       # Statistics modal
│   │   │   ├── Tutorial.svelte         # How to play
│   │   │   └── Settings.svelte         # User preferences
│   │   ├── game/
│   │   │   ├── engine.ts               # Core game logic
│   │   │   ├── utils.ts                # Helper functions
│   │   │   └── share.ts                # Share functionality
│   │   ├── puzzles/
│   │   │   ├── daily.ts                # Daily puzzle loader
│   │   │   └── random.ts               # Freeplay generator
│   │   ├── storage/
│   │   │   └── index.ts                # localStorage wrapper
│   │   ├── stores/
│   │   │   ├── gameState.ts            # Game state store
│   │   │   └── userProgress.ts         # Stats/progress store
│   │   └── types/
│   │       ├── mal.ts                  # MAL API types
│   │       └── game.ts                 # Game data types
│   ├── routes/
│   │   ├── +layout.svelte              # App layout/nav
│   │   ├── +page.svelte                # Home (daily mode)
│   │   ├── freeplay/
│   │   │   └── +page.svelte            # Freeplay mode
│   │   └── archive/
│   │       └── +page.svelte            # Historical puzzles
│   └── app.html                        # HTML template
├── static/
│   ├── data/
│   │   ├── daily-puzzles.json          # Pre-generated dailies
│   │   └── puzzle-pool.json            # Curated anime list
│   └── favicon.png
├── scripts/
│   └── generate-daily-puzzles.ts       # Puzzle generation tool
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Notes

- All dates in UTC to avoid timezone issues
- Puzzle numbers start from project launch date
- Jikan API has rate limiting (handled by jikan4.js wrapper)
- Cache aggressively to minimize API calls
- No user accounts needed initially (localStorage is sufficient)
- Focus on mobile-first design (many anime fans on mobile)
- Keep bundle size small (<500KB initial load)
- Progressive enhancement (works without JS for basic content)

---

*This roadmap is a living document. Update as priorities shift and new requirements emerge.*