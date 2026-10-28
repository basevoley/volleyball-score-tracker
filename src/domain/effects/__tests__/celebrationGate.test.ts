import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CelebrationGate, type GateOutcome } from '../celebrationGate';

const track = (promise: Promise<GateOutcome>) => {
    const state: { outcome: GateOutcome | null } = { outcome: null };
    void promise.then(o => { state.outcome = o; });
    return state;
};

describe('CelebrationGate', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('releases a waiter settled with no delay, whichever side comes first', async () => {
        const gate = new CelebrationGate();
        const settledFirst = {};
        gate.settle(settledFirst);
        expect(await gate.wait(settledFirst)).toBe('released');

        const waitedFirst = {};
        const state = track(gate.wait(waitedFirst));
        gate.settle(waitedFirst);
        await vi.advanceTimersByTimeAsync(0);
        expect(state.outcome).toBe('released');
    });

    it('releases only after the settle delay', async () => {
        const gate = new CelebrationGate();
        const event = {};
        const state = track(gate.wait(event));
        gate.settle(event, 5500);
        await vi.advanceTimersByTimeAsync(5499);
        expect(state.outcome).toBeNull();
        await vi.advanceTimersByTimeAsync(1);
        expect(state.outcome).toBe('released');
    });

    it('applies a delay settled before the wait began', async () => {
        const gate = new CelebrationGate();
        const event = {};
        gate.settle(event, 1000);
        const state = track(gate.wait(event));
        await vi.advanceTimersByTimeAsync(999);
        expect(state.outcome).toBeNull();
        await vi.advanceTimersByTimeAsync(1);
        expect(state.outcome).toBe('released');
    });

    it('keeps events independent', async () => {
        const gate = new CelebrationGate();
        const a = {};
        const b = {};
        const stateB = track(gate.wait(b));
        gate.settle(a);
        await vi.advanceTimersByTimeAsync(0);
        expect(stateB.outcome).toBeNull();
    });

    it('releases a waiter nobody settles after the safety timeout', async () => {
        const gate = new CelebrationGate(20000);
        const state = track(gate.wait({}));
        await vi.advanceTimersByTimeAsync(19999);
        expect(state.outcome).toBeNull();
        await vi.advanceTimersByTimeAsync(1);
        expect(state.outcome).toBe('released');
    });

    it('cancelAll cancels every pending waiter, including ones awaiting a delay', async () => {
        const gate = new CelebrationGate();
        const waiting = {};
        const delayed = {};
        const s1 = track(gate.wait(waiting));
        const s2 = track(gate.wait(delayed));
        gate.settle(delayed, 5000);
        gate.cancelAll();
        await vi.advanceTimersByTimeAsync(0);
        expect(s1.outcome).toBe('cancelled');
        expect(s2.outcome).toBe('cancelled');
    });

    it('does not turn an already released wait into a cancellation', async () => {
        const gate = new CelebrationGate();
        const event = {};
        gate.settle(event);
        const state = track(gate.wait(event));
        gate.cancelAll();
        await vi.advanceTimersByTimeAsync(0);
        expect(state.outcome).toBe('released');
    });
});
