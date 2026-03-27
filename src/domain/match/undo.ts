import type {
    MatchData, HistoryEntry, MatchPhase,
    RallyHistoryEntry, TimeoutHistoryEntry, SubstitutionHistoryEntry,
    AdjustHistoryEntry, SetEndHistoryEntry, SetsWonAdjustHistoryEntry,
} from '../../types';
import { reverseStats } from './stats';
import { checkMatchEnd } from './rules';

const undoRally = (state: MatchData, entry: RallyHistoryEntry): MatchData => ({
    ...state,
    scores: { ...entry.scores, [entry.server]: entry.scores[entry.server] - 1 },
    currentServer: entry.prevServer,
    statistics: reverseStats(state.statistics, entry.statsUpdate),
    currentSetStats: reverseStats(state.currentSetStats, entry.statsUpdate),
    history: state.history.slice(0, -1),
});

const undoTimeout = (state: MatchData, entry: TimeoutHistoryEntry): MatchData => ({
    ...state,
    timeouts: { ...state.timeouts, [entry.team]: state.timeouts[entry.team] - 1 },
    history: state.history.slice(0, -1),
});

const undoSubstitution = (state: MatchData, entry: SubstitutionHistoryEntry): MatchData => ({
    ...state,
    substitutions: { ...state.substitutions, [entry.team]: state.substitutions[entry.team] - 1 },
    history: state.history.slice(0, -1),
});

const undoAdjust = (state: MatchData, entry: AdjustHistoryEntry): MatchData => ({
    ...state,
    scores: { ...entry.scores, [entry.team]: entry.scores[entry.team] - entry.delta },
    currentServer: entry.prevServer,
    history: state.history.slice(0, -1),
});

const undoSetEnd = (state: MatchData, entry: SetEndHistoryEntry): MatchData => ({
    ...state,
    scores: entry.prevScores,
    setsWon: entry.prevSetsWon,
    currentSetStats: entry.prevSetStats,
    currentServer: entry.prevServer,
    timeouts: entry.prevTimeouts,
    substitutions: entry.prevSubstitutions,
    setStats: state.setStats.slice(0, -1),
    matchPhase: 'in-progress' as MatchPhase,
    winner: null,
    history: state.history.slice(0, -1),
});

const undoSetsWonAdjust = (state: MatchData, entry: SetsWonAdjustHistoryEntry, maxSets: number): MatchData => {
    const restoredSetsWon = { ...state.setsWon, [entry.team]: entry.prevSetsWon };
    const stillWinner = checkMatchEnd(restoredSetsWon, maxSets);
    return {
        ...state,
        setsWon: restoredSetsWon,
        winner: stillWinner,
        matchPhase: (stillWinner ? 'ended' : 'in-progress') as MatchPhase,
        history: state.history.slice(0, -1),
    };
};

/** Apply the inverse of the last history entry, returning the updated MatchData. */
export const applyHistoryUndo = (state: MatchData, entry: HistoryEntry, maxSets: number): MatchData => {
    switch (entry.entryType) {
        case 'rally':          return undoRally(state, entry);
        case 'timeout':        return undoTimeout(state, entry);
        case 'substitution':   return undoSubstitution(state, entry);
        case 'adjust':         return undoAdjust(state, entry);
        case 'set-end':        return undoSetEnd(state, entry);
        case 'sets-won-adjust':return undoSetsWonAdjust(state, entry, maxSets);
    }
};
