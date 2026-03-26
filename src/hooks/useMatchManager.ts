import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
    TeamKey, TeamRecord, RawTeamStats, RallyTeamStats, MatchData, MatchScores,
    RallySnapshot, RallyHistoryEntry, TimeoutHistoryEntry, SubstitutionHistoryEntry, AdjustHistoryEntry,
    MatchDomainEvent, RallyActionType, MatchPhase,
} from '../types';
import { checkSetEnd, checkMatchEnd } from '../domain/match/rules';
import { calculateUpdatedStatistics, createEmptyMatchStats, createEmptyRallyStats } from '../domain/match/stats';
import { RALLY_ACTION_HANDLERS } from '../domain/rally/actionHandlers';

// --- Hook ---
export const useMatchManager = (
    initialData: Partial<MatchData> | null,
    teams: TeamRecord<string>,
    maxSets: number,
    onEvent?: (event: MatchDomainEvent) => void
) => {
    const [match, setMatch] = useState<MatchData>(() => ({
        scores: { teamA: 0, teamB: 0 },
        setsWon: { teamA: 0, teamB: 0 },
        currentServer: null,
        matchPhase: 'pre-match' as MatchPhase,
        timeouts: { teamA: 0, teamB: 0 },
        substitutions: { teamA: 0, teamB: 0 },
        statistics: createEmptyMatchStats(),
        currentSetStats: createEmptyMatchStats(),
        currentSetHistory: [],
        setStats: [],
        winner: null,
        ...(initialData || {}),
    }));

    // Always-current ref to match state — lets callbacks read it without stale closures
    const matchRef = useRef<MatchData>(match);
    matchRef.current = match;

    // ── Rally state ──────────────────────────────────────────────────────────

    const [rally, setRally] = useState<RallySnapshot>(() => ({
        id: Date.now(),
        stage: 'start',
        possession: initialData?.currentServer || null,
        actionHistory: [],
        stats: createEmptyRallyStats(),
    }));

    // Always-current ref to rally state
    const rallyRef = useRef<RallySnapshot>(rally);
    rallyRef.current = rally;

    // Tracks the initial server for the current rally (used by discardRally to restore)
    const initialPossessionRef = useRef<TeamKey | null>(initialData?.currentServer || null);
    // When a set end is pending, stores the rally winner so confirmSetEnd can reset rally correctly
    const pendingRallyResetServerRef = useRef<TeamKey | null>(null);

    // Reset rally to a new server — internal helper
    const resetRallyInternal = useCallback((newServer: TeamKey | null) => {
        setRally({
            id: Date.now(),
            stage: 'start',
            possession: newServer,
            actionHistory: [],
            stats: createEmptyRallyStats(),
        });
        if (newServer !== null) {
            initialPossessionRef.current = newServer;
        }
    }, []);

    // ── Event machinery ──────────────────────────────────────────────────────

    // Always-current ref to onEvent callback (avoids stale closure)
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    // Pending event to fire after next match state update
    const pendingEventRef = useRef<MatchDomainEvent | null>(null);

    // Fire the pending event after each match state commit
    useEffect(() => {
        const event = pendingEventRef.current;
        if (event !== null && onEventRef.current) {
            pendingEventRef.current = null;
            onEventRef.current(event);
        }
    }, [match]);

    // ── Set-end machinery ────────────────────────────────────────────────────

    const [pendingSetUpdate, setPendingSetUpdate] = useState<MatchData | null>(null);

    const confirmSetEnd = useCallback((confirm: boolean) => {
        if (confirm && pendingSetUpdate) {
            setMatch(pendingSetUpdate);
            pendingEventRef.current = pendingSetUpdate.winner
                ? { type: 'MatchEnded', winner: pendingSetUpdate.winner }
                : { type: 'SetEnded' };
            resetRallyInternal(pendingRallyResetServerRef.current);
        }
        pendingRallyResetServerRef.current = null;
        setPendingSetUpdate(null);
    }, [pendingSetUpdate, resetRallyInternal]);

    // Helper to handle set/match end logic
    const handleGameEnd = useCallback((
        state: MatchData,
        scores: MatchScores,
        currentSetStats: TeamRecord<RawTeamStats>,
        history: MatchData['currentSetHistory']
    ): MatchData => {
        const setWinner = checkSetEnd(scores, state.setsWon, maxSets);
        if (!setWinner) return { ...state, scores, currentSetStats, currentSetHistory: history };

        const newSetsWon = { ...state.setsWon, [setWinner]: state.setsWon[setWinner] + 1 };
        const newSetStats = [...state.setStats, {
            setNumber: state.setsWon.teamA + state.setsWon.teamB + 1,
            scores,
            statistics: currentSetStats,
            history,
        }];

        const matchWinner = checkMatchEnd(newSetsWon, maxSets);
        if (matchWinner) {
            return {
                ...state,
                scores,
                setsWon: newSetsWon,
                setStats: newSetStats,
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                winner: matchWinner,
                matchPhase: 'ended' as MatchPhase,
                currentServer: null,
            };
        }

        return {
            ...state,
            scores: { teamA: 0, teamB: 0 },
            setsWon: newSetsWon,
            setStats: newSetStats,
            currentSetStats: createEmptyMatchStats(),
            currentSetHistory: [],
            timeouts: { teamA: 0, teamB: 0 },
            substitutions: { teamA: 0, teamB: 0 },
            matchPhase: 'between-sets' as MatchPhase,
            currentServer: null,
        };
    }, [maxSets]);

    // ── Match actions ────────────────────────────────────────────────────────

    const startMatch = useCallback(() => {
        setMatch(prev => ({ ...prev, matchPhase: 'in-progress' as MatchPhase }));
        pendingEventRef.current = { type: 'MatchStarted' };
    }, []);

    const resetMatch = useCallback(() => {
        setMatch({
            scores: { teamA: 0, teamB: 0 },
            setsWon: { teamA: 0, teamB: 0 },
            currentServer: null,
            matchPhase: 'pre-match',
            timeouts: { teamA: 0, teamB: 0 },
            substitutions: { teamA: 0, teamB: 0 },
            statistics: createEmptyMatchStats(),
            currentSetStats: createEmptyMatchStats(),
            currentSetHistory: [],
            setStats: [],
            winner: null,
        });
        resetRallyInternal(null);
        pendingEventRef.current = { type: 'MatchReset' };
    }, [resetRallyInternal]);

    const setServer = useCallback((server: TeamKey) => {
        setMatch(prev => ({ ...prev, currentServer: server }));
        resetRallyInternal(server);
        pendingEventRef.current = { type: 'ServerSet', server };
    }, [resetRallyInternal]);

    const endRally = useCallback((winner: TeamKey, faultingTeam: TeamKey | null = null) => {
        const currentRally = rallyRef.current;

        // Pre-compute set-end using current match state (same snapshot setMatch updater sees as `prev`)
        const currentMatch = matchRef.current;
        const newScores = { ...currentMatch.scores, [winner]: currentMatch.scores[winner] + 1 };
        const willEndSet = !!checkSetEnd(newScores, currentMatch.setsWon, maxSets);

        if (willEndSet) {
            pendingRallyResetServerRef.current = winner;
        }

        setMatch(prev => {
            const updatedScores = { ...prev.scores, [winner]: prev.scores[winner] + 1 };
            const updatedStatistics = calculateUpdatedStatistics(prev.statistics, currentRally.stats);
            const updatedSetStats = calculateUpdatedStatistics(prev.currentSetStats, currentRally.stats);

            const newHistoryEntry: RallyHistoryEntry = {
                entryType: 'rally',
                timestamp: Date.now(),
                scores: updatedScores,
                server: winner,
                faultingTeam,
                prevServer: prev.currentServer,
                rallySnapshot: currentRally,
                statsUpdate: currentRally.stats,
            };

            const newHistory = [...(prev.currentSetHistory || []), newHistoryEntry];
            const setWinner = checkSetEnd(updatedScores, prev.setsWon, maxSets);

            if (setWinner) {
                const nextState = handleGameEnd(
                    { ...prev, currentServer: winner, statistics: updatedStatistics },
                    updatedScores,
                    updatedSetStats,
                    newHistory
                );
                setPendingSetUpdate(nextState);
                return prev; // Defer state update until user confirms set end
            }

            // No set end — fire RallyEnded event after state commits
            pendingEventRef.current = { type: 'RallyEnded', winner, faultingTeam };
            return handleGameEnd(
                { ...prev, currentServer: winner, statistics: updatedStatistics },
                updatedScores,
                updatedSetStats,
                newHistory
            );
        });

        // Reset rally immediately for non-set-end case
        if (!willEndSet) {
            resetRallyInternal(winner);
        }
    }, [maxSets, handleGameEnd, resetRallyInternal]);

    const callTimeout = useCallback((team: TeamKey) => {
        setMatch(prev => {
            const newEntry: TimeoutHistoryEntry = {
                entryType: 'timeout',
                timestamp: Date.now(),
                scores: { ...prev.scores },
                team,
            };
            return {
                ...prev,
                timeouts: { ...prev.timeouts, [team]: prev.timeouts[team] + 1 },
                currentSetHistory: [...(prev.currentSetHistory || []), newEntry],
            };
        });
        pendingEventRef.current = { type: 'TimeoutCalled', team };
    }, []);

    const callSubstitution = useCallback((team: TeamKey) => {
        setMatch(prev => {
            const newEntry: SubstitutionHistoryEntry = {
                entryType: 'substitution',
                timestamp: Date.now(),
                scores: { ...prev.scores },
                team,
            };
            return {
                ...prev,
                substitutions: { ...prev.substitutions, [team]: prev.substitutions[team] + 1 },
                currentSetHistory: [...(prev.currentSetHistory || []), newEntry],
            };
        });
        pendingEventRef.current = { type: 'SubstitutionCalled', team };
    }, []);

    const adjustScore = useCallback((team: TeamKey, adjustment: number) => {
        setMatch(prev => {
            const adjustedScores = { ...prev.scores, [team]: Math.max(0, prev.scores[team] + adjustment) };
            const newEntry: AdjustHistoryEntry = {
                entryType: 'adjust',
                timestamp: Date.now(),
                scores: adjustedScores,
                team,
                delta: adjustment,
            };
            const newHistory = [...(prev.currentSetHistory || []), newEntry];
            const newState = handleGameEnd(prev, adjustedScores, prev.currentSetStats, newHistory);
            if (newState.winner) {
                pendingEventRef.current = { type: 'MatchEnded', winner: newState.winner };
            } else if (newState.setsWon.teamA + newState.setsWon.teamB > prev.setsWon.teamA + prev.setsWon.teamB) {
                pendingEventRef.current = { type: 'SetEnded' };
            } else {
                pendingEventRef.current = { type: 'ScoreAdjusted' };
            }
            return newState;
        });
    }, [handleGameEnd]);

    const updateSetsWon = useCallback((team: TeamKey, newSetsWon: number) => {
        setMatch(prev => {
            const updatedSetsWon = { ...prev.setsWon, [team]: newSetsWon };
            const matchWinner = checkMatchEnd(updatedSetsWon, maxSets);
            if (matchWinner) {
                pendingEventRef.current = { type: 'MatchEnded', winner: matchWinner };
                return { ...prev, setsWon: updatedSetsWon, winner: matchWinner, matchPhase: 'ended' as MatchPhase, currentServer: null };
            }
            pendingEventRef.current = { type: 'ScoreAdjusted' };
            return { ...prev, setsWon: updatedSetsWon };
        });
    }, [teams, maxSets]);

    const willRallyEndSet = useCallback((winner: TeamKey) => {
        const newScores = { ...match.scores, [winner]: match.scores[winner] + 1 };
        return checkSetEnd(newScores, match.setsWon, maxSets);
    }, [match.scores, match.setsWon, maxSets]);

    const restoreMatch = useCallback((data: MatchData) => {
        setMatch(data);
        resetRallyInternal(data.currentServer);
    }, [resetRallyInternal]);

    // ── Rally actions ────────────────────────────────────────────────────────

    const handleAction = useCallback((action: string, faultingTeam: TeamKey | null = null) => {
        const handler = RALLY_ACTION_HANDLERS[action as RallyActionType];
        if (!handler) return;

        setRally(prev => {
            const result = handler.apply(prev, faultingTeam ?? undefined);
            return {
                ...prev,
                stats: result.stats,
                stage: result.stage,
                ...(result.possession !== undefined ? { possession: result.possession } : {}),
                actionHistory: [
                    ...prev.actionHistory,
                    { action: action as RallyActionType, team: result.team, rallyStage: prev.stage, previousPossession: prev.possession },
                ],
            };
        });
    }, []);

    const undoLastAction = useCallback(() => {
        setRally(prev => {
            if (prev.actionHistory.length === 0) return prev;

            const lastEntry = prev.actionHistory[prev.actionHistory.length - 1];
            const handler = RALLY_ACTION_HANDLERS[lastEntry.action];
            const newStats = handler.undo(lastEntry, prev.stats);

            return {
                ...prev,
                stats: newStats,
                stage: lastEntry.rallyStage,
                possession: lastEntry.previousPossession || prev.possession,
                actionHistory: prev.actionHistory.slice(0, -1),
            };
        });
    }, []);

    const discardRally = useCallback(() => {
        const server = initialPossessionRef.current;
        setRally({
            id: Date.now(),
            stage: 'start',
            possession: server,
            actionHistory: [],
            stats: createEmptyRallyStats(),
        });
        initialPossessionRef.current = server;
        pendingEventRef.current = { type: 'RallyDiscarded' };
    }, []);

    return useMemo(() => ({
        match,
        startMatch, resetMatch, restoreMatch, setServer, endRally,
        pendingSetEnd: !!pendingSetUpdate,
        confirmSetEnd,
        callTimeout, callSubstitution, adjustScore, updateSetsWon, willRallyEndSet,
        rally,
        handleAction, undoLastAction, discardRally,
        canUndo: rally.actionHistory.length > 0,
    }), [match, startMatch, resetMatch, restoreMatch, setServer, endRally,
        pendingSetUpdate,
        confirmSetEnd,
        callTimeout, callSubstitution, adjustScore, updateSetsWon, willRallyEndSet,
        rally,
        handleAction, undoLastAction, discardRally,
    ]);
};
