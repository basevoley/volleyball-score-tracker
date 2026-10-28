import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSequenceDispatcher } from '../dispatch';
import { CelebrationGate } from '../../effects/celebrationGate';
import { SET_END_SEQUENCE, MATCH_END_SEQUENCE, TIMEOUT_SEQUENCE } from '../sequences';
import type { MatchDomainEvent, Sequence } from '../../../types';

const gated: Sequence = { ...SET_END_SEQUENCE, id: 'GATED' };
const immediate: Sequence = { ...TIMEOUT_SEQUENCE, id: 'IMMEDIATE' };
const event: MatchDomainEvent = { type: 'SetEnded' };

const setup = (enabled: (id: string) => boolean = () => true) => {
    const gate = new CelebrationGate();
    const run = vi.fn<(s: Sequence) => void>();
    const dispatch = createSequenceDispatcher({ gate, run, isEnabled: enabled });
    return { gate, run, dispatch };
};

describe('createSequenceDispatcher', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('runs unflagged sequences synchronously, never waiting for the gate', () => {
        const { run, dispatch } = setup();
        dispatch(event, [immediate]);
        expect(run).toHaveBeenCalledWith(immediate);
    });

    it('holds a flagged sequence while a celebration is playing and runs it afterwards', async () => {
        const { gate, run, dispatch } = setup();
        dispatch(event, [gated]);
        gate.settle(event, 5500);
        await vi.advanceTimersByTimeAsync(5499);
        expect(run).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(run).toHaveBeenCalledWith(gated);
    });

    it('runs a flagged sequence right away when there is no celebration', async () => {
        const { gate, run, dispatch } = setup();
        gate.settle(event);
        dispatch(event, [gated]);
        await vi.advanceTimersByTimeAsync(0);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('works when the celebration is settled before the dispatch', async () => {
        const { gate, run, dispatch } = setup();
        gate.settle(event, 3000);
        dispatch(event, [gated]);
        await vi.advanceTimersByTimeAsync(2999);
        expect(run).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('drops a flagged sequence when the wait is cancelled by an undo or reset', async () => {
        const { gate, run, dispatch } = setup();
        dispatch(event, [gated]);
        gate.cancelAll();
        gate.settle(event);
        await vi.advanceTimersByTimeAsync(10000);
        expect(run).not.toHaveBeenCalled();
    });

    it('lets only the newest request of a sequence run', async () => {
        const { gate, run, dispatch } = setup();
        const second: MatchDomainEvent = { type: 'SetEnded' };
        dispatch(event, [gated]);
        dispatch(second, [gated]);
        gate.settle(event);
        gate.settle(second);
        await vi.advanceTimersByTimeAsync(0);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('skips disabled sequences', async () => {
        const { gate, run, dispatch } = setup(id => id !== 'GATED');
        gate.settle(event);
        dispatch(event, [gated, immediate]);
        await vi.advanceTimersByTimeAsync(0);
        expect(run.mock.calls.map(c => c[0].id)).toEqual(['IMMEDIATE']);
    });

    it('releases a never-settled wait through the gate safety timeout', async () => {
        const { run, dispatch } = setup();
        dispatch(event, [gated]);
        await vi.advanceTimersByTimeAsync(60000);
        expect(run).toHaveBeenCalledTimes(1);
    });
});

describe('celebration-gated sequences', () => {
    it('only the set-end and match-end sequences wait for the celebration', () => {
        expect(SET_END_SEQUENCE.waitForCelebration).toBe(true);
        expect(MATCH_END_SEQUENCE.waitForCelebration).toBe(true);
        expect(TIMEOUT_SEQUENCE.waitForCelebration).toBeUndefined();
    });
});
