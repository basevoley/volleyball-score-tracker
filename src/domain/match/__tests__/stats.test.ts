import { describe, test, expect } from 'vitest';
import { computeEffectiveness, mergeStats, calculateUpdatedStatistics, createEmptyMatchStats, createEmptyRallyStats } from '../stats';
import type { TeamRecord, RawTeamStats, RallyTeamStats } from '../../../types';

const emptyRawStats = (): RawTeamStats => ({
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0,
    dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0,
    block: 0, blockPoint: 0, blockOut: 0, fault: 0,
});

const emptyRallyStats = (): RallyTeamStats => ({
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0,
    dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0,
    block: 0, blockPoint: 0, blockOut: 0, fault: 0,
});

describe('createEmptyMatchStats', () => {
    test('returns zero-filled raw stats for both teams', () => {
        const stats = createEmptyMatchStats();
        expect(stats.teamA.serve).toBe(0);
        expect(stats.teamB.ace).toBe(0);
        expect(stats.teamA.fault).toBe(0);
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

describe('computeEffectiveness', () => {
    test('calculates service effectiveness as (aces - serveErrors) / serves', () => {
        const team: RawTeamStats = { ...emptyRawStats(), serve: 10, ace: 4, serveError: 2 };
        const opp: RawTeamStats = { ...emptyRawStats(), serve: 8 };
        const result = computeEffectiveness(team, opp);
        expect(result.serviceEffectiveness).toBe('20.00%');
    });

    test('returns 0% for effectiveness when denominator is 0', () => {
        const team = emptyRawStats();
        const opp = emptyRawStats();
        const result = computeEffectiveness(team, opp);
        expect(result.serviceEffectiveness).toBe('0%');
        expect(result.attackEffectiveness).toBe('0%');
        expect(result.defenseEffectiveness).toBe('0%');
        expect(result.receptionEffectiveness).toBe('0%');
    });

    test('calculates selfErrors as sum of all error types', () => {
        const team: RawTeamStats = { ...emptyRawStats(), serveError: 1, receptionError: 2, attackError: 1, digError: 0, blockOut: 1, fault: 1 };
        const result = computeEffectiveness(team, emptyRawStats());
        expect(result.selfErrors).toBe(6);
    });

    test('calculates reception effectiveness using opponent serve count', () => {
        const team: RawTeamStats = { ...emptyRawStats(), reception: 8, receptionError: 2 };
        const opp: RawTeamStats = { ...emptyRawStats(), serve: 10 };
        const result = computeEffectiveness(team, opp);
        expect(result.receptionEffectiveness).toBe('60.00%');
    });
});

describe('mergeStats', () => {
    test('adds rally stats on top of match stats', () => {
        const current: TeamRecord<RawTeamStats> = {
            teamA: { ...emptyRawStats(), serve: 10, ace: 3 },
            teamB: { ...emptyRawStats() },
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
    test('merges stats for both teams and returns raw stats', () => {
        const current: TeamRecord<RawTeamStats> = {
            teamA: { ...emptyRawStats(), serve: 10, ace: 2 },
            teamB: { ...emptyRawStats(), serve: 8 },
        };
        const update: TeamRecord<RallyTeamStats> = {
            teamA: { ...emptyRallyStats(), serve: 1, ace: 1 },
            teamB: { ...emptyRallyStats() },
        };
        const result = calculateUpdatedStatistics(current, update);
        expect(result.teamA.serve).toBe(11);
        expect(result.teamA.ace).toBe(3);
        expect(result.teamB.serve).toBe(8);
    });
});
