# Mobile App — Project Organisation

> **Stack:** Expo (SDK 54) · Expo Router (file-based routing) · NativeWind · Clerk (auth) · Zustand (state) · TypeScript

---

## Directory Tree

```text
apps/mobile/
│
├── app/                          # Expo Router pages (file = route)
│   ├── _layout.tsx               # Root layout — providers (Clerk, Theme, Portal)
│   ├── +html.tsx                 # Custom HTML shell for web target
│   ├── +not-found.tsx            # 404 / unmatched route screen
│   │
│   ├── (onboarding)/             # Onboarding flow (shown once after first sign-up)
│   │   ├── _layout.tsx           # Onboarding stack layout (no header, progress bar)
│   │   ├── welcome.tsx           # Step 1 — Welcome / value proposition
│   │   ├── interests.tsx         # Step 2 — Pick audiobook genres / interests
│   │   ├── listening-habits.tsx  # Step 3 — How often do you listen?
│   │   ├── notifications.tsx     # Step 4 — Enable push notifications
│   │   └── complete.tsx          # Step 5 — All done, enter the app
│   │
│   ├── (auth)/                   # Auth flow (unauthenticated users only)
│   │   ├── sign-in.tsx           # Sign-in screen
│   │   ├── forgot-password.tsx   # Forgot password entry
│   │   ├── reset-password.tsx    # Reset password (with OTP)
│   │   └── sign-up/
│   │       ├── _layout.tsx       # Sign-up stack layout
│   │       ├── index.tsx         # Sign-up form
│   │       └── verify-email.tsx  # Email verification OTP
│   │
│   ├── (tabs)/                   # Main app — bottom tab navigator (authenticated users)
│   │   ├── _layout.tsx           # Tab bar layout — defines all tab screens
│   │   │
│   │   ├── home/                 # Home tab
│   │   │   ├── _layout.tsx       # Home stack layout
│   │   │   └── index.tsx         # Home feed — featured & recommended audiobooks
│   │   │
│   │   ├── library/              # My Library tab
│   │   │   ├── _layout.tsx       # Library stack layout
│   │   │   ├── index.tsx         # Library list — downloaded & saved books
│   │   │   └── [bookId].tsx      # Single book detail inside library
│   │   │
│   │   ├── explore/              # Explore / Discover tab
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Browse by category, trending
│   │   │   ├── search.tsx        # Full-text search results
│   │   │   └── category/
│   │   │       └── [slug].tsx    # Category listing page
│   │   │
│   │   └── profile/              # Profile tab
│   │       ├── _layout.tsx
│   │       ├── index.tsx         # User profile overview
│   │       ├── settings.tsx      # App settings (notifications, playback speed…)
│   │       └── account.tsx       # Account management (email, password, delete)
│   │
│   ├── player/                   # Full-screen audiobook player (modal over tabs)
│   │   ├── _layout.tsx           # Player modal layout
│   │   └── [bookId].tsx          # Player screen for a specific book
│   │
│   └── audiobook/                # Audiobook detail screens (pushed from any tab)
│       ├── _layout.tsx
│       └── [bookId].tsx          # Book detail — description, chapters, reviews
│
├── api/                          # API client and all API call functions
│   ├── client.ts                 # Axios / fetch base instance (base URL, interceptors, auth headers)
│   ├── auth.ts                   # Auth endpoints (login, register, refresh token)
│   ├── audiobooks.ts             # Audiobook CRUD (list, get, search, recommendations)
│   ├── library.ts                # User library (save, remove, list saved books)
│   ├── player.ts                 # Playback progress (sync position, bookmarks)
│   ├── profile.ts                # User profile (get, update)
│   └── categories.ts             # Genre / category listing
│
├── components/                   # All UI components
│   │
│   ├── shared/                   # Shared across all features (true cross-cutting UI)
│   │   ├── error-boundary.tsx    # Top-level error boundary
│   │   ├── loading-screen.tsx    # Full-screen loading spinner
│   │   ├── empty-state.tsx       # Empty list / no results illustration
│   │   ├── screen-header.tsx     # Reusable screen header with back button
│   │   └── safe-scroll-view.tsx  # ScrollView pre-wired with safe area
│   │
│   ├── ui/                       # Primitive design-system components (NativeWind / rn-primitives)
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── hover-card.tsx
│   │   ├── icon.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── native-only-animated-view.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── text.tsx
│   │   ├── textarea.tsx
│   │   ├── toggle.tsx
│   │   └── toggle-group.tsx
│   │
│   ├── onboarding/               # Components used only inside the onboarding flow
│   │   ├── progress-bar.tsx      # Step progress indicator
│   │   ├── step-container.tsx    # Shared slide/step wrapper with title & CTA
│   │   ├── genre-chip.tsx        # Selectable genre pill for interests step
│   │   └── habit-option-card.tsx # Option card for listening habits step
│   │
│   ├── auth/                     # Auth-specific form components
│   │   ├── sign-in-form.tsx      # (moved from components/)
│   │   ├── sign-up-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   ├── reset-password-form.tsx
│   │   ├── verify-email-form.tsx
│   │   └── social-connections.tsx  # OAuth buttons (Google, Apple…)
│   │
│   ├── home/                     # Components for the Home tab
│   │   ├── featured-banner.tsx   # Hero carousel of featured audiobooks
│   │   ├── section-header.tsx    # "Continue listening", "Recommended" row header
│   │   ├── audiobook-row.tsx     # Horizontal scrolling list of book cards
│   │   └── continue-card.tsx     # Resume-listening card with progress bar
│   │
│   ├── library/                  # Components for the Library tab
│   │   ├── library-list.tsx      # FlatList of saved/downloaded books
│   │   ├── library-book-card.tsx # Single book row with download status
│   │   └── filter-bar.tsx        # Filter chips (All / Downloaded / In Progress)
│   │
│   ├── explore/                  # Components for the Explore tab
│   │   ├── category-grid.tsx     # Grid of genre cards
│   │   ├── category-card.tsx     # Single genre card with cover image
│   │   ├── search-bar.tsx        # Animated search input
│   │   └── search-result-item.tsx
│   │
│   ├── audiobook/                # Audiobook detail components
│   │   ├── book-cover.tsx        # Cover image with shadow
│   │   ├── book-meta.tsx         # Author, narrator, duration, rating
│   │   ├── chapter-list.tsx      # Scrollable chapter list
│   │   ├── chapter-item.tsx      # Single chapter row
│   │   └── review-card.tsx       # User review tile
│   │
│   ├── player/                   # Full-screen player components
│   │   ├── player-cover.tsx      # Large rotating cover art
│   │   ├── player-controls.tsx   # Play/Pause, Skip 15s, Previous chapter
│   │   ├── player-progress.tsx   # Seekable progress slider
│   │   ├── player-speed.tsx      # Playback speed selector (0.5×–3×)
│   │   ├── player-sleep-timer.tsx# Sleep timer picker
│   │   └── mini-player.tsx       # Collapsed mini player shown above tab bar
│   │
│   └── profile/                  # Profile & settings components
│       ├── user-menu.tsx         # (moved from components/)
│       ├── stats-card.tsx        # Hours listened, books completed
│       ├── settings-row.tsx      # Single settings list row
│       └── avatar-picker.tsx     # Avatar / profile picture selector
│
├── constants/                    # App-wide static configuration
│   ├── api.ts                    # API base URL, timeout, version prefix
│   ├── theme.ts                  # Design token values (colours, spacing, radius)
│   │                             #   — currently lives in lib/theme.ts, move here
│   ├── routes.ts                 # Typed route name constants matching Expo Router paths
│   ├── storage-keys.ts           # AsyncStorage / SecureStore key strings
│   └── config.ts                 # Feature flags, pagination size, player defaults
│
├── context/                      # React context for truly global cross-screen state
│   ├── auth-context.tsx          # Clerk session wrapper (already via ClerkProvider)
│   ├── theme-context.tsx         # Active colour scheme + toggle (wraps nativewind)
│   └── player-context.tsx        # Currently playing book ref, mini-player visibility
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Thin wrapper: isSignedIn, user, signOut
│   ├── use-theme.ts              # Colour scheme + toggle helper
│   ├── use-audiobook.ts          # Fetch single audiobook detail (with SWR / React Query)
│   ├── use-library.ts            # Fetch user library, save/remove helpers
│   ├── use-player.ts             # Expose player context + controls
│   ├── use-search.ts             # Debounced search hook
│   └── use-safe-area-padding.ts  # Bottom tab bar + safe area combined padding
│
├── state/                        # Zustand stores (client-side state)
│   ├── player-store.ts           # Playback position, speed, sleep timer, queue
│   ├── library-store.ts          # Locally cached library list, download statuses
│   ├── onboarding-store.ts       # Onboarding step completion, selected interests
│   ├── search-store.ts           # Recent searches, current query
│   └── ui-store.ts               # Global UI state (bottom sheet open, toast queue)
│
├── types/                        # TypeScript type & interface definitions
│   ├── api.ts                    # Raw API response shapes (DTOs)
│   ├── audiobook.ts              # Audiobook, Chapter, Author, Narrator types
│   ├── user.ts                   # User profile type
│   ├── player.ts                 # PlaybackState, QueueItem, SpeedOption types
│   ├── library.ts                # LibraryItem, DownloadStatus types
│   ├── navigation.ts             # Typed route params (extends Expo Router types)
│   └── common.ts                 # Shared utility types (Paginated<T>, ApiError, etc.)
│
├── lib/                          # Low-level utilities (keep thin)
│   ├── utils.ts                  # cn() — className merge helper
│   └── theme.ts                  # → migrate to constants/theme.ts in future
│
├── assets/                       # Static assets
│   └── images/
│       ├── icon.png
│       ├── splash.png
│       ├── adaptive-icon.png
│       ├── favicon.png
│       ├── react-native-reusables-light.png
│       ├── react-native-reusables-dark.png
│       ├── clerk-logo-light.png
│       └── clerk-logo-dark.png
│
├── global.css                    # NativeWind Tailwind base styles
├── tailwind.config.js            # Tailwind / NativeWind config
├── metro.config.js               # Metro bundler — monorepo-aware config
├── babel.config.js               # Babel — NativeWind JSX transform
├── app.json                      # Expo app config
├── tsconfig.json                 # TypeScript config (extends expo/tsconfig.base)
├── expo-env.d.ts                 # Expo ambient types (auto-generated)
└── nativewind-env.d.ts           # NativeWind className ambient types
```

