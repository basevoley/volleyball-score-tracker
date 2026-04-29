import { describe, test, expect } from 'vitest';
import { migrate } from '../sessionStorage';

// ── V1 fixture helpers ─────────────────────────────────────────────────────────

const v1TeamStats = () => ({
    serve: 10, ace: 2, serveError: 1, reception: 8, receptionError: 1,
    dig: 5, digError: 0, attack: 12, attackPoint: 4, attackError: 2,
    block: 3, blockPoint: 1, blockOut: 0, fault: 1,
    // computed fields present in v1:
    selfErrors: 4,
    serviceEffectiveness: '10.00%',
    receptionEffectiveness: '87.50%',
    attackEffectiveness: '16.67%',
    defenseEffectiveness: '100.00%',
});

const v1EmptyTeamStats = () => ({
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0,
    dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0,
    block: 0, blockPoint: 0, blockOut: 0, fault: 0,
    selfErrors: 0,
    serviceEffectiveness: '0%',
    receptionEffectiveness: '0%',
    attackEffectiveness: '0%',
    defenseEffectiveness: '0%',
});

const v1RallyEntry = (index: number, scores: object, server: string) => ({
    entryType: 'rally',
    timestamp: 1000 + index,
    scores,
    index,
    server,
    faultingTeam: null,
    prevServer: server === 'teamA' ? 'teamB' : 'teamA',
    rallySnapshot: { id: 1, stage: 'start', possession: server, actionHistory: [], stats: {} },
    statsUpdate: { teamA: {}, teamB: {} },
});

const v1AdjustEntry = (index: number, scores: object) => ({
    entryType: 'adjust',
    timestamp: 2000 + index,
    scores,
    index,
    team: 'teamA',
    delta: 1,
    // no prevServer in v1
});

