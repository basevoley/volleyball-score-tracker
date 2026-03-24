import { describe, test, expect } from 'vitest';
import { calculateComputedStats, mergeStats, calculateUpdatedStatistics, createEmptyMatchStats, createEmptyRallyStats } from '../stats';
import type { TeamRecord, TeamStats, RallyTeamStats } from '../../../types';

const emptyTeamStats = (): TeamStats => ({
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0,
    dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0,
    block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0,
    serviceEffectiveness: '0%', receptionEffectiveness: '0%',
    attackEffectiveness: '0%', defenseEffectiveness: '0%',
});

const emptyRallyStats = (): RallyTeamStats => ({
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0,
    dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0,
    block: 0, blockPoint: 0, blockOut: 0, fault: 0,
});

describe('createEmptyMatchStats', () => {
    test('returns zero-filled stats for both teams', () => {
        const stats = createEmptyMatchStats();
        expect(stats.teamA.serve).toBe(0);
        expect(stats.teamB.ace).toBe(0);
        expect(stats.teamA.serviceEffectiveness).toBe('0%');
    });

    test('returns independent copies for each team', () => {
        const stats = createEmptyMatchStats();
        stats.teamA.serve = 5;
        const stats2 = createEmptyMatchStats();
        expect(stats2.teamA.serve).toBe(0);
    });
});

describe('createEmptyRallyStats', () => {
    test('returns zero-filled rally stats for both teams', () => {
        const stats = createEmptyRallyStats();
        expect(stats.teamA.serve).toBe(0);
        expect(stats.teamB.fault).toBe(0);
    });
});

describe('calculateComputedStats', () => {
    test('calculates service effectiveness as (aces - serveErrors) / serves', () => {
        const stats: TeamRecord<TeamStats> = {
            teamA: { ...emptyTeamStats(), serve: 10, ace: 4, serveError: 2 },
            teamB: { ...emptyTeamStats(), serve: 8 },
        };
        const result = calculateComputedStats(stats, 'teamA');
        expect(result.teamA.serviceEffectiveness).toBe('20.00%');
    });

    test('returns 0% for effectiveness when denominator is 0', () => {
        const stats: TeamRecord<TeamStats> = {
            teamA: { ...emptyTeamStats() },
            teamB: { ...emptyTeamStats() },
        };
        const result = calculateComputedStats(stats, 'teamA');
        expect(result.teamA.serviceEffectiveness).toBe('0%');
    });

    test('calculates selfErrors as sum of all error types', () => {
        const stats: TeamRecord<TeamStats> = {
            teamA: { ...emptyTeamStats(), serveError: 1, receptionError: 2, attackError: 1, digError: 0, blockOut: 1, fault: 1 },
            teamB: { ...emptyTeamStats() },
        };
        const result = calculateComputedStats(stats, 'teamA');
        expect(result.teamA.selfErrors).toBe(6);
    });
});

describe('mergeStats', () => {
    test('adds rally stats on top of match stats', () => {
        const current: TeamRecord<TeamStats> = {
            teamA: { ...emptyTeamStats(), serve: 10, ace: 3 },
            teamB: { ...emptyTeamStats() },
        };
        const update: TeamRecord<RallyTeamStats> = {
            teamA: { ...emptyRallyStats(), serve: 1, ace: 1 },
            teamB: { ...emptyRallyStats() },
        };
        const result = mergeStats(current, update, 'teamA');
        expect(result.serve).toBe(11);
        expect(result.ace).toBe(4);
    });
});

describe('calculateUpdatedStatistics', () => {
    test('merges and recalculates effectiveness for both teams', () => {
        const current: TeamRecord<TeamStats> = {
            teamA: { ...emptyTeamStats(), serve: 10, ace: 2 },
            teamB: { ...emptyTeamStats(), serve: 8 },
        };
        const update: TeamRecord<RallyTeamStats> = {
            teamA: { ...emptyRallyStats(), serve: 1, ace: 1 },
            teamB: { ...emptyRallyStats() },
        };
        const result = calculateUpdatedStatistics(current, update);
        expect(result.teamA.serve).toBe(11);
        expect(result.teamA.ace).toBe(3);
        expect(result.teamA.serviceEffectiveness).not.toBe('0%');
    });
});
