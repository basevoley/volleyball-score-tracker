import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { PreferencesProvider, usePreferences } from '../PreferencesContext';
import { defaultEffectPreferences, EFFECT_PREFERENCES_KEY } from '../../domain/effects/preferences';
import type { MatchDomainEvent } from '../../types';

let listeners: Set<(e: MatchDomainEvent) => void>;
let matchState: { matchPhase: string; teams: { teamA: string; teamB: string } };

vi.mock('../ConfigContext', () => ({
    useConfig: () => ({ config: { afterMatch: { showStats: false } }, setConfig: vi.fn() }),
}));
vi.mock('../MatchContext', () => ({
    useMatchContext: () => ({
        matchManager: { match: { matchPhase: matchState.matchPhase } },
        matchDetails: { teams: matchState.teams },
        addMatchEventListener: (fn: (e: MatchDomainEvent) => void) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
    }),
}));

const wrapper = ({ children }: { children: ReactNode }) => <PreferencesProvider>{children}</PreferencesProvider>;
const emit = (event: MatchDomainEvent) => act(() => listeners.forEach(fn => fn(event)));

describe('PreferencesContext effect preferences', () => {
    beforeEach(() => {
        localStorage.clear();
        listeners = new Set();
        matchState = { matchPhase: 'in-progress', teams: { teamA: 'Alfa', teamB: 'Beta' } };
    });

    it('starts from the defaults', () => {
        const { result } = renderHook(() => usePreferences(), { wrapper });
        expect(result.current.effectPreferences).toEqual(defaultEffectPreferences());
    });

    it('persists texts and modes and restores them on the next load, but not the target', () => {
        const first = renderHook(() => usePreferences(), { wrapper });
        const changed = { ...defaultEffectPreferences(), target: 'both' as const, appendTeamName: true, texts: [] };
        act(() => first.result.current.setEffectPreferences(changed));

        expect(first.result.current.effectPreferences).toEqual(changed);
        expect(JSON.parse(localStorage.getItem(EFFECT_PREFERENCES_KEY)!)).not.toHaveProperty('target');

        const second = renderHook(() => usePreferences(), { wrapper });
        expect(second.result.current.effectPreferences).toEqual({ ...changed, target: 'none' });
    });

    describe('forgetting which team to celebrate', () => {
        const chooseTeam = (result: { current: ReturnType<typeof usePreferences> }) =>
            act(() => result.current.setEffectPreferences({ ...result.current.effectPreferences, target: 'teamA', appendTeamName: true }));

        it('resets the target on a match reset and keeps everything else', () => {
            const { result } = renderHook(() => usePreferences(), { wrapper });
            chooseTeam(result);
            expect(result.current.effectPreferences.target).toBe('teamA');

            emit({ type: 'MatchReset' });
            expect(result.current.effectPreferences.target).toBe('none');
            expect(result.current.effectPreferences.appendTeamName).toBe(true);
        });

        it('keeps the target on other match events', () => {
            const { result } = renderHook(() => usePreferences(), { wrapper });
            chooseTeam(result);
            emit({ type: 'MatchStarted' });
            emit({ type: 'SetEnded' });
            expect(result.current.effectPreferences.target).toBe('teamA');
        });

        it('resets the target when the teams change before the match starts', () => {
            matchState.matchPhase = 'pre-match';
            const { result, rerender } = renderHook(() => usePreferences(), { wrapper });
            chooseTeam(result);
            expect(result.current.effectPreferences.target).toBe('teamA');

            matchState = { ...matchState, teams: { teamA: 'Gamma', teamB: 'Beta' } };
            rerender();
            expect(result.current.effectPreferences.target).toBe('none');
        });

        it('keeps the target when a team is renamed during the match', () => {
            const { result, rerender } = renderHook(() => usePreferences(), { wrapper });
            chooseTeam(result);

            matchState = { ...matchState, teams: { teamA: 'Alfa B', teamB: 'Beta' } };
            rerender();
            expect(result.current.effectPreferences.target).toBe('teamA');
        });
    });
});
