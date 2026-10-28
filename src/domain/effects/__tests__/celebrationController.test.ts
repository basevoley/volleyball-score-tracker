import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CelebrationController } from '../celebrationController';
import { CelebrationGate, type GateOutcome } from '../celebrationGate';
import { CELEBRATION_DURATION_MS, CELEBRATION_EXIT_MARGIN_MS } from '../constants';
import type { DialogSpec } from '../plan';
import type { EffectMode, EffectPayload, EffectPreferences, HistoryEntry, MatchDomainEvent } from '../../../types';

const PLAY_MS = CELEBRATION_DURATION_MS + CELEBRATION_EXIT_MARGIN_MS;

const prefs = (text: EffectMode, crowd: EffectMode, over: Partial<EffectPreferences> = {}): EffectPreferences => ({
    target: 'both',
    appendTeamName: false,
    text: { mode: text },
    crowd: { mode: crowd },
    texts: [{ id: 't1', text: 'Uno', effect: 'pop' }],
    ...over,
});

const entry = (entryType: string, extra: object = {}) =>
    ({ entryType, timestamp: 0, scores: { teamA: 0, teamB: 0 }, setNumber: 1, ...extra }) as unknown as HistoryEntry;

const rallyEnded = (winner: 'teamA' | 'teamB' = 'teamA'): MatchDomainEvent => ({ type: 'RallyEnded', winner, faultingTeam: null });
const setEnded: MatchDomainEvent = { type: 'SetEnded' };
const matchEnded: MatchDomainEvent = { type: 'MatchEnded', winner: 'teamA' };

