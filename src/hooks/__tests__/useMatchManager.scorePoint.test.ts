import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchManager } from '../useMatchManager';
import type { MatchData, MatchDomainEvent } from '../../types';

const teams = { teamA: 'A', teamB: 'B' };

const setup = (initial: Partial<MatchData> = {}) => {
    const onEvent = vi.fn<(e: MatchDomainEvent) => void>();
    const hook = renderHook(() =>
        useMatchManager({ matchPhase: 'in-progress', currentServer: 'teamA', ...initial }, teams, 5, onEvent));
    return { ...hook, onEvent };
};

describe('useMatchManager — scorePoint (no-stats mode)', () => {
    test('adds the point, hands the serve to the scorer and records a point entry', () => {
        const { result } = setup({ currentServer: 'teamA' });

        act(() => result.current.scorePoint('teamB'));

        const { match, rally } = result.current;
        expect(match.scores).toEqual({ teamA: 0, teamB: 1 });
        expect(match.currentServer).toBe('teamB');
        expect(rally.possession).toBe('teamB');
        expect(match.history).toHaveLength(1);
        expect(match.history[0]).toMatchObject({ entryType: 'point', team: 'teamB', faultingTeam: null, prevServer: 'teamA' });
    });

    test('does not touch statistics or require a set-end confirmation', () => {
        const { result } = setup();
        const before = result.current.match.statistics;

        act(() => result.current.scorePoint('teamA'));

        expect(result.current.match.statistics).toEqual(before);
        expect(result.current.pendingSetEnd).toBe(false);
    });

    test('emits RallyEnded with the faulting team so the overlay shows the fault', () => {
        const { result, onEvent } = setup();

        act(() => result.current.scorePoint('teamB', 'teamA'));

        expect(onEvent).toHaveBeenCalledWith({ type: 'RallyEnded', winner: 'teamB', faultingTeam: 'teamA' });
        expect(result.current.match.history[0]).toMatchObject({ entryType: 'point', team: 'teamB', faultingTeam: 'teamA' });
    });

    test('a set-ending point closes the set immediately and emits SetEnded', () => {
        const { result, onEvent } = setup({ scores: { teamA: 24, teamB: 10 } });

        act(() => result.current.scorePoint('teamA'));

        const { match } = result.current;
        expect(match.setsWon).toEqual({ teamA: 1, teamB: 0 });
        expect(match.scores).toEqual({ teamA: 0, teamB: 0 });
        expect(match.matchPhase).toBe('between-sets');
        expect(match.history.map(h => h.entryType)).toEqual(['point', 'set-end']);
        expect(result.current.pendingSetEnd).toBe(false);
        expect(onEvent).toHaveBeenCalledWith({ type: 'SetEnded' });
    });

    test('undo restores score and server, and resyncs the rally', () => {
        const { result } = setup({ currentServer: 'teamA' });
        act(() => result.current.scorePoint('teamB'));

        act(() => result.current.undoLastHistoryEntry());

        const { match, rally } = result.current;
        expect(match.scores).toEqual({ teamA: 0, teamB: 0 });
        expect(match.currentServer).toBe('teamA');
        expect(match.history).toHaveLength(0);
        expect(rally.possession).toBe('teamA');
    });

    test('undoing a set-ending point reverts the set end and the point together', () => {
        const { result } = setup({ scores: { teamA: 24, teamB: 10 }, currentServer: 'teamB' });
        act(() => result.current.scorePoint('teamA'));

        act(() => result.current.undoLastHistoryEntry());

        const { match, rally } = result.current;
        expect(match.scores).toEqual({ teamA: 24, teamB: 10 });
        expect(match.setsWon).toEqual({ teamA: 0, teamB: 0 });
        expect(match.matchPhase).toBe('in-progress');
        expect(match.currentServer).toBe('teamB');
        expect(match.history).toHaveLength(0);
        expect(rally.possession).toBe('teamB');
    });
});

describe('useMatchManager — adjustScore', () => {
    test('is a no-op, with no history entry, when the clamp leaves the score unchanged', () => {
        const { result } = setup({ scores: { teamA: 0, teamB: 3 } });

        act(() => result.current.adjustScore('teamA', -1));

        expect(result.current.match.scores).toEqual({ teamA: 0, teamB: 3 });
        expect(result.current.match.history).toHaveLength(0);
    });

    test('does not hand the serve over, unlike scorePoint', () => {
        const { result } = setup({ currentServer: 'teamA' });

        act(() => result.current.adjustScore('teamB', 1));

        expect(result.current.match.currentServer).toBe('teamA');
        expect(result.current.match.history[0]).toMatchObject({ entryType: 'adjust', delta: 1 });
    });
});
