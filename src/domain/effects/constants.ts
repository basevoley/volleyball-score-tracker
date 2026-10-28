import type { TextEffectId } from '../../types';

// Time the overlay plays a celebration; sent in the payload so tracker and overlay share one value
export const CELEBRATION_DURATION_MS = 4000;
// Extra wait for the crowd's exit animation before automations may take over the screen
export const CELEBRATION_EXIT_MARGIN_MS = 1500;
// How long the point dialog stays open
export const DIALOG_TIMEOUT_MS = 5000;
// Upper bound for an automation waiting on a celebration, whatever happens to the dialog
export const GATE_SAFETY_TIMEOUT_MS = DIALOG_TIMEOUT_MS + CELEBRATION_DURATION_MS + CELEBRATION_EXIT_MARGIN_MS + 1000;

export const TEXT_EFFECTS: { id: TextEffectId; label: string }[] = [
    { id: 'superman', label: 'Superman' },
    { id: 'explosion', label: 'Explosión circular' },
    { id: 'pop', label: 'Pop' },
    { id: 'shooting', label: 'Disparo' },
    { id: 'glitch', label: 'Glitch' },
    { id: 'jumbotron', label: 'Jumbotron' },
    { id: 'slam', label: 'Impacto' },
    { id: 'laser', label: 'Láser' },
    { id: 'sonic', label: 'Rápido' },
    { id: 'wave', label: 'Ola' },
];
