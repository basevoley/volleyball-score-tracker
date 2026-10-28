import type { Celebration, EffectPayload, EffectPreferences, HistoryEntry, MatchDomainEvent, TeamKey } from '../../types';
import { CELEBRATION_DURATION_MS, CELEBRATION_EXIT_MARGIN_MS } from './constants';
import type { CelebrationGate } from './celebrationGate';
import { planPointEffects, type DialogChoice, type DialogSpec } from './plan';
import { scoredPointOf } from './scoredPoint';

export interface CelebrationDeps {
    gate: CelebrationGate;
    getPreferences: () => EffectPreferences;
    getTeamName: (team: TeamKey) => string;
    emit: (payload: EffectPayload) => void;
    onDialogChange: (spec: DialogSpec | null) => void;
    rng?: () => number;
    // Generates payload ids; overridable for tests
    nextId?: () => number;
}

interface OpenDialog { event: MatchDomainEvent; spec: DialogSpec }

// Turns domain events into at most one celebration per scored point, and tells the gate when it is over.
// Framework-free so the whole decision flow is testable without React.
export class CelebrationController {
    private open: OpenDialog | null = null;
    private counter = Date.now();

    constructor(private deps: CelebrationDeps) {}

    // Swap in fresher callbacks (e.g. after the owner re-renders) without losing the open dialog
    setDeps(deps: CelebrationDeps): void {
        this.deps = deps;
    }

    handleEvent(event: MatchDomainEvent, history: HistoryEntry[]): void {
        if (event.type === 'HistoryUndone' || event.type === 'MatchReset') {
            this.closeDialog();
            this.deps.gate.cancelAll();
            return;
        }

        const scorer = scoredPointOf(event, history);
        if (!scorer) {
            this.deps.gate.settle(event);
            return;
        }

        // A newer point supersedes a dialog nobody answered
        this.finish(null);

        const plan = planPointEffects(this.deps.getPreferences(), scorer, this.deps.getTeamName(scorer), this.deps.rng);
        if (plan.dialog) {
            this.open = { event, spec: plan.dialog };
            this.deps.onDialogChange(plan.dialog);
        } else {
            this.play(plan.immediate, event);
        }
    }

    choose(choice: DialogChoice): void {
        if (this.open) this.finish(this.open.spec.resolve(choice));
    }

    dismiss(): void {
        if (this.open) this.finish(this.open.spec.onDismiss);
    }

    // Close the open dialog (if any) and play what it decided; null = nothing to celebrate
    private finish(celebration: Celebration | null): void {
        const open = this.open;
        if (!open) return;
        this.closeDialog();
        this.play(celebration, open.event);
    }

    private closeDialog(): void {
        if (!this.open) return;
        this.open = null;
        this.deps.onDialogChange(null);
    }

    private play(celebration: Celebration | null, event: MatchDomainEvent): void {
        if (!celebration) {
            this.deps.gate.settle(event);
            return;
        }
        this.deps.emit({ ...celebration, id: (this.deps.nextId ?? (() => ++this.counter))(), durationMs: CELEBRATION_DURATION_MS });
        this.deps.gate.settle(event, CELEBRATION_DURATION_MS + CELEBRATION_EXIT_MARGIN_MS);
    }
}
