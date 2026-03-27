# Refactor Plan — Volleyball Score Tracker

Tracks all planned architectural and code quality improvements.
Each phase should be completed and tested before starting the next.

---

## Phase 1 — Folder restructure *(non-breaking)*

Move files to the target structure. No logic changes — only relocations and import path updates.

### Target structure
```
src/
├── app/                           # Bootstrap: App.tsx, providers, main.tsx
├── domain/                        # Pure TypeScript — zero React, zero I/O
│   ├── match/                     # rules.ts, stats.ts, defaults.ts
│   ├── rally/                     # actionHandlers.ts
│   └── automation/                # sequences.ts
├── features/
│   ├── pre-match/
│   ├── match/
│   ├── controls/
│   └── settings/
├── services/
│   ├── socket/                    # SocketContext.tsx, useBroadcast.ts (Phase 6)
│   └── session/                   # sessionStorage.ts (Phase 9), useSession.ts (Phase 5)
├── contexts/                      # AutomationContext.tsx + new contexts (Phase 5)
├── hooks/                         # useMatchManager.ts, useAutomationRunner.ts
├── shared/
│   ├── components/
│   └── utils/
└── types/
```

- [x] Move app files (main.tsx, App.tsx, App.css) → src/app/
- [x] Move automation/sequences.ts → src/domain/automation/sequences.ts
- [x] Move pre-match components → src/features/pre-match/
- [x] Move match components → src/features/match/
- [x] Move controls components → src/features/controls/
- [x] Move settings component → src/features/settings/
- [x] Move SocketContext.tsx → src/services/socket/
- [x] Move shared components → src/shared/components/
- [x] Move utils + badges.ts → src/shared/utils/
- [x] Update index.html entry point
- [x] Fix all import paths

---

## Phase 2 — Extract domain layer + design reversible history model

Pull all pure business logic out of hooks into `domain/`. Nothing in this layer may import React or reference I/O.

- [x] Extract `checkSetEnd`, `checkMatchEnd` → `domain/match/rules.ts`
- [x] Extract `calculateComputedStats`, `mergeStats`, `calculateUpdatedStatistics` → `domain/match/stats.ts`
- [x] Move `initialMatchData`, `initialMatchDetails`, `initialConfig` → `domain/match/defaults.ts`
- [x] Create rally action handler map with do/undo pairs → `domain/rally/actionHandlers.ts`
- [x] **Design and implement reversible `HistoryEntry`** — each entry must carry enough data to reverse the action:
  - Confirmed rally entries store full `RallyState` at confirmation
  - Timeout/substitution entries store team + counter delta
  - Set-end entries store previous scores, stats, and history snapshot
- [x] Update `useMatchManager` and `useRallyManager` to import from domain (thin React wrappers)
- [x] Ensure all domain functions are covered by unit tests

---

## Phase 3 — Define the event model

Replace `matchEvent` embedded in `MatchData` with a proper discriminated union and callback.

- [x] Define `MatchDomainEvent` discriminated union: `RallyEndedEvent`, `TimeoutCalledEvent`, `SubstitutionCalledEvent`, `SetEndedEvent`, `MatchEndedEvent`, `MatchStartedEvent`, `MatchResetEvent`
- [x] Remove `matchEvent`, `matchEventRef`, `getLastAction`, `clearLastAction`, `clearMatchEvent` from `useMatchManager` and `MatchData`
- [x] `useMatchManager` accepts `onEvent?: (event: MatchDomainEvent) => void` callback
- [x] `Match.tsx` uses events to drive socket emission and rally reset instead of watching `lastAction` ref
- [x] Update types/index.ts

---

## Phase 4 — Absorb rally manager into match manager

`useRallyManager` ceases to exist as a standalone hook.

- [x] Move rally logic inside `useMatchManager` using `domain/rally/actionHandlers.ts`
- [x] Expose `rally` sub-object on match manager: `{ stage, possession, stats, actionHistory, canUndo }`
- [x] Expose rally actions on match manager: `handleAction`, `undoLastAction`, `discardRally`
- [x] On `endRally`, internally finalise stats, archive full `RallySnapshot` into history entry, reset rally
- [x] Remove `showConfirmation` and `showDiscardConfirmation` from `RallyState` — move to local state in `RallyControl.tsx`
- [x] Remove `useRallyManager.ts`
- [x] Remove manual wiring in `Match.tsx` (passing `updateBallPossession`, syncing `currentServer`)