const setup = (preferences: EffectPreferences) => {
    const gate = new CelebrationGate();
    const emit = vi.fn<(p: EffectPayload) => void>();
    const dialogs: (DialogSpec | null)[] = [];
    const controller = new CelebrationController({
        gate,
        getPreferences: () => preferences,
        getTeamName: team => (team === 'teamA' ? 'Alfa' : 'Beta'),
        emit,
        onDialogChange: spec => dialogs.push(spec),
        rng: () => 0,
        nextId: (() => { let n = 0; return () => ++n; })(),
    });
    const lastDialog = () => dialogs[dialogs.length - 1] ?? null;
    const watch = (event: MatchDomainEvent) => {
        const state: { outcome: GateOutcome | null } = { outcome: null };
        void gate.wait(event).then(o => { state.outcome = o; });
        return state;
    };
    return { controller, gate, emit, dialogs, lastDialog, watch };
};

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('CelebrationController', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    describe('automatic celebration', () => {
        it('emits one payload at once and holds the gate until it has played', async () => {
            const { controller, emit, watch, dialogs } = setup(prefs('every-point', 'every-point'));
            const event = rallyEnded();
            const gate = watch(event);
            controller.handleEvent(event, []);

            expect(emit).toHaveBeenCalledTimes(1);
            expect(emit).toHaveBeenCalledWith({
                id: 1, team: 'teamA', text: { content: 'Uno', effect: 'pop' }, crowd: true, durationMs: CELEBRATION_DURATION_MS,
            });
            expect(dialogs).toEqual([]);

            await vi.advanceTimersByTimeAsync(PLAY_MS - 1);
            expect(gate.outcome).toBeNull();
            await vi.advanceTimersByTimeAsync(1);
            expect(gate.outcome).toBe('released');
        });

        it('a set-ending point celebrates exactly once and the set-end automation waits for it', async () => {
            const { controller, emit, watch } = setup(prefs('every-point', 'every-point'));
            const gate = watch(setEnded);
            controller.handleEvent(setEnded, [entry('point', { team: 'teamB' }), entry('set-end')]);

            expect(emit).toHaveBeenCalledTimes(1);
            expect(emit.mock.calls[0][0].team).toBe('teamB');
            await flush();
            expect(gate.outcome).toBeNull();
            await vi.advanceTimersByTimeAsync(PLAY_MS);
            expect(gate.outcome).toBe('released');
        });

        it('a match-ending point celebrates exactly once', () => {
            const { controller, emit } = setup(prefs('every-point', 'every-point'));
            controller.handleEvent(matchEnded, [entry('rally', { server: 'teamA' }), entry('set-end')]);
            expect(emit).toHaveBeenCalledTimes(1);
        });
    });

    describe('events that are not a scored point', () => {
        it.each([
            ['a correction ending a set', setEnded, [entry('point', { team: 'teamA' }), entry('adjust'), entry('set-end')]],
            ['a correction ending a match', matchEnded, [entry('adjust'), entry('set-end')]],
            ['a plain correction', { type: 'ScoreAdjusted' } as MatchDomainEvent, [entry('adjust')]],
            ['a timeout', { type: 'TimeoutCalled', team: 'teamA' } as MatchDomainEvent, []],
        ])('%s: no effect, no dialog, gate released immediately', async (_name, event, history) => {
            const { controller, emit, dialogs, watch } = setup(prefs('manual', 'manual'));
            const gate = watch(event);
            controller.handleEvent(event, history);
            await flush();
            expect(emit).not.toHaveBeenCalled();
            expect(dialogs).toEqual([]);
            expect(gate.outcome).toBe('released');
        });

        it('a point from an uncovered team: nothing, gate released immediately', async () => {
            const { controller, emit, dialogs, watch } = setup(prefs('manual', 'manual', { target: 'teamB' }));
            const event = rallyEnded('teamA');
            const gate = watch(event);
            controller.handleEvent(event, []);
            await flush();
            expect(emit).not.toHaveBeenCalled();
            expect(dialogs).toEqual([]);
            expect(gate.outcome).toBe('released');
        });

        it('target "none": nothing at all', async () => {
            const { controller, emit, dialogs, watch } = setup(prefs('every-point', 'every-point', { target: 'none' }));
            const event = rallyEnded();
            const gate = watch(event);
            controller.handleEvent(event, []);
            await flush();
            expect(emit).not.toHaveBeenCalled();
            expect(dialogs).toEqual([]);
            expect(gate.outcome).toBe('released');
        });
    });

    describe('dialog', () => {
        it('opens for a manual part, emits nothing yet, and holds the gate', async () => {
            const { controller, emit, lastDialog, watch } = setup(prefs('manual', 'manual'));
            const event = rallyEnded();
            const gate = watch(event);
            controller.handleEvent(event, []);
            await flush();
            expect(lastDialog()?.variant).toBe('texts');
            expect(emit).not.toHaveBeenCalled();
            expect(gate.outcome).toBeNull();
        });

        it('a text tap emits one payload, closes the dialog and releases the gate after playback', async () => {
            const { controller, emit, dialogs, watch } = setup(prefs('manual', 'manual'));
            const event = rallyEnded();
            const gate = watch(event);
            controller.handleEvent(event, []);
            controller.choose({ kind: 'text', id: 't1', withCrowd: true });

            expect(emit).toHaveBeenCalledTimes(1);
            expect(emit.mock.calls[0][0]).toMatchObject({ text: { content: 'Uno' }, crowd: true });
            expect(dialogs[dialogs.length - 1]).toBeNull();
            await vi.advanceTimersByTimeAsync(PLAY_MS - 1);
            expect(gate.outcome).toBeNull();
            await vi.advanceTimersByTimeAsync(1);
            expect(gate.outcome).toBe('released');
        });

        it('"solo afición" emits a crowd-only payload', () => {
            const { controller, emit } = setup(prefs('manual', 'manual'));
            controller.handleEvent(rallyEnded(), []);
            controller.choose({ kind: 'crowd' });
            expect(emit).toHaveBeenCalledTimes(1);
            expect(emit.mock.calls[0][0]).toMatchObject({ crowd: true });
            expect(emit.mock.calls[0][0].text).toBeUndefined();
        });

        it('dismissing with nothing automatic emits nothing and releases the gate at once', async () => {
            const { controller, emit, dialogs, watch } = setup(prefs('manual', 'manual'));
            const event = rallyEnded();
            const gate = watch(event);
            controller.handleEvent(event, []);
            controller.dismiss();
            await flush();
            expect(emit).not.toHaveBeenCalled();
            expect(dialogs[dialogs.length - 1]).toBeNull();
            expect(gate.outcome).toBe('released');
        });

        it('dismissing keeps the every-point crowd and holds the gate for it', async () => {
            const { controller, emit, watch } = setup(prefs('manual', 'every-point'));
            const event = rallyEnded();
            const gate = watch(event);
            controller.handleEvent(event, []);
            controller.dismiss();
            await flush();
            expect(emit).toHaveBeenCalledTimes(1);
            expect(emit.mock.calls[0][0]).toMatchObject({ crowd: true });
            expect(emit.mock.calls[0][0].text).toBeUndefined();
            expect(gate.outcome).toBeNull();
            await vi.advanceTimersByTimeAsync(PLAY_MS);
            expect(gate.outcome).toBe('released');
        });

        it('yes/no dialog: dismissing or "No" keeps the every-point text, "Sí" adds the crowd', () => {
            const dismissed = setup(prefs('every-point', 'manual'));
            dismissed.controller.handleEvent(rallyEnded(), []);
            dismissed.controller.dismiss();
            expect(dismissed.emit.mock.calls[0][0]).toMatchObject({ text: { content: 'Uno' }, crowd: false });

            const accepted = setup(prefs('every-point', 'manual'));
            accepted.controller.handleEvent(rallyEnded(), []);
            accepted.controller.choose({ kind: 'confirm', accept: true });
            expect(accepted.emit.mock.calls[0][0]).toMatchObject({ text: { content: 'Uno' }, crowd: true });
            expect(accepted.emit).toHaveBeenCalledTimes(1);
        });

        it('a newer point supersedes an unanswered dialog and releases its gate', async () => {
            const { controller, emit, dialogs, watch } = setup(prefs('manual', 'manual'));
            const first = setEnded;
            const gate = watch(first);
            controller.handleEvent(first, [entry('point', { team: 'teamA' }), entry('set-end')]);
            controller.handleEvent(rallyEnded('teamB'), []);
            await flush();

            expect(emit).not.toHaveBeenCalled();
            expect(gate.outcome).toBe('released');
            expect(dialogs.filter(d => d !== null)).toHaveLength(2);
            expect(dialogs[dialogs.length - 1]?.team).toBe('teamB');
        });

        it('choosing or dismissing with no dialog open does nothing', () => {
            const { controller, emit } = setup(prefs('manual', 'manual'));
            controller.choose({ kind: 'crowd' });
            controller.dismiss();
            expect(emit).not.toHaveBeenCalled();
        });

        it('a timeout or other unrelated event leaves the dialog open', () => {
            const { controller, dialogs } = setup(prefs('manual', 'manual'));
            controller.handleEvent(rallyEnded(), []);
            controller.handleEvent({ type: 'TimeoutCalled', team: 'teamA' }, []);
            expect(dialogs[dialogs.length - 1]).not.toBeNull();
        });
    });

    describe('undo and reset', () => {
        it.each<MatchDomainEvent>([{ type: 'HistoryUndone' }, { type: 'MatchReset' }])('%o closes the dialog and cancels the pending gate', async event => {
            const { controller, emit, dialogs, watch } = setup(prefs('manual', 'manual'));
            const pointEvent = setEnded;
            const gate = watch(pointEvent);
            controller.handleEvent(pointEvent, [entry('point', { team: 'teamA' }), entry('set-end')]);
            controller.handleEvent(event, []);
            await flush();

            expect(dialogs[dialogs.length - 1]).toBeNull();
            expect(emit).not.toHaveBeenCalled();
            expect(gate.outcome).toBe('cancelled');
        });

        it('cancels a celebration that is still playing', async () => {
            const { controller, watch } = setup(prefs('every-point', 'every-point'));
            const pointEvent = setEnded;
            const gate = watch(pointEvent);
            controller.handleEvent(pointEvent, [entry('point', { team: 'teamA' }), entry('set-end')]);
            controller.handleEvent({ type: 'HistoryUndone' }, []);
            await flush();
            expect(gate.outcome).toBe('cancelled');
        });
    });
});
