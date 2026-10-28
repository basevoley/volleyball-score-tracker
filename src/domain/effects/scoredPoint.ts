import type { HistoryEntry, MatchDomainEvent, TeamKey } from '../../types';

// Who scored the real point behind a domain event, or null when the event is not a scored point
// (e.g. a "+" correction or a sets-won edit that happens to end a set).
// Read from history so the domain events stay untouched: a point ends in a `rally` or `point`
// entry, optionally followed by the `set-end` entry the same commit appended.
export const scoredPointOf = (event: MatchDomainEvent, history: HistoryEntry[]): TeamKey | null => {
    if (event.type === 'RallyEnded') return event.winner;
    if (event.type !== 'SetEnded' && event.type !== 'MatchEnded') return null;

    let last = history.length - 1;
    if (history[last]?.entryType === 'set-end') last -= 1;
    const entry = history[last];
    if (entry?.entryType === 'rally') return entry.server;
    if (entry?.entryType === 'point') return entry.team;
    return null;
};