---

## Phase 5 — State contexts

Move all shared state out of `App.tsx` into dedicated contexts.

- [x] Create `MatchContext` — owns `useMatchManager` (source of truth for match state); exposes `matchData`, `matchDetails`, `setMatchDetails`, all match actions
- [x] Create `ConfigContext` — owns `config` and `setConfig`
- [x] Create `PreferencesContext` — owns `noStats` + future user preferences; persisted via cookies
- [x] Extract session restore dialog + localStorage logic → `services/session/useSession.ts`
- [x] Create `app/providers.tsx` composing all providers
- [x] `App.tsx` reduced to provider wrapper + tab layout with no state of its own

---

## Phase 6 — Unified broadcast layer

Single hook owns all overlay emissions.

- [x] Create `services/socket/useBroadcast.ts`
- [x] Move `matchData` payload shaping logic (currently in `Match.tsx`) into `useBroadcast`
- [x] Emit `matchData` in response to `MatchDomainEvent`s (not on every render)
- [x] Emit `updateConfig` whenever config changes
- [x] Expose `syncAll()` — emits all current state at once; called on session restore and overlay reconnect
- [x] Remove direct `socket.emit` calls from `Match.tsx` and `Controls.tsx`
- [x] Remove `Socket` parameter from `useAutomationRunner` (Phase 7 dependency)

---

## Phase 7 — Decouple automation

Automation reacts to match events directly, not via socket intercept.

- [x] `AutomationContext` subscribes to `MatchDomainEvent`s directly via Phase 3 callback
- [x] Remove `onSocketEmit` from `SocketContext` entirely
- [x] `useAutomationRunner` no longer depends on `Socket` (completed in Phase 6; config changes propagate via `useBroadcast`)
- [x] `ALL_SEQUENCES` injected into `AutomationProvider` as a prop

---

## Phase 8 — Code quality and SOLID cleanups

- [x] Rally action registry already done via Phase 2/4 — verified, no switch/case blocks remain
- [x] Reassess `useMatchManager` size after Phase 4 — not warranted; hook is well-organized at ~410 lines
- [x] Remove `alert()` from match logic; `MatchEnded` event fires via `onEvent` callback
- [x] `badgeUtils` — accept `Badge[]` and Fuse options as parameters instead of module-level singleton
- [x] Unroll compressed undo code (now in `domain/rally/actionHandlers.ts`)
- [x] Move `ControlSection` inline component from `Controls.tsx` → `shared/components/`

---

## Phase 9 — Session versioning

- [x] Add `version: number` field to persisted payload (start at `1`)
- [x] Write `migrate(raw, fromVersion)` function for known shape changes
- [x] Graceful handling on load: migrate if possible, discard if not, never throw
- [x] Document schema version history in `services/session/sessionStorage.ts`

---

## Phase 10 — Stats split ✅

Separate stored raw statistics from computed display values. After this phase, `MatchData` stores only raw counters; effectiveness metrics are computed at the point of use.

- [x] Rename `TeamStats` → `RawTeamStats`, removing the five computed fields (`selfErrors`, `serviceEffectiveness`, `receptionEffectiveness`, `attackEffectiveness`, `defenseEffectiveness`)
- [x] Define `ComputedTeamStats = RawTeamStats & { selfErrors: number; serviceEffectiveness: string; receptionEffectiveness: string; attackEffectiveness: string; defenseEffectiveness: string }`
- [x] Export `computeEffectiveness(team: RawTeamStats, opp: RawTeamStats): ComputedTeamStats` from `domain/match/stats.ts` — single source of truth for all effectiveness formulas
- [x] `MatchData.statistics`, `MatchData.currentSetStats`, and `SetStats.statistics` store `TeamRecord<RawTeamStats>` only
- [x] Update `calculateUpdatedStatistics`, `mergeStats`, `createEmptyMatchStats` to work with `RawTeamStats`
- [x] Remove `calculateComputedStats` (replaced by `computeEffectiveness`)
- [x] `Statistics.tsx` calls `computeEffectiveness` at render time
- [x] `buildMatchPayload` in `useBroadcast` calls `computeEffectiveness` before building the payload; overlay always receives `ComputedTeamStats`
- [x] Define `OverlayPayload` interface; `buildMatchPayload` returns it — no more `any` type or `delete` calls
- [x] Update all tests that reference `TeamStats`