---

## Folder Responsibilities

### `app/` — Pages (Expo Router)

| Folder / File | Purpose |
|---|---|
| `_layout.tsx` | Root layout. Wraps the whole app with `ClerkProvider`, `ThemeProvider`, `PortalHost`. Guards routes by auth state. |
| `(onboarding)/` | First-launch flow. Shown once after sign-up. Gatekept by `onboarding-store` completion flag. |
| `(auth)/` | Unauthenticated-only screens. Protected by `Stack.Protected guard={!isSignedIn}`. |
| `(tabs)/` | Main authenticated app. Bottom tab bar with Home, Library, Explore, Profile. |
| `player/[bookId].tsx` | Full-screen player modal. Presented as a modal over tabs so it is accessible from any tab. |
| `audiobook/[bookId].tsx` | Book detail page. Navigated to from Home, Library, Explore — all share the same screen. |

**Rule:** Pages are thin. They compose components, call hooks, and connect to stores. No business logic or JSX layout complexity lives directly in a page file.

---

### `api/` — API Client & Functions

| File | Contents |
|---|---|
| `client.ts` | Configured Axios instance. Sets `baseURL` from `constants/api.ts`, attaches Clerk JWT via request interceptor, handles 401 refresh. |
| `auth.ts` | `loginWithEmail()`, `registerWithEmail()` — called by Clerk custom flows if needed. |
| `audiobooks.ts` | `getAudiobooks()`, `getAudiobook(id)`, `searchAudiobooks(query)`, `getRecommended()` |
| `library.ts` | `getUserLibrary()`, `addToLibrary(bookId)`, `removeFromLibrary(bookId)` |
| `player.ts` | `syncProgress(bookId, position)`, `getProgress(bookId)`, `addBookmark()` |
| `categories.ts` | `getCategories()`, `getCategoryBooks(slug)` |

