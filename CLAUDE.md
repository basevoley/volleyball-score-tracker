# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Dev server at http://localhost:3000
npm run securestart    # Dev server with HTTPS
npm run build          # tsc + Vite production build (output: build/)
npm test               # Run tests once (vitest run)
npm run test:watch     # Run tests in watch mode
npx vitest run src/domain/match/__tests__/rules.test.ts  # Run single test file
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_SOCKET_URL` | `http://localhost:3005` | Socket.io server URL |
| `VITE_OVERLAY_URL` | `http://localhost:3001` | Broadcast overlay app URL |

The app is a **controller** — it pairs with a separate overlay app via Socket.io using a per-browser UUID key stored in a cookie (`websocket-key`). Match state is broadcast to the overlay in real time.

## Architecture

### Entry point & providers

`main.tsx` → `App.tsx` → `AppProviders` (all contexts) → `AppContent`

`AppProviders` wraps in order: `SocketProvider` → `ConfigProvider` → `PreferencesProvider` → `MatchProvider` → `AutomationProvider`

### State model

Three state domains — no Redux, pure React Context:

- **`MatchContext`** — wraps `useMatchManager`; holds `matchDetails` (pre-match setup: team names, logos, colors, players, competition stats) and `matchData` (live state: scores, sets, server, statistics, history, events). Source of truth for all match state.
- **`ConfigContext`** — overlay panel visibility and settings (`Config`). Mutated via `ConfigChange[]` patches: `{ section, key, value }`.
- **`PreferencesContext`** — `noStats` flag (cookie `no-stats`). When enabled, forces `Config.afterMatch.showStats = false`.

Session is persisted to `localStorage` under `vb_tracker_session`. On reload, a confirmation dialog offers to restore or discard.

### Source layout

```
src/
  app/              # Entry point, AppProviders, AppContent (tabs)
  contexts/         # MatchContext, ConfigContext, PreferencesContext, AutomationContext
  domain/
    match/          # rules.ts, stats.ts, undo.ts, defaults.ts — pure business logic
    rally/          # actionHandlers.ts — rally state machine actions
    automation/     # sequences.ts — all automation sequence definitions
  features/
    pre-match/      # Tab 0: team setup, logos, players, competition data
    match/          # Tab 1: live scoring, rally control, stats
    controls/       # Tab 2: overlay toggles, automation sequences, overlay preview
    settings/       # Tab 3: noStats mode toggle
  hooks/            # useMatchManager, useRallyManager, useAutomationRunner
  services/
    socket/         # SocketContext (connection), useBroadcast (emit logic)
    session/        # useSession, sessionStorage
  shared/
    components/     # Reusable UI components
    utils/          # badgeUtils, colorUtils
  types/            # index.ts — all shared types
```

### Core hooks

**`useMatchManager`** (`src/hooks/useMatchManager.ts`) — all score/set/match logic.

Key methods: `startMatch`, `resetMatch`, `restoreMatch`, `setServer(team)`, `endRally(winner, faultingTeam?)`, `callTimeout(team)`, `callSubstitution(team)`, `adjustScore(team, delta)`, `updateSetsWon(team, value)`, `confirmSetEnd(confirm)`, `undoLastHistoryEntry()`, `willRallyEndSet(winner)`. Also exposes rally sub-API: `handleAction(action, faultingTeam?)`, `undoLastAction()`, `discardRally()`, `rally: RallySnapshot`.

Set-end detection: 25+ with 2-point lead (15+ in the deciding set). `endRally` sets `pendingSetUpdate` when a set ends; `confirmSetEnd(true)` advances to the next set.

**`useRallyManager`** (`src/hooks/useRallyManager.ts`) — per-rally state machine. Stages: `start` → `afterServe` → `afterReception` → `afterAttack` → `afterDig` / `afterBlock`. Tracks action history for undo. Accumulates `RallyTeamStats` per rally; merged into `MatchData.statistics` on `endRally`.

**`useAutomationRunner`** (`src/hooks/useAutomationRunner.ts`) — executes sequences step-by-step via `setTimeout`. Supports conditional steps (`condition(ctx)` evaluated at runtime), looping sequences (`loopStart: true`), and snapshot/restore of config sections.

