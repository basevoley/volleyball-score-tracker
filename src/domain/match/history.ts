import type { HistoryEntry, TeamKey } from '../../types';

/** The team that committed a fault on this entry, if the point was awarded because of one. */
export const getFaultingTeam = (entry: HistoryEntry): TeamKey | null =>
    entry.entryType === 'rally' || entry.entryType === 'point' ? entry.faultingTeam : null;