---

## Phase 11 — `matchPhase` enum + remove redundant fields ✅

Replace the ambiguous `matchStarted: boolean` combination with an explicit phase enum, and drop fields that duplicate data available elsewhere.

- [x] Add `matchPhase: 'pre-match' | 'in-progress' | 'between-sets' | 'ended'` to `MatchData`
- [x] Remove `matchStarted: boolean` from `MatchData`; keep `winner: TeamKey | null` (set only when `matchPhase === 'ended'`)
- [x] Update `useMatchManager`: `startMatch` → `'in-progress'`; `confirmSetEnd` (set end) → `'between-sets'`, then `setServer` → `'in-progress'`; match end → `'ended'`; `resetMatch` → `'pre-match'`
- [x] Replace all `match.matchStarted` reads in components with `match.matchPhase === 'in-progress'`
- [x] Remove the `!match.matchStarted && match.setStats.length > 0` "between-sets" hack from `useBroadcast`
- [x] Remove `ballPossession: TeamKey | null` from `MatchData`; components that need it read `rally.possession` directly
- [x] Remove the `useEffect` that syncs `rally.possession → match.ballPossession` in `useMatchManager`
- [x] Remove `setScores: MatchScores[]` from `MatchData`; derive as `setStats.map(s => s.scores)` where needed
- [x] Remove `index: number` from `BaseHistoryEntry` (redundant with array position); update all writers

---

## Phase 12 — Unified history ✅

Replace the split `currentSetHistory` / `setStats[n].history` with a single `match.history[]` array that spans the entire match. Adds the two entry types needed for full undo coverage and lays the groundwork for Phase 13.

- [x] Add `history: HistoryEntry[]` to `MatchData` — never cleared mid-match
- [x] Remove `currentSetHistory: HistoryEntry[]` from `MatchData`
- [x] Add `setNumber: number` to `BaseHistoryEntry` — the set number when the entry was created; replaces per-set array split as the filter key
- [x] Add `SetEndHistoryEntry` to the `HistoryEntry` union:
  ```ts
  interface SetEndHistoryEntry extends BaseHistoryEntry {
    entryType: 'set-end';
    prevScores: MatchScores;
    prevSetsWon: MatchScores;
    prevSetStats: TeamRecord<RawTeamStats>;
    prevServer: TeamKey | null;
    prevTimeouts: MatchScores;
    prevSubstitutions: MatchScores;
  }
  ```
- [x] Add `SetsWonAdjustHistoryEntry` to the `HistoryEntry` union:
  ```ts
  interface SetsWonAdjustHistoryEntry extends BaseHistoryEntry {
    entryType: 'sets-won-adjust';
    team: TeamKey;
    prevSetsWon: number;
    newSetsWon: number;
  }
  ```
- [x] Add `prevServer: TeamKey | null` to `AdjustHistoryEntry`
- [x] Update all six action writers in `useMatchManager`:
  - `endRally` — writes `RallyHistoryEntry` (with `setNumber`) to `match.history`
  - `handleGameEnd` — writes `SetEndHistoryEntry` capturing pre-transition state, then transitions (`setsWon++`, scores reset, `matchPhase: 'between-sets'`)
  - `callTimeout` — writes `TimeoutHistoryEntry` with `setNumber`
  - `callSubstitution` — writes `SubstitutionHistoryEntry` with `setNumber`
  - `adjustScore` — writes `AdjustHistoryEntry` with `setNumber` and `prevServer`
  - `updateSetsWon` — writes `SetsWonAdjustHistoryEntry` with `setNumber`