---

### `components/` — UI Components

| Subfolder | What goes here |
|---|---|
| `ui/` | Stateless design-system primitives (buttons, inputs, cards, etc.). These have **no business logic** and **no API calls**. |
| `shared/` | Cross-feature layout helpers used by 3+ features (error boundaries, loading screens, empty states). |
| `onboarding/` | Components only used inside the onboarding flow. |
| `auth/` | Auth form components (sign-in, sign-up, OTP verify, social OAuth buttons). |
| `home/` | Home feed-specific components (featured banner, book rows). |
| `library/` | Library list components, download status indicators. |
| `explore/` | Category grid, search bar, search results. |
| `audiobook/` | Book detail UI (cover, meta, chapters, reviews). |
| `player/` | Full player UI (controls, progress slider, speed picker) and mini-player. |
| `profile/` | Profile stats, settings rows, avatar picker, user menu. |

**Rule:** A component folder matches the `app/` folder it primarily serves. Anything used by 2+ features moves to `shared/`. Primitives with no feature knowledge stay in `ui/`.

---

### `constants/` — Static Configuration

| File | Contents |
|---|---|
| `api.ts` | `API_BASE_URL`, `API_TIMEOUT_MS`, `API_VERSION` |
| `theme.ts` | Design tokens: colour palette, spacing scale, border radius, font sizes |
| `routes.ts` | Typed constants for every Expo Router path (e.g. `ROUTES.PLAYER = '/player'`) |
| `storage-keys.ts` | `STORAGE.ONBOARDING_COMPLETE`, `STORAGE.AUTH_TOKEN`, etc. |
| `config.ts` | Feature flags (`FEATURE_SLEEP_TIMER`), pagination page size, default playback speed |

