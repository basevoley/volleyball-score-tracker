import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, screen, fireEvent } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { MatchProvider, useMatchContext } from '../MatchContext';
import { EffectsProvider, useEffects } from '../EffectsContext';
import { defaultEffectPreferences } from '../../domain/effects/preferences';
import { CELEBRATION_DURATION_MS, CELEBRATION_EXIT_MARGIN_MS } from '../../domain/effects/constants';
import type { EffectPreferences } from '../../types';

const emit = vi.fn();
let preferences: EffectPreferences;

vi.mock('../PreferencesContext', () => ({ usePreferences: () => ({ effectPreferences: preferences }) }));
vi.mock('../../services/socket/SocketContext', () => ({ useSocket: () => ({ socket: { emit } }) }));

const fullyAutomatic = (): EffectPreferences => ({
    ...defaultEffectPreferences(),
    target: 'both',
    text: { mode: 'every-point' },
    crowd: { mode: 'every-point' },
});

// Exposes the real match manager and the gate to the test body
const captured: { match?: ReturnType<typeof useMatchContext>['matchManager']; gate?: ReturnType<typeof useEffects>['gate'] } = {};
const Probe = () => {
    const { matchManager } = useMatchContext();
    const { gate } = useEffects();
    useEffect(() => {
        captured.match = matchManager;
        captured.gate = gate;
    });
    return null;
};

const mount = (ui: ReactNode = null) =>
    render(
        <MatchProvider>
            <EffectsProvider>
                <Probe />
                {ui}
            </EffectsProvider>
        </MatchProvider>,
    );

const scorePoints = (team: 'teamA' | 'teamB', count: number) => {
    for (let i = 0; i < count; i++) act(() => captured.match!.scorePoint(team));
};

describe('EffectsProvider with the real match flow', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        emit.mockClear();
        preferences = fullyAutomatic();
    });
    afterEach(() => vi.useRealTimers());

    const startMatch = () => {
        mount();
        act(() => captured.match!.startMatch());
        act(() => captured.match!.setServer('teamA'));
        emit.mockClear();
    };

    it('emits one triggerEffect per scored point', () => {
        startMatch();
        scorePoints('teamA', 3);
        expect(emit).toHaveBeenCalledTimes(3);
        expect(emit.mock.calls[0][0]).toBe('triggerEffect');
        expect(emit.mock.calls[0][1]).toMatchObject({ team: 'teamA', crowd: true, durationMs: CELEBRATION_DURATION_MS });
    });

    it('a set-ending point celebrates once, for the scorer', () => {
        startMatch();
        scorePoints('teamB', 24);
        emit.mockClear();
        scorePoints('teamB', 1);
        expect(captured.match!.match.setsWon.teamB).toBe(1);
        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit.mock.calls[0][1]).toMatchObject({ team: 'teamB' });
    });

    it('a "+" correction that ends the set does not celebrate', () => {
        startMatch();
        scorePoints('teamA', 24);
        emit.mockClear();
        act(() => captured.match!.adjustScore('teamA', 1));
        expect(captured.match!.match.setsWon.teamA).toBe(1);
        expect(emit).not.toHaveBeenCalled();
    });

    it('opens the dialog for a manual celebration and emits when a button is tapped', () => {
        preferences = { ...fullyAutomatic(), text: { mode: 'manual' }, crowd: { mode: 'manual' } };
        startMatch();
        scorePoints('teamA', 1);
        expect(emit).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'PUNTAZO!!!' }));
        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit.mock.calls[0][1]).toMatchObject({ text: { content: 'PUNTAZO!!!' }, crowd: true });
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('closes the dialog without emitting when the point is undone', () => {
        preferences = { ...fullyAutomatic(), text: { mode: 'manual' }, crowd: { mode: 'manual' } };
        startMatch();
        scorePoints('teamA', 1);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        act(() => captured.match!.undoLastHistoryEntry());
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(emit).not.toHaveBeenCalled();
    });

    it('does nothing while the feature is off', () => {
        preferences = { ...fullyAutomatic(), target: 'none' };
        startMatch();
        scorePoints('teamA', 2);
        expect(emit).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('releases the gate of a celebrated event only after playback', async () => {
        startMatch();
        scorePoints('teamA', 24);
        let released = false;
        const gate = captured.gate!;
        const original = gate.settle.bind(gate);
        vi.spyOn(gate, 'settle').mockImplementation((event, delay) => {
            void gate.wait(event).then(() => { released = true; });
            original(event, delay);
        });

        scorePoints('teamA', 1);
        await vi.advanceTimersByTimeAsync(CELEBRATION_DURATION_MS + CELEBRATION_EXIT_MARGIN_MS - 1);
        expect(released).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        expect(released).toBe(true);
    });
});
