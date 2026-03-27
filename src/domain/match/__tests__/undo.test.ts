import { describe, test, expect } from 'vitest';
import { applyHistoryUndo } from '../undo';
import { createEmptyMatchStats, createEmptyRallyStats } from '../stats';
import type {
    MatchData, RawTeamStats, RallyTeamStats,
    RallyHistoryEntry, TimeoutHistoryEntry, SubstitutionHistoryEntry,
    AdjustHistoryEntry, SetEndHistoryEntry, SetsWonAdjustHistoryEntry,
} from '../../../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const emptyRaw = (): RawTeamStats => ({
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0,
    dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0,
    block: 0, blockPoint: 0, blockOut: 0, fault: 0,
});

const emptyRally = (): RallyTeamStats => ({
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0,
    dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0,
    block: 0, blockPoint: 0, blockOut: 0, fault: 0,
});

const baseMatch = (): MatchData => ({
    scores: { teamA: 10, teamB: 8 },
    setsWon: { teamA: 0, teamB: 0 },
    currentServer: 'teamA',
    matchPhase: 'in-progress',
    timeouts: { teamA: 0, teamB: 0 },
    substitutions: { teamA: 0, teamB: 0 },
    statistics: { teamA: emptyRaw(), teamB: emptyRaw() },
    currentSetStats: { teamA: emptyRaw(), teamB: emptyRaw() },
    history: [],
    setStats: [],
    winner: null,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('applyHistoryUndo — rally', () => {
    test('reverses score, server, and stats', () => {
        const statsUpdate = {
            teamA: { ...emptyRally(), serve: 1, ace: 1 },
            teamB: { ...emptyRally() },
        };
        const entry: RallyHistoryEntry = {
            entryType: 'rally',
            timestamp: 0,
            scores: { teamA: 10, teamB: 8 },
            setNumber: 1,
            server: 'teamA',
            faultingTeam: null,
            prevServer: 'teamB',
            rallySnapshot: { id: 1, stage: 'start', possession: 'teamA', actionHistory: [], stats: createEmptyRallyStats() },
            statsUpdate,
        };
        const state: MatchData = {
            ...baseMatch(),
            statistics: { teamA: { ...emptyRaw(), serve: 5, ace: 3 }, teamB: emptyRaw() },
            currentSetStats: { teamA: { ...emptyRaw(), serve: 3, ace: 2 }, teamB: emptyRaw() },
            history: [entry],
        };

        const result = applyHistoryUndo(state, entry, 5);

        expect(result.scores).toEqual({ teamA: 9, teamB: 8 });
        expect(result.currentServer).toBe('teamB');
        expect(result.statistics.teamA.serve).toBe(4);
        expect(result.statistics.teamA.ace).toBe(2);
        expect(result.currentSetStats.teamA.serve).toBe(2);
        expect(result.currentSetStats.teamA.ace).toBe(1);
        expect(result.history).toHaveLength(0);
    });
});

describe('applyHistoryUndo — timeout', () => {
    test('decrements the timeout counter for the correct team', () => {
        const entry: TimeoutHistoryEntry = {
            entryType: 'timeout',
            timestamp: 0,
            scores: { teamA: 10, teamB: 8 },
            setNumber: 1,
            team: 'teamA',
        };
        const state: MatchData = { ...baseMatch(), timeouts: { teamA: 2, teamB: 0 }, history: [entry] };

        const result = applyHistoryUndo(state, entry, 5);

        expect(result.timeouts).toEqual({ teamA: 1, teamB: 0 });
        expect(result.history).toHaveLength(0);
    });
});

describe('applyHistoryUndo — substitution', () => {
    test('decrements the substitution counter for the correct team', () => {
        const entry: SubstitutionHistoryEntry = {
            entryType: 'substitution',
            timestamp: 0,
            scores: { teamA: 5, teamB: 5 },
            setNumber: 1,
            team: 'teamB',
        };
        const state: MatchData = { ...baseMatch(), substitutions: { teamA: 0, teamB: 1 }, history: [entry] };

        const result = applyHistoryUndo(state, entry, 5);

        expect(result.substitutions).toEqual({ teamA: 0, teamB: 0 });
        expect(result.history).toHaveLength(0);
    });
});

describe('applyHistoryUndo — adjust', () => {
    test('reverses score delta and restores previous server', () => {
        const entry: AdjustHistoryEntry = {
            entryType: 'adjust',
            timestamp: 0,
            scores: { teamA: 5, teamB: 3 },
            setNumber: 1,
            team: 'teamA',
            delta: 2,
            prevServer: 'teamB',
        };
        const state: MatchData = {
            ...baseMatch(),
            scores: { teamA: 5, teamB: 3 },
            currentServer: 'teamA',
            history: [entry],
        };

        const result = applyHistoryUndo(state, entry, 5);

        expect(result.scores).toEqual({ teamA: 3, teamB: 3 });
        expect(result.currentServer).toBe('teamB');
        expect(result.history).toHaveLength(0);
    });
});

describe('applyHistoryUndo — set-end', () => {
    test('restores all pre-transition state and pops setStats', () => {
        const prevSetStats = { teamA: { ...emptyRaw(), serve: 20 }, teamB: emptyRaw() };
        const entry: SetEndHistoryEntry = {
            entryType: 'set-end',
            timestamp: 0,
            scores: { teamA: 25, teamB: 20 },
            setNumber: 1,
            prevScores: { teamA: 25, teamB: 20 },
            prevSetsWon: { teamA: 0, teamB: 0 },
            prevSetStats,
            prevServer: 'teamB',
            prevTimeouts: { teamA: 1, teamB: 0 },
            prevSubstitutions: { teamA: 2, teamB: 1 },
        };
        const state: MatchData = {
            ...baseMatch(),
            scores: { teamA: 0, teamB: 0 },
            setsWon: { teamA: 1, teamB: 0 },
            currentServer: null,
            matchPhase: 'between-sets',
            timeouts: { teamA: 0, teamB: 0 },
            substitutions: { teamA: 0, teamB: 0 },
            currentSetStats: createEmptyMatchStats(),
            setStats: [{ setNumber: 1, scores: { teamA: 25, teamB: 20 }, statistics: prevSetStats }],
            history: [entry],
        };

        const result = applyHistoryUndo(state, entry, 5);

        expect(result.scores).toEqual({ teamA: 25, teamB: 20 });
        expect(result.setsWon).toEqual({ teamA: 0, teamB: 0 });
        expect(result.currentSetStats).toEqual(prevSetStats);
        expect(result.currentServer).toBe('teamB');
        expect(result.timeouts).toEqual({ teamA: 1, teamB: 0 });
        expect(result.substitutions).toEqual({ teamA: 2, teamB: 1 });
        expect(result.setStats).toHaveLength(0);
        expect(result.matchPhase).toBe('in-progress');
        expect(result.winner).toBeNull();
        expect(result.history).toHaveLength(0);
    });
});

describe('applyHistoryUndo — set-end + preceding rally (double undo)', () => {
    test('chaining set-end undo then rally undo restores state to before the set-ending rally', () => {
        const setEndingRallyStats = {
            teamA: { ...emptyRally(), serve: 1, ace: 1 },
            teamB: { ...emptyRally() },
        };
        const prevSetStats = {
            teamA: { ...emptyRaw(), serve: 5, ace: 3 },
            teamB: emptyRaw(),
        };
        // prevSetStats already includes the set-ending rally stats
        const rallyEntry: RallyHistoryEntry = {
            entryType: 'rally',
            timestamp: 0,
            scores: { teamA: 25, teamB: 20 },
            setNumber: 1,
            server: 'teamA',
            faultingTeam: null,
            prevServer: 'teamB',
            rallySnapshot: { id: 1, stage: 'start', possession: 'teamA', actionHistory: [], stats: createEmptyRallyStats() },
            statsUpdate: setEndingRallyStats,
        };
        const setEndEntry: SetEndHistoryEntry = {
            entryType: 'set-end',
            timestamp: 0,
            scores: { teamA: 25, teamB: 20 },
            setNumber: 1,
            prevScores: { teamA: 25, teamB: 20 },
            prevSetsWon: { teamA: 0, teamB: 0 },
            prevSetStats,
            prevServer: 'teamA',
            prevTimeouts: { teamA: 0, teamB: 0 },
            prevSubstitutions: { teamA: 0, teamB: 0 },
        };
        const state: MatchData = {
            ...baseMatch(),
            scores: { teamA: 0, teamB: 0 },
            setsWon: { teamA: 1, teamB: 0 },
            currentServer: null,
            matchPhase: 'between-sets',
            statistics: { teamA: { ...emptyRaw(), serve: 5, ace: 3 }, teamB: emptyRaw() },
            currentSetStats: createEmptyMatchStats(),
            setStats: [{ setNumber: 1, scores: { teamA: 25, teamB: 20 }, statistics: prevSetStats }],
            history: [rallyEntry, setEndEntry],
        };

        // Step 1: undo set-end
        const afterSetEndUndo = applyHistoryUndo(state, setEndEntry, 5);
        // Step 2: undo the preceding rally
        const triggerEntry = afterSetEndUndo.history[afterSetEndUndo.history.length - 1];
        const result = applyHistoryUndo(afterSetEndUndo, triggerEntry, 5);

        // Scores should reflect the state BEFORE the set-ending rally
        expect(result.scores).toEqual({ teamA: 24, teamB: 20 });
        expect(result.setsWon).toEqual({ teamA: 0, teamB: 0 });
        expect(result.currentServer).toBe('teamB'); // prevServer from rally entry
        expect(result.matchPhase).toBe('in-progress');
        expect(result.setStats).toHaveLength(0);
        expect(result.history).toHaveLength(0);
        // Set stats should have the rally stats reversed out
        expect(result.currentSetStats.teamA.serve).toBe(4);
        expect(result.currentSetStats.teamA.ace).toBe(2);
        // Overall statistics should also have the rally reversed
        expect(result.statistics.teamA.serve).toBe(4);
        expect(result.statistics.teamA.ace).toBe(2);
    });
});

describe('applyHistoryUndo — sets-won-adjust', () => {
    test('restores previous sets-won value without affecting matchPhase', () => {
        const entry: SetsWonAdjustHistoryEntry = {
            entryType: 'sets-won-adjust',
            timestamp: 0,
            scores: { teamA: 0, teamB: 0 },
            setNumber: 3,
            team: 'teamA',
            prevSetsWon: 1,
            newSetsWon: 2,
        };
        const state: MatchData = {
            ...baseMatch(),
            setsWon: { teamA: 2, teamB: 1 },
            matchPhase: 'in-progress',
            history: [entry],
        };

        const result = applyHistoryUndo(state, entry, 5);

        expect(result.setsWon).toEqual({ teamA: 1, teamB: 1 });
        expect(result.winner).toBeNull();
        expect(result.matchPhase).toBe('in-progress');
        expect(result.history).toHaveLength(0);
    });

    test('restores matchPhase and clears winner when undo reverses a match-ending adjustment', () => {
        const entry: SetsWonAdjustHistoryEntry = {
            entryType: 'sets-won-adjust',
            timestamp: 0,
            scores: { teamA: 0, teamB: 0 },
            setNumber: 3,
            team: 'teamA',
            prevSetsWon: 2,
            newSetsWon: 3,
        };
        const state: MatchData = {
            ...baseMatch(),
            setsWon: { teamA: 3, teamB: 1 },
            matchPhase: 'ended',
            winner: 'teamA',
            history: [entry],
        };

        const result = applyHistoryUndo(state, entry, 5);

        expect(result.setsWon).toEqual({ teamA: 2, teamB: 1 });
        expect(result.winner).toBeNull();
        expect(result.matchPhase).toBe('in-progress');
        expect(result.history).toHaveLength(0);
    });
});
