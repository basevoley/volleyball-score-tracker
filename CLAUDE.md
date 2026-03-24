# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:3000
npm run build      # TypeScript check + Vite production build (output: build/)
npm test           # Run tests once (vitest run)
npm run test:watch # Run tests in watch mode
```

To run a single test file:
```bash
npx vitest run src/utils/__tests__/badgeUtils.test.ts
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_SOCKET_URL` | `http://localhost:3005` | Socket.io server URL |
| `VITE_OVERLAY_URL` | `http://localhost:3001` | Broadcast overlay app URL |

The app is a **controller** — it pairs with a separate overlay app via Socket.io using a per-browser UUID key stored in a cookie (`websocket-key`). Match state is broadcast to the overlay in real time.

## Architecture

### State model
Three top-level state trees live in `App.tsx` and are passed down as props:
- `MatchDetails` — pre-match setup (team names, logos, colors, players, competition stats)
- `MatchData` — live match state (scores, sets, server, statistics, history, events)
- `Config` — overlay panel visibility and settings

Session is persisted to `localStorage` under the key `vb_tracker_session` and restored on reload via a confirmation dialog.

### Core hooks
- **`useMatchManager`** (`src/hooks/useMatchManager.ts`) — all score/set/match logic: `endRally`, `callTimeout`, `adjustScore`, etc. Handles set-end detection (25+ with 2-point lead; 15 in the final set) and match-end detection. Emits a `pendingSetUpdate` that requires confirmation before advancing to the next set.
- **`useRallyManager`** (`src/hooks/useRallyManager.ts`) — per-rally state machine with stages (`start` → `afterServe` → `afterReception` → `afterAttack` → `afterDig`/`afterBlock`). Tracks action history for undo. Accumulates `RallyTeamStats` per rally, which are merged into `MatchData.statistics` on `endRally`.

### Contexts
- **`SocketContext`** (`src/contexts/SocketContext.tsx`) — manages the Socket.io connection lifecycle. Exposes `socket`, `connectionStatus`, `reconnect`, and `onSocketEmit` (subscribes to outgoing socket events — used by the automation system).
- **`AutomationContext`** (`src/contexts/AutomationContext.tsx`) — runs overlay automation sequences. Wraps `useAutomationRunner` and wires socket event triggers from `ALL_SEQUENCES`.

### Automation system
Sequences are defined in `src/automation/sequences.ts` as `Sequence` objects. Each sequence has:
- A `trigger`: either `{ type: 'manual' }` or `{ type: 'socketEvent', event, condition, initialState? }`
- `steps[]`: each step has `changes` (Config patches), `duration` (ms), an optional `condition(ctx)` evaluated at runtime, and an optional `loopStart` flag
- Optional `snapshotSections` (config sections saved before run, restored on end/stop) and `resetOnStop` (sections force-hidden on stop)

`useAutomationRunner` executes steps sequentially via `setTimeout`, applies `ConfigChange[]` patches to `Config`, and emits `updateConfig` over Socket.io after every step.

`AutomationContext` groups socket-triggered sequences by event name and subscribes via `onSocketEmit`, so the automation system reacts to outgoing `matchData` emissions without coupling to the match logic.

### Tab layout (`App.tsx`)
| Tab | Component | Purpose |
|---|---|---|
| 0 — Datos del partido | `PreMatch` | Team names, logos, players, competition data |
| 1 — Partido | `Match` | Live scoring, rally control, stats |
| 2 — Controles de vídeo | `Controls` | Overlay panel toggles, automation sequences |
| 3 — Ajustes | `Settings` | App settings (e.g. no-stats mode) |

### Types
All shared types are in `src/types/index.ts`. Key types: `TeamKey`, `TeamRecord<T>`, `MatchData`, `MatchDetails`, `Config`, `Sequence`, `RallyState`, `RallyStage`.

### No-stats mode
Toggled in Settings and persisted via a cookie (`no-stats`). When enabled, stat-tracking UI is hidden and `Config.afterMatch.showStats` is forced to `false`.

### Badge/logo matching
`src/utils/badgeUtils.ts` uses Fuse.js fuzzy search against a static list of badge images (`src/components/badges.ts`) to auto-assign team logos by name.
