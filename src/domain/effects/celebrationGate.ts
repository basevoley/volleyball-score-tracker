import { GATE_SAFETY_TIMEOUT_MS } from './constants';

export type GateOutcome = 'released' | 'cancelled';

interface Deferred {
    promise: Promise<GateOutcome>;
    resolve: (outcome: GateOutcome) => void;
    done: boolean;
    timers: ReturnType<typeof setTimeout>[];
}

// Order-independent rendezvous between whoever decides how a domain event is celebrated (`settle`)
// and whoever must wait for it (`wait`). Keyed by the event object, which every listener receives by
// reference, so no event needs an id and neither side depends on listener order.
export class CelebrationGate {
    private readonly byEvent = new WeakMap<object, Deferred>();
    private readonly pending = new Set<Deferred>();

    constructor(private readonly safetyTimeoutMs: number = GATE_SAFETY_TIMEOUT_MS) {}

    private entry(event: object): Deferred {
        let deferred = this.byEvent.get(event);
        if (!deferred) {
            let resolve!: (outcome: GateOutcome) => void;
            const promise = new Promise<GateOutcome>(res => { resolve = res; });
            deferred = { promise, resolve, done: false, timers: [] };
            this.byEvent.set(event, deferred);
            this.pending.add(deferred);
        }
        return deferred;
    }

    private finish(deferred: Deferred, outcome: GateOutcome): void {
        if (deferred.done) return;
        deferred.done = true;
        deferred.timers.forEach(clearTimeout);
        this.pending.delete(deferred);
        deferred.resolve(outcome);
    }

    // The event's celebration is over `delayMs` from now (0 = nothing to wait for)
    settle(event: object, delayMs = 0): void {
        const deferred = this.entry(event);
        if (delayMs <= 0) this.finish(deferred, 'released');
        else deferred.timers.push(setTimeout(() => this.finish(deferred, 'released'), delayMs));
    }

    // Resolves when the event has been settled; a safety timeout releases it regardless
    wait(event: object): Promise<GateOutcome> {
        const deferred = this.entry(event);
        if (!deferred.done) {
            deferred.timers.push(setTimeout(() => this.finish(deferred, 'released'), this.safetyTimeoutMs));
        }
        return deferred.promise;
    }

    // Undo or reset: whatever is still pending belongs to a point that no longer exists
    cancelAll(): void {
        [...this.pending].forEach(deferred => this.finish(deferred, 'cancelled'));
    }
}