### Rally action handlers (`src/domain/rally/actionHandlers.ts`)

Each action has `apply()` and `undo()`. Actions and their effects:

| Action | Stage after | Effect |
|---|---|---|
| `serve` | `afterServe` | +serve on possessing team |
| `reception` | `afterReception` | +reception on opposing team |
| `attack` | `afterAttack` | +attack on possessing team |
| `block` | `afterBlock` | +block on opposing team |
| `dig` | `afterDig` | +dig on opposing team |
| `continue` | `afterDig` | +dig on possessing team (rally continuation) |
| `error` | `start` | position-specific error, flips possession |
| `fault` | `start` | fault on designated team, flips possession |
| `point` | `start` | position-specific point on possessing team |

### Domain events & automation

`MatchContext` maintains a listener set. Match events (`MatchStarted`, `TimeoutCalled`, `SetEnded`, `MatchEnded`, etc.) are published after state commits via a deferred `useEffect` (so listeners see consistent state).

`AutomationContext` subscribes to these domain events and triggers matching sequences from `src/domain/automation/sequences.ts`.

Automation sequences have a `trigger`: `{ type: 'manual' }` or `{ type: 'domainEvent', event }`. Each step has `changes: ConfigChange[]`, `duration` (ms), optional `condition(ctx)`, optional `loopStart`. `snapshotSections` saves config sections before run and restores on end; `resetOnStop` force-hides sections on stop.

**Layout mode**: `PreferencesContext.automationLayout` (`'preset'` default | `'manual'`, session-only, not persisted) is passed to `useAutomationRunner`. In `manual`, `filterLayoutChanges` (`src/domain/automation/layout.ts`) strips layout keys (`LAYOUT_KEYS`: `scoreboard.position/type`, `socialMedia.position`, `subscribe.position`) from every step, and snapshots exclude them, so automations only show/hide. Add new positionable panel keys to `LAYOUT_KEYS`. Switch lives in Controls → Automatismos.

Defined sequences: `PRE_MATCH_SEQUENCE` (manual), `MATCH_START_SEQUENCE`, `TIMEOUT_SEQUENCE`, `SET_END_SEQUENCE`, `MATCH_END_SEQUENCE`.

### Point celebration effects (`src/domain/effects/`, `EffectsContext`)

On a scored point the operator can trigger a **celebration**: an animated text and/or a cheering crowd on the overlay. Text and crowd are two parts of one celebration, so exactly one `triggerEffect` socket event is emitted per point.

- **Preferences** (`EffectPreferences`, `localStorage` key `vb_effect_preferences` (without `target`), via `PreferencesContext.effectPreferences`; edited in Settings → "Efectos de punto"): a single `target` (`none|teamA|teamB|both`, `none` = feature off) plus `crowd.mode` and `text.mode` (`off|every-point|manual`), a global `appendTeamName`, and a text list (`{ text, effect }`, effect = `random` or one of ten). Defaults to off, with the generic "PUNTAZO!!!" (random effect) plus six ready-made texts (`DEFAULT_TEXT_ENTRIES`, each tied to an effect). `target` is never persisted: it lives in memory and resets to `none` on `MatchReset` and when the teams change before kick-off (`PreferencesContext`), so a new match can never cheer for the previous match's team.
- **Detecting a point**: `scoredPointOf(event, history)` reads who scored from the history tail (`rally`/`point` entry, optionally followed by `set-end`). Corrections (`adjust`, `sets-won-adjust`) are never points, even when they end a set. No domain event carries extra data for this.
- **Deciding**: `planPointEffects` returns `{ immediate, dialog }`. `every-point` parts are always included; a `manual` part opens `PointEffectsDialog` (modal, countdown on the X (`DIALOG_TIMEOUT_MS`); Escape dismisses, backdrop click does not). Dismissing the dialog plays only the `every-point` parts (`DialogSpec.onDismiss`). `text.mode=every-point` plays the first text.
- **Orchestration**: `CelebrationController` (framework-free) handles events, the dialog and emission; `EffectsProvider` wires it to React and to the socket (`triggerEffect`, payload `EffectPayload` with `durationMs`).
- **Automation interplay**: sequences flagged `waitForCelebration` (`SET_END`, `MATCH_END`) are held by `createSequenceDispatcher` until `CelebrationGate` releases their event, i.e. until the dialog is resolved and the celebration has played (`CELEBRATION_DURATION_MS` + exit margin). Undo/reset cancels pending waits. The gate is keyed by the event object, so it is independent of listener order.

