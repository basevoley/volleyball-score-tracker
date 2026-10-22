import { describe, test, expect } from 'vitest';
import { getFaultingTeam } from '../history';
import { createEmptyRallyStats } from '../stats';
import type { HistoryEntry } from '../../../types';

const base = { timestamp: 0, scores: { teamA: 1, teamB: 0 }, setNumber: 1 };

describe('getFaultingTeam', () => {
    test('returns the faulting team for rally and point entries', () => {
        const rally: HistoryEntry = {
            ...base, entryType: 'rally', server: 'teamB', faultingTeam: 'teamA', prevServer: null,
            rallySnapshot: { id: 1, stage: 'start', possession: 'teamB', actionHistory: [], stats: createEmptyRallyStats() },
            statsUpdate: createEmptyRallyStats(),
        };
        const point: HistoryEntry = { ...base, entryType: 'point', team: 'teamB', faultingTeam: 'teamA', prevServer: null };

        expect(getFaultingTeam(rally)).toBe('teamA');
        expect(getFaultingTeam(point)).toBe('teamA');
    });

    test('returns null when the point was not caused by a fault', () => {
        const point: HistoryEntry = { ...base, entryType: 'point', team: 'teamB', faultingTeam: null, prevServer: null };

        expect(getFaultingTeam(point)).toBeNull();
    });

    test('returns null for entries that are not points', () => {
        const timeout: HistoryEntry = { ...base, entryType: 'timeout', team: 'teamA' };
        const adjust: HistoryEntry = { ...base, entryType: 'adjust', team: 'teamA', delta: 1, prevServer: null };

        expect(getFaultingTeam(timeout)).toBeNull();
        expect(getFaultingTeam(adjust)).toBeNull();
    });
});