**Rule:** Nothing in `constants/` imports from any other app folder. No functions, no hooks, no React.

---

### `context/` — React Context

Use context **only** when state must be available to a deep component tree without prop drilling AND when Zustand is not appropriate (e.g. React lifecycle–dependent state).

| File | Purpose |
|---|---|
| `auth-context.tsx` | Re-exports Clerk's context with a typed helper hook (`useAuthContext`). Single source of truth for auth state. |
| `theme-context.tsx` | Exposes `colorScheme` and `toggleColorScheme` from NativeWind everywhere in the tree. |
| `player-context.tsx` | Holds a ref to the currently loaded player (Expo AV / Track Player instance) and mini-player visibility flag. Not suitable for Zustand because it wraps a non-serialisable native object. |

**Rule:** Context is for non-serialisable or lifecycle-dependent values. Serialisable UI state (loading flags, selections, lists) goes to `state/` (Zustand).

---

### `hooks/` — Custom React Hooks

| File | Purpose |
|---|---|
| `use-auth.ts` | `useAuth()` — exposes `{ user, isSignedIn, signOut }` from Clerk context |
| `use-theme.ts` | `useTheme()` — exposes `{ colorScheme, toggleColorScheme, colors }` |
| `use-audiobook.ts` | `useAudiobook(id)` — fetches + caches audiobook detail |
| `use-library.ts` | `useLibrary()` — fetches user library, exposes `save()` / `remove()` |
| `use-player.ts` | `usePlayer()` — exposes player controls and current playback state from context + store |
| `use-search.ts` | `useSearch()` — debounced query, calls `api/audiobooks.ts`, manages loading state |
| `use-safe-area-padding.ts` | Returns bottom padding accounting for safe area + tab bar height |

**Rule:** Hooks compose context, stores, and API calls. They return only what the component needs. No JSX inside hooks.

---

### `state/` — Zustand Stores

| File | Store contents |
|---|---|
| `player-store.ts` | `currentBookId`, `currentChapterId`, `position`, `speed`, `isPlaying`, `sleepTimerEnd`, `queue` |
| `library-store.ts` | `items: LibraryItem[]`, `downloadStatuses: Record<string, DownloadStatus>`, `lastSynced` |
| `onboarding-store.ts` | `isComplete`, `currentStep`, `selectedGenres`, `listeningHabit` — persisted via AsyncStorage |
| `search-store.ts` | `recentSearches: string[]`, `currentQuery`, `results` |
| `ui-store.ts` | `toastQueue`, `activeBottomSheet`, `isTabBarVisible` |

**Rule:** Stores hold serialisable state. Each store is a single file with one `create()` call and named actions. Stores never import from each other directly — if needed, compose in a hook.

---

### `types/` — TypeScript Types

| File | Types defined |
|---|---|
| `api.ts` | Raw DTO shapes returned by the API before transformation |
| `audiobook.ts` | `Audiobook`, `Chapter`, `Author`, `Narrator`, `Review` |
| `user.ts` | `UserProfile`, `UserPreferences` |
| `player.ts` | `PlaybackState`, `QueueItem`, `SpeedOption`, `SleepTimer` |
| `library.ts` | `LibraryItem`, `DownloadStatus` (enum), `DownloadProgress` |
| `navigation.ts` | Route param maps for typed `useLocalSearchParams` and `router.push` |
| `common.ts` | `Paginated<T>`, `ApiError`, `Nullable<T>`, `ID` (string alias) |

**Rule:** Types are pure TypeScript — no imports from React, no logic, no runtime code. All types consumed by components, hooks, stores, and API functions are defined here.

---

## Data Flow

```text
Screen (app/)
  └── calls Hook (hooks/)
        ├── reads/writes Store (state/)       ← for local UI & cached data
        ├── calls API function (api/)          ← for server data
        └── reads Context (context/)           ← for auth / player instance

Component (components/)
  └── receives props from Screen
        └── reads Store directly via hook if it needs live reactive data
```

---

## Key Rules Summary

1. **Pages are thin** — only compose components and call hooks.
2. **Components are dumb** — receive props, emit callbacks. No direct API calls.
3. **Hooks are the glue** — they bridge context, stores, and API.
4. **Zustand for everything serialisable** — loading state, lists, selections, playback state.
5. **Context only for non-serialisable / lifecycle state** — native player instance, Clerk session.
6. **`constants/` has zero imports** from the rest of the app.
7. **`types/` has zero runtime code** — only `interface`, `type`, and `enum`.
8. **`api/` functions are pure async functions** — no hooks, no React, just fetch/Axios calls.
