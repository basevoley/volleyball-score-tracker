import { describe, test, expect } from 'vitest';
import { checkSetEnd, checkMatchEnd } from '../rules';

describe('checkSetEnd', () => {
    test('returns null when neither team has reached required points', () => {
        expect(checkSetEnd({ teamA: 20, teamB: 18 }, { teamA: 0, teamB: 0 }, 5)).toBeNull();
    });

    test('returns winner when a team reaches 25 with 2+ point lead', () => {
        expect(checkSetEnd({ teamA: 25, teamB: 23 }, { teamA: 0, teamB: 0 }, 5)).toBe('teamA');
        expect(checkSetEnd({ teamA: 23, teamB: 25 }, { teamA: 0, teamB: 0 }, 5)).toBe('teamB');
    });

    test('returns null when a team has 25 but lead is less than 2', () => {
        expect(checkSetEnd({ teamA: 25, teamB: 24 }, { teamA: 0, teamB: 0 }, 5)).toBeNull();
    });

    test('requires only 15 points in the deciding set (5th set of 5)', () => {
        // 15-13 wins in the deciding set
        expect(checkSetEnd({ teamA: 15, teamB: 13 }, { teamA: 2, teamB: 2 }, 5)).toBe('teamA');
        // 14 is not enough even with 2+ lead
        expect(checkSetEnd({ teamA: 14, teamB: 12 }, { teamA: 2, teamB: 2 }, 5)).toBeNull();
        // 15-13 does NOT win in a regular set (needs 25+)
        expect(checkSetEnd({ teamA: 15, teamB: 13 }, { teamA: 0, teamB: 0 }, 5)).toBeNull();
    });

    test('allows extended play beyond 25 when teams are tied', () => {
        expect(checkSetEnd({ teamA: 26, teamB: 24 }, { teamA: 0, teamB: 0 }, 5)).toBe('teamA');
        expect(checkSetEnd({ teamA: 28, teamB: 26 }, { teamA: 0, teamB: 0 }, 5)).toBe('teamA');
    });

    test('awards win to the team with the lead when both exceed required points', () => {
        // teamB has 2-point lead over teamA at 28-26 — teamB must win
        expect(checkSetEnd({ teamA: 26, teamB: 28 }, { teamA: 0, teamB: 0 }, 5)).toBe('teamB');
        // neither has 2-point lead at 27-27
        expect(checkSetEnd({ teamA: 27, teamB: 27 }, { teamA: 0, teamB: 0 }, 5)).toBeNull();
    });

    test('returns null at 25-25 (no 2-point lead)', () => {
        expect(checkSetEnd({ teamA: 25, teamB: 25 }, { teamA: 0, teamB: 0 }, 5)).toBeNull();
    });
});

describe('checkMatchEnd', () => {
    test('returns null when no team has won enough sets', () => {
        expect(checkMatchEnd({ teamA: 1, teamB: 1 }, 5)).toBeNull();
        expect(checkMatchEnd({ teamA: 2, teamB: 1 }, 5)).toBeNull();
    });

    test('returns winner when a team wins majority of sets (5-set match)', () => {
        expect(checkMatchEnd({ teamA: 3, teamB: 1 }, 5)).toBe('teamA');
        expect(checkMatchEnd({ teamA: 1, teamB: 3 }, 5)).toBe('teamB');
    });

    test('returns winner for 3-set match (best of 3)', () => {
        expect(checkMatchEnd({ teamA: 2, teamB: 0 }, 3)).toBe('teamA');
        expect(checkMatchEnd({ teamA: 1, teamB: 2 }, 3)).toBe('teamB');
    });
});