### Socket broadcast (`src/services/socket/useBroadcast.ts`)

Emitted events (celebrations go out separately as `triggerEffect` from `EffectsProvider`): `matchData` (on match domain events, includes `ComputedTeamStats` with effectiveness percentages and a `matchEvent` notification), `updateConfig` (on config changes), `matchDetails` (on details changes), `handshake-response` (full state sync on connect).

`syncAll()` re-broadcasts all state — called after session restore.

### History undo

`MatchData.history` is an array of discriminated-union `HistoryEntry` objects: `RallyHistoryEntry`, `PointHistoryEntry` (no-stats point), `TimeoutHistoryEntry`, `SubstitutionHistoryEntry`, `AdjustHistoryEntry`, `SetEndHistoryEntry`, `SetsWonAdjustHistoryEntry`. `undoLastHistoryEntry()` calls `applyHistoryUndo` in `src/domain/match/undo.ts` to revert the last entry.

`isSetBoundaryUndo: boolean` warns the UI when undo would cross a set boundary.

### Badge/logo matching

`src/shared/utils/badgeUtils.ts` uses Fuse.js fuzzy search against 96 Spanish volleyball team logos (`src/shared/utils/badges.ts`). Normalizes the team name (removes prefixes: CV, CDE, CD, AD, etc.) before matching. `getBestBadge(teamName)` returns a URL or `null`.

## Types

All shared types are in `src/types/index.ts`. Key types:

- `TeamKey = 'teamA' | 'teamB'`, `TeamRecord<T> = { teamA: T; teamB: T }`
- `MatchPhase = 'pre-match' | 'in-progress' | 'between-sets' | 'ended'`
- `RallyStage`, `RallyActionType`, `RallySnapshot`
- `RawTeamStats` (14 counting fields), `ComputedTeamStats` (extends with effectiveness percentages)
- `MatchData`, `MatchDetails`, `Config`, `Sequence`, `SequenceStep`, `ConfigChange`
- `HistoryEntry` (discriminated union of 7 entry types)
- `ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting'`

## Tests

| File | What it covers |
|---|---|
| `src/domain/match/__tests__/rules.test.ts` | `checkSetEnd` (25+, 15+ deciding set, 2-pt lead), `checkMatchEnd` |
| `src/domain/match/__tests__/stats.test.ts` | Effectiveness calculations, stat merging |
| `src/domain/match/__tests__/undo.test.ts` | History undo for all entry types |
| `src/services/session/__tests__/sessionStorage.test.ts` | localStorage save/load/clear |
| `src/shared/utils/__tests__/badgeUtils.test.ts` | Null handling, normalization, fuzzy matching |

## Patterns

- **Refs for latest state**: Hooks store current state in refs (`matchRef`, `configRef`, `socketRef`) to avoid stale closures in callbacks.
- **Deferred event publishing**: `pendingEventRef` fires via `useEffect` after state commit, so listeners see consistent state.
- **Set-end confirmation**: `pendingSetUpdate` holds the proposed next state until `confirmSetEnd(true)` is called.
- **Config patching**: All config mutations go through `ConfigChange[]` arrays — never mutate config directly.
- **No-stats mode**: Toggled in Settings (`PreferencesContext.noStats`); a UI-level flag only — the broadcast layer doesn't know about it. `Match.tsx` hides `RallyControl`/`StatsHandler` and shows a standalone `HistoryUndoBar`. `ScoreBoard` keeps the "+"/"−" correction buttons beside the score (adjust entries) and adds a round gold "Punto" button row calling `scorePoint(team, faultingTeam?)`, and "Falta" scores a point for the opponent. `scorePoint` writes a `point` history entry, gives the serve to the scorer, emits `RallyEnded` (or `SetEnded`/`MatchEnded`) and has no rally-end confirmation; the only confirmation is `ScoreBoard`'s dialog when the point ends a set. "+"/"−" are manual corrections (`adjust` entries) in both modes; "+" also asks for confirmation when it ends a set.
