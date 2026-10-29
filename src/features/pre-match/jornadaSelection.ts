// Shared by both match importers (FMV and Ligas Nacionales). Keys are opaque strings
// (FMV passes jornada ids, Fontventa passes jornada numbers) so the helper stays agnostic.

/**
 * Which jornada a selector should show after loading a group: the operator's previous
 * choice if it still exists (so a refresh doesn't yank them away from what they browsed
 * to), else the federation's current jornada, else the last one.
 */
export function pickInitialJornada(keys: string[], currentKey?: string, previousKey?: string): string {
    if (previousKey && keys.includes(previousKey)) return previousKey;
    if (currentKey && keys.includes(currentKey)) return currentKey;
    return keys[keys.length - 1] ?? '';
}

export function jornadaOptionLabel(numero: string | number, isCurrent: boolean): string {
    return `Jornada ${numero}${isCurrent ? ' (actual)' : ''}`;
}