const v1TimeoutEntry = (index: number, scores: object) => ({
    entryType: 'timeout',
    timestamp: 3000 + index,
    scores,
    index,
    team: 'teamB',
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('migrate — v0 → v2', () => {
    test('stamps version and applies v1→v2 shape changes', () => {
        const v0: Record<string, unknown> = {
            matchData: {
                scores: { teamA: 0, teamB: 0 },
                setsWon: { teamA: 0, teamB: 0 },
                currentServer: null,
                matchStarted: false,
                ballPossession: null,
                setScores: [],
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                statistics: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetStats: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetHistory: [],
                setStats: [],
                winner: null,
            },
            matchDetails: {},
            config: {},
        };

        const result = migrate(v0, 0);

        expect(result).not.toBeNull();
        expect(result!.version).toBe(4);
        expect((result!.matchData as unknown as Record<string, unknown>).matchPhase).toBe('pre-match');
    });
});

describe('migrate — v1 → v2', () => {
    test('pre-match session: matchPhase is pre-match, history is empty, computed stats stripped', () => {
        const v1: Record<string, unknown> = {
            version: 1,
            matchData: {
                scores: { teamA: 0, teamB: 0 },
                setsWon: { teamA: 0, teamB: 0 },
                currentServer: null,
                matchStarted: false,
                ballPossession: null,
                setScores: [],
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                statistics: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetStats: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetHistory: [],
                setStats: [],
                winner: null,
            },
            matchDetails: {},
            config: {},
        };

        const result = migrate(v1, 1)!;
        const md = (result.matchData as unknown) as Record<string, unknown>;

        expect(result.version).toBe(4);
        expect(md.matchPhase).toBe('pre-match');
        expect(md.matchStarted).toBeUndefined();
        expect(md.ballPossession).toBeUndefined();
        expect(md.setScores).toBeUndefined();
        expect(md.currentSetHistory).toBeUndefined();
        expect(md.history).toEqual([]);

        // Computed stats fields must be absent
        const statsA = (md.statistics as Record<string, unknown>).teamA as Record<string, unknown>;
        expect(statsA.selfErrors).toBeUndefined();
        expect(statsA.serviceEffectiveness).toBeUndefined();
        expect(statsA.serve).toBe(0);
    });

    test('in-progress session: matchPhase is in-progress, current set history merged with setNumber', () => {
        const v1: Record<string, unknown> = {
            version: 1,
            matchData: {
                scores: { teamA: 3, teamB: 2 },
                setsWon: { teamA: 0, teamB: 0 },
                currentServer: 'teamA',
                matchStarted: true,
                ballPossession: 'teamA',
                setScores: [],
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                statistics: { teamA: v1TeamStats(), teamB: v1EmptyTeamStats() },
                currentSetStats: { teamA: v1TeamStats(), teamB: v1EmptyTeamStats() },
                currentSetHistory: [
                    v1RallyEntry(0, { teamA: 1, teamB: 0 }, 'teamA'),
                    v1TimeoutEntry(1, { teamA: 1, teamB: 0 }),
                    v1RallyEntry(2, { teamA: 2, teamB: 0 }, 'teamA'),
                ],
                setStats: [],
                winner: null,
            },
            matchDetails: {},
            config: {},
        };

        const result = migrate(v1, 1)!;
        const md = (result.matchData as unknown) as Record<string, unknown>;
        const history = md.history as Record<string, unknown>[];

        expect(md.matchPhase).toBe('in-progress');
        expect(history).toHaveLength(3);
        // All entries tagged with setNumber 1, index stripped
        history.forEach(e => {
            expect(e.setNumber).toBe(1);
            expect(e.index).toBeUndefined();
        });

        // Computed stats stripped
        const statsA = (md.statistics as Record<string, unknown>).teamA as Record<string, unknown>;
        expect(statsA.selfErrors).toBeUndefined();
        expect(statsA.serve).toBe(10);
    });

    test('between-sets session: matchPhase is between-sets, completed set histories merged in order', () => {
        const set1History = [
            v1RallyEntry(0, { teamA: 24, teamB: 20 }, 'teamA'),
            v1RallyEntry(1, { teamA: 25, teamB: 20 }, 'teamA'),
        ];
        const v1: Record<string, unknown> = {
            version: 1,
            matchData: {
                scores: { teamA: 0, teamB: 0 },
                setsWon: { teamA: 1, teamB: 0 },
                currentServer: null,
                matchStarted: false,
                ballPossession: null,
                setScores: [{ teamA: 25, teamB: 20 }],
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                statistics: { teamA: v1TeamStats(), teamB: v1EmptyTeamStats() },
                currentSetStats: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetHistory: [],
                setStats: [{
                    setNumber: 1,
                    scores: { teamA: 25, teamB: 20 },
                    statistics: { teamA: v1TeamStats(), teamB: v1EmptyTeamStats() },
                    history: set1History,
                }],
                winner: null,
            },
            matchDetails: {},
            config: {},
        };

        const result = migrate(v1, 1)!;
        const md = (result.matchData as unknown) as Record<string, unknown>;
        const history = md.history as Record<string, unknown>[];
        const setStats = md.setStats as Record<string, unknown>[];

        expect(md.matchPhase).toBe('between-sets');
        expect(history).toHaveLength(2);
        history.forEach(e => {
            expect(e.setNumber).toBe(1);
            expect(e.index).toBeUndefined();
        });

        // setStats entry should have no history and stripped stats
        expect(setStats[0].history).toBeUndefined();
        const s1statsA = (setStats[0].statistics as Record<string, unknown>).teamA as Record<string, unknown>;
        expect(s1statsA.selfErrors).toBeUndefined();
        expect(s1statsA.serve).toBe(10);
    });

    test('multi-set in-progress: histories from completed sets and current set merged in order with correct setNumbers', () => {
        const set1History = [v1RallyEntry(0, { teamA: 25, teamB: 20 }, 'teamA')];
        const set2History = [v1RallyEntry(0, { teamA: 3, teamB: 1 }, 'teamB'), v1RallyEntry(1, { teamA: 3, teamB: 2 }, 'teamA')];
        const v1: Record<string, unknown> = {
            version: 1,
            matchData: {
                scores: { teamA: 3, teamB: 2 },
                setsWon: { teamA: 1, teamB: 0 },
                currentServer: 'teamA',
                matchStarted: true,
                ballPossession: 'teamA',
                setScores: [{ teamA: 25, teamB: 20 }],
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                statistics: { teamA: v1TeamStats(), teamB: v1EmptyTeamStats() },
                currentSetStats: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetHistory: set2History,
                setStats: [{
                    setNumber: 1,
                    scores: { teamA: 25, teamB: 20 },
                    statistics: { teamA: v1TeamStats(), teamB: v1EmptyTeamStats() },
                    history: set1History,
                }],
                winner: null,
            },
            matchDetails: {},
            config: {},
        };

        const result = migrate(v1, 1)!;
        const history = ((result.matchData as unknown) as Record<string, unknown>).history as Record<string, unknown>[];

        // 1 from set1, 2 from current set (set 2) = 3 total
        expect(history).toHaveLength(3);
        expect(history[0].setNumber).toBe(1);
        expect(history[1].setNumber).toBe(2);
        expect(history[2].setNumber).toBe(2);
    });

    test('adjust entries get prevServer: null added', () => {
        const v1: Record<string, unknown> = {
            version: 1,
            matchData: {
                scores: { teamA: 5, teamB: 3 },
                setsWon: { teamA: 0, teamB: 0 },
                currentServer: 'teamA',
                matchStarted: true,
                ballPossession: 'teamA',
                setScores: [],
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                statistics: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetStats: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetHistory: [v1AdjustEntry(0, { teamA: 5, teamB: 3 })],
                setStats: [],
                winner: null,
            },
            matchDetails: {},
            config: {},
        };

        const result = migrate(v1, 1)!;
        const history = ((result.matchData as unknown) as Record<string, unknown>).history as Record<string, unknown>[];

        expect(history).toHaveLength(1);
        expect(history[0].entryType).toBe('adjust');
        expect(history[0].prevServer).toBeNull();
    });

    test('ended session: matchPhase is ended', () => {
        const v1: Record<string, unknown> = {
            version: 1,
            matchData: {
                scores: { teamA: 25, teamB: 20 },
                setsWon: { teamA: 3, teamB: 1 },
                currentServer: null,
                matchStarted: false,
                ballPossession: null,
                setScores: [],
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                statistics: { teamA: v1TeamStats(), teamB: v1EmptyTeamStats() },
                currentSetStats: { teamA: v1EmptyTeamStats(), teamB: v1EmptyTeamStats() },
                currentSetHistory: [],
                setStats: [],
                winner: 'teamA',
            },
            matchDetails: {},
            config: {},
        };

        const result = migrate(v1, 1)!;
        expect(((result.matchData as unknown) as Record<string, unknown>).matchPhase).toBe('ended');
    });

    test('returns null when matchData is missing', () => {
        const broken: Record<string, unknown> = { version: 1, config: {} };
        const result = migrate(broken, 1);
        expect(result).toBeNull();
    });
});