- [x] Remove `history: HistoryEntry[]` from `SetStats`
- [x] Update `StatsHandler` to filter `match.history` by `setNumber` for per-set history display
- [x] Add `{ type: 'HistoryUndone' }` to `MatchDomainEvent`

---

## Phase 13 — Undo ✅

Implement `undoLastHistoryEntry` and expose a single undo button in the UI.

- [x] Add `undoLastHistoryEntry()` to `useMatchManager` — pops the last entry from `match.history` and dispatches to a typed undo handler:
  - `'rally'`: restore `scores`, `statistics`, `currentSetStats`, `currentServer`; restore `rally` from `entry.rallySnapshot`
  - `'timeout'`: decrement `timeouts[entry.team]`
  - `'substitution'`: decrement `substitutions[entry.team]`
  - `'adjust'`: reverse `entry.delta` on `scores`; restore `currentServer` from `entry.prevServer`
  - `'set-end'`: restore `scores`, `setsWon`, `currentSetStats`, `currentServer`, `timeouts`, `substitutions` from `entry.prev*` fields; pop the archived set from `setStats`; set `matchPhase: 'in-progress'`
  - `'sets-won-adjust'`: restore `setsWon[entry.team]` to `entry.prevSetsWon`; also clears `winner`/restores `matchPhase` if the adjust had ended the match
  - All branches: fire `HistoryUndone` via `onEvent`
- [x] Add `canUndoHistory: boolean` to return value — `true` when `match.history.length > 0`
- [x] Add `isSetBoundaryUndo: boolean` to return value — `true` when the last entry has `entryType === 'set-end'`
- [x] Add unit tests for `undoLastHistoryEntry` — one test per `entryType`, including set-boundary restore and match-end restore for `sets-won-adjust` (`domain/match/__tests__/undo.test.ts`)
- [x] Add a single unified undo button (in `MatchHeader`):
  - Visible only when `match.matchPhase === 'in-progress'`; enabled when `canUndoHistory && rally.stage === 'start'`
  - Calls `undoLastHistoryEntry()` directly when `!isSetBoundaryUndo`
  - Shows a confirmation dialog when `isSetBoundaryUndo`, warning that the set transition will be reversed
- [x] The existing per-rally undo button in `RallyControl.tsx` (`undoLastAction`) is unchanged — it handles mid-rally action undos; the new button handles confirmed history undos
- [x] Undo logic extracted into `domain/match/undo.ts` (`applyHistoryUndo`) — pure function, fully tested without React; `reverseStats` added to `domain/match/stats.ts`

---

## Phase 14 — Session schema v2

Migrate persisted sessions from schema v1 (split history, computed stats, `matchStarted`) to v2 (unified history, raw stats, `matchPhase`).

- [ ] Bump session schema `version` to `2`
- [ ] Write `migrate(raw, fromVersion)` for v1 → v2:
  - Merge `currentSetHistory` (tagged as current set) and `setStats[n].history` entries (tagged with their set number) into a flat `history[]`
  - Strip `index` from all history entries
  - Drop `ballPossession`, `setScores`
  - Convert `matchStarted: boolean` + `winner` → `matchPhase`
  - Strip effectiveness fields from all stored stats objects — keep only `RawTeamStats`
- [ ] Document schema v2 in `services/session/sessionStorage.ts`
- [ ] Unit test for migration v1 → v2

---

## Dependency graph

```
Phase 1 (folder restructure)
    └─► Phase 2 (domain layer + reversible history design)
            ├─► Phase 3 (event model)
            │       ├─► Phase 4 (absorb rally into match manager)
            │       │       └─► Phase 5 (state contexts)
            │       │                   └─► Phase 9 (session versioning)
            │       └─► Phase 6 (broadcast layer)
            │               └─► Phase 7 (automation decoupling)
            │                       └─► Phase 8 (code quality)
            └─► Phase 10 (stats split)
                    └─► Phase 11 (matchPhase + remove redundant fields)
                            └─► Phase 12 (unified history)
                                    └─► Phase 13 (undo)
                                            └─► Phase 14 (session schema v2)
```
