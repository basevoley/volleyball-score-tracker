import { describe, it, expect } from 'vitest';
import { scoredPointOf } from '../scoredPoint';
import type { HistoryEntry, MatchDomainEvent } from '../../../types';

const entry = (entryType: HistoryEntry['entryType'], extra: object = {}) =>
    ({ entryType, timestamp: 0, scores: { teamA: 0, teamB: 0 }, setNumber: 1, ...extra }) as unknown as HistoryEntry;

const rally = (server: 'teamA' | 'teamB') => entry('rally', { server });
const point = (team: 'teamA' | 'teamB') => entry('point', { team });
const adjust = entry('adjust', { team: 'teamA', delta: 1 });
const setEnd = entry('set-end');

const setEnded: MatchDomainEvent = { type: 'SetEnded' };
const matchEnded: MatchDomainEvent = { type: 'MatchEnded', winner: 'teamA' };

describe('scoredPointOf', () => {
    it('takes the scorer of a RallyEnded from the event', () => {
        expect(scoredPointOf({ type: 'RallyEnded', winner: 'teamB', faultingTeam: null }, [])).toBe('teamB');
    });

    it('reads the scorer of a set-ending rally from history', () => {
        expect(scoredPointOf(setEnded, [rally('teamA'), rally('teamB'), setEnd])).toBe('teamB');
    });

    it('reads the scorer of a set-ending no-stats point from history', () => {
        expect(scoredPointOf(setEnded, [point('teamA'), setEnd])).toBe('teamA');
    });

    it('reads the scorer of a match-ending point, not the event winner', () => {
        expect(scoredPointOf(matchEnded, [point('teamB'), setEnd])).toBe('teamB');
    });

    it('is null when a correction ended the set', () => {
        expect(scoredPointOf(setEnded, [point('teamA'), adjust, setEnd])).toBeNull();
    });

    it('is null when a correction ended the match', () => {
        expect(scoredPointOf(matchEnded, [rally('teamA'), adjust, setEnd])).toBeNull();
    });

    it('is null for a sets-won edit that ended the match', () => {
        expect(scoredPointOf(matchEnded, [point('teamA'), entry('sets-won-adjust', { team: 'teamA' })])).toBeNull();
    });

    it('is null on empty history', () => {
        expect(scoredPointOf(setEnded, [])).toBeNull();
    });

    it.each<MatchDomainEvent>([
        { type: 'MatchStarted' },
        { type: 'ScoreAdjusted' },
        { type: 'HistoryUndone' },
        { type: 'TimeoutCalled', team: 'teamA' },
    ])('is null for $type', event => {
        expect(scoredPointOf(event, [point('teamA')])).toBeNull();
    });
});
