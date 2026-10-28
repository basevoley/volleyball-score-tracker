import type { MatchDomainEvent, Sequence } from '../../types';
import type { CelebrationGate } from '../effects/celebrationGate';

interface DispatcherDeps {
    gate: Pick<CelebrationGate, 'wait'>;
    run: (sequence: Sequence) => void;
    isEnabled: (sequenceId: string) => boolean;
}

// Runs the sequences bound to a domain event. Those flagged `waitForCelebration` are held until the
// point's celebration is over, and dropped if the wait is cancelled (undo/reset) or a newer event
// for the same sequence arrives meanwhile.
export const createSequenceDispatcher = ({ gate, run, isEnabled }: DispatcherDeps) => {
    const latestRequest = new Map<string, number>();
    let requestCounter = 0;

    return (event: MatchDomainEvent, sequences: Sequence[]): void => {
        for (const sequence of sequences) {
            if (!isEnabled(sequence.id)) continue;
            if (!sequence.waitForCelebration) {
                run(sequence);
                continue;
            }
            const request = ++requestCounter;
            latestRequest.set(sequence.id, request);
            void gate.wait(event).then(outcome => {
                if (outcome === 'released' && latestRequest.get(sequence.id) === request) run(sequence);
            });
        }
    };
};
