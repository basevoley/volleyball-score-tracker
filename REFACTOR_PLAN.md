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

- [ ] Extract `checkSetEnd`, `checkMatchEnd` → `domain/match/rules.ts`
- [ ] Extract `calculateComputedStats`, `mergeStats`, `calculateUpdatedStatistics` → `domain/match/stats.ts`
- [ ] Move `initialMatchData`, `initialMatchDetails`, `initialConfig` → `domain/match/defaults.ts`
- [ ] Create rally action handler map with do/undo pairs → `domain/rally/actionHandlers.ts`
- [ ] **Design and implement reversible `HistoryEntry`** — each entry must carry enough data to reverse the action:
  - Confirmed rally entries store full `RallyState` at confirmation
  - Timeout/substitution entries store team + counter delta
  - Set-end entries store previous scores, stats, and history snapshot
- [ ] Update `useMatchManager` and `useRallyManager` to import from domain (thin React wrappers)
- [ ] Ensure all domain functions are covered by unit tests

---

## Phase 3 — Define the event model

Replace `matchEvent` embedded in `MatchData` with a proper discriminated union and callback.

- [ ] Define `MatchDomainEvent` discriminated union: `RallyEndedEvent`, `TimeoutCalledEvent`, `SubstitutionCalledEvent`, `SetEndedEvent`, `MatchEndedEvent`, `MatchStartedEvent`, `MatchResetEvent`
- [ ] Remove `matchEvent`, `matchEventRef`, `getLastAction`, `clearLastAction`, `clearMatchEvent` from `useMatchManager` and `MatchData`
- [ ] `useMatchManager` accepts `onEvent?: (event: MatchDomainEvent) => void` callback
- [ ] `Match.tsx` uses events to drive socket emission and rally reset instead of watching `lastAction` ref
- [ ] Update types/index.ts

---

## Phase 4 — Absorb rally manager into match manager

`useRallyManager` ceases to exist as a standalone hook.

- [ ] Move rally logic inside `useMatchManager` using `domain/rally/actionHandlers.ts`
- [ ] Expose `rally` sub-object on match manager: `{ stage, possession, stats, actionHistory, canUndo }`
- [ ] Expose rally actions on match manager: `handleAction`, `undoLastAction`, `discardRally`
- [ ] On `endRally`, internally finalise stats, archive full `RallyState` into history entry, reset rally
- [ ] Remove `showConfirmation` and `showDiscardConfirmation` from `RallyState` — move to local state in `RallyControl.tsx`
- [ ] Remove `useRallyManager.ts`
- [ ] Remove manual wiring in `Match.tsx` (passing `updateBallPossession`, syncing `currentServer`)

---

## Phase 5 — State contexts

Move all shared state out of `App.tsx` into dedicated contexts.

- [ ] Create `MatchContext` — owns `useMatchManager` (source of truth for match state); exposes `matchData`, `matchDetails`, `setMatchDetails`, all match actions
- [ ] Create `ConfigContext` — owns `config` and `setConfig`
- [ ] Create `PreferencesContext` — owns `noStats` + future user preferences; persisted via cookies
- [ ] Extract session restore dialog + localStorage logic → `services/session/useSession.ts`
- [ ] Create `app/providers.tsx` composing all providers
- [ ] `App.tsx` reduced to provider wrapper + tab layout with no state of its own

---

## Phase 6 — Unified broadcast layer

Single hook owns all overlay emissions.

- [ ] Create `services/socket/useBroadcast.ts`
- [ ] Move `matchData` payload shaping logic (currently in `Match.tsx`) into `useBroadcast`
- [ ] Emit `matchData` in response to `MatchDomainEvent`s (not on every render)
- [ ] Emit `updateConfig` whenever config changes
- [ ] Expose `syncAll()` — emits all current state at once; called on session restore and overlay reconnect
- [ ] Remove direct `socket.emit` calls from `Match.tsx` and `Controls.tsx`
- [ ] Remove `Socket` parameter from `useAutomationRunner` (Phase 7 dependency)

---

## Phase 7 — Decouple automation

Automation reacts to match events directly, not via socket intercept.

- [ ] `AutomationContext` subscribes to `MatchDomainEvent`s directly via Phase 3 callback
- [ ] Remove `onSocketEmit` from `SocketContext` entirely
- [ ] `useAutomationRunner` accepts `onConfigChange: (config: Config) => void` instead of `Socket`
- [ ] `ALL_SEQUENCES` injected into `AutomationProvider` as a prop

---

## Phase 8 — Code quality and SOLID cleanups

- [ ] Rally action registry already done via Phase 2/4 — verify switch/case blocks are gone
- [ ] Reassess `useMatchManager` size after Phase 4; split timeout/substitution if warranted
- [ ] Remove `alert()` from match logic; replace with `onEvent` callback
- [ ] `badgeUtils` — accept `Badge[]` and Fuse options as parameters instead of module-level singleton
- [ ] Unroll compressed undo code (now in `domain/rally/actionHandlers.ts`)
- [ ] Move `ControlSection` inline component from `Controls.tsx` → `shared/components/`

---

## Phase 9 — Session versioning

- [ ] Add `version: number` field to persisted payload (start at `1`)
- [ ] Write `migrate(raw, fromVersion)` function for known shape changes
- [ ] Graceful handling on load: migrate if possible, discard if not, never throw
- [ ] Document schema version history in `services/session/sessionStorage.ts`

---

## Phase 10 — Undo confirmed rally *(future feature)*

Depends on Phases 2, 3, 4, 5 all complete.

- [ ] Implement `undoLastHistoryEntry()` on `useMatchManager`
- [ ] Confirmed rally entries: restore full `RallyState` (stage, possession, stats, action history)
- [ ] Timeout/substitution entries: decrement counters, remove history entry
- [ ] Set-end entries: reverse set transition, restore previous scores/stats/history, decrement `setsWon`
- [ ] Undo fires a `MatchDomainEvent` so overlay and automation react
- [ ] UI: undo button in `Match.tsx`, enabled when `canUndoHistory` is true
- [ ] Confirmation prompt for set-boundary undos

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
            └─────────────────────────────────────────────────► Phase 10 (undo confirmed rally)
```
