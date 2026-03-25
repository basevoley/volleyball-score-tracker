import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
    TeamKey, TeamRecord, TeamStats, RallyTeamStats, MatchData, MatchScores,
    RallySnapshot, RallyHistoryEntry, TimeoutHistoryEntry, SubstitutionHistoryEntry, AdjustHistoryEntry,
    MatchDomainEvent,
} from '../types';
import { checkSetEnd, checkMatchEnd } from '../domain/match/rules';
import { calculateUpdatedStatistics, createEmptyMatchStats } from '../domain/match/stats';

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
        setScores: [],
        currentServer: null,
        ballPossession: null,
        matchStarted: false,
        timeouts: { teamA: 0, teamB: 0 },
        substitutions: { teamA: 0, teamB: 0 },
        statistics: createEmptyMatchStats(),
        currentSetStats: createEmptyMatchStats(),
        currentSetHistory: [],
        setStats: [],
        winner: null,
        ...(initialData || {}),
    }));

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

    const [pendingSetUpdate, setPendingSetUpdate] = useState<MatchData | null>(null);

    const confirmSetEnd = useCallback((confirm: boolean) => {
        if (confirm && pendingSetUpdate) {
            setMatch(pendingSetUpdate);
            pendingEventRef.current = pendingSetUpdate.winner
                ? { type: 'MatchEnded', winner: pendingSetUpdate.winner }
                : { type: 'SetEnded' };
        }
        setPendingSetUpdate(null);
    }, [pendingSetUpdate]);

    // Helper to handle set/match end logic
    const handleGameEnd = useCallback((
        state: MatchData,
        scores: MatchScores,
        currentSetStats: TeamRecord<TeamStats>,
        history: MatchData['currentSetHistory']
    ): MatchData => {
        const setWinner = checkSetEnd(scores, state.setsWon, maxSets);
        if (!setWinner) return { ...state, scores, currentSetStats, currentSetHistory: history };

        const newSetsWon = { ...state.setsWon, [setWinner]: state.setsWon[setWinner] + 1 };
        const newSetScores = [...state.setScores, scores];
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
                setScores: newSetScores,
                setStats: newSetStats,
                timeouts: { teamA: 0, teamB: 0 },
                substitutions: { teamA: 0, teamB: 0 },
                winner: matchWinner,
                matchStarted: false,
                currentServer: null,
                ballPossession: null,
            };
        }

        return {
            ...state,
            scores: { teamA: 0, teamB: 0 },
            setsWon: newSetsWon,
            setScores: newSetScores,
            setStats: newSetStats,
            currentSetStats: createEmptyMatchStats(),
            currentSetHistory: [],
            timeouts: { teamA: 0, teamB: 0 },
            substitutions: { teamA: 0, teamB: 0 },
            matchStarted: false,
            currentServer: null,
            ballPossession: null,
        };
    }, [maxSets]);

    const startMatch = useCallback(() => {
        setMatch(prev => ({ ...prev, matchStarted: true }));
        pendingEventRef.current = { type: 'MatchStarted' };
    }, []);

    const resetMatch = useCallback(() => {
        setMatch({
            scores: { teamA: 0, teamB: 0 },
            setsWon: { teamA: 0, teamB: 0 },
            setScores: [],
            currentServer: null,
            ballPossession: null,
            matchStarted: false,
            timeouts: { teamA: 0, teamB: 0 },
            substitutions: { teamA: 0, teamB: 0 },
            statistics: createEmptyMatchStats(),
            currentSetStats: createEmptyMatchStats(),
            currentSetHistory: [],
            setStats: [],
            winner: null,
        });
        pendingEventRef.current = { type: 'MatchReset' };
    }, []);

    const setServer = useCallback((server: TeamKey) => {
        setMatch(prev => ({ ...prev, currentServer: server, ballPossession: server }));
        pendingEventRef.current = { type: 'ServerSet', server };
    }, []);

    const updateBallPossession = useCallback((newPossession: TeamKey, rallyDiscarded = false) => {
        setMatch(prev => ({ ...prev, ballPossession: newPossession }));
        if (rallyDiscarded) {
            pendingEventRef.current = { type: 'RallyDiscarded' };
        }
        // No event for normal possession changes — they are rally-internal
    }, []);

    const endRally = useCallback((
        winner: TeamKey,
        statsUpdate: TeamRecord<RallyTeamStats>,
        faultingTeam: TeamKey | null = null,
        rallySnapshot: RallySnapshot
    ) => {
        setMatch(prev => {
            const newScores = { ...prev.scores, [winner]: prev.scores[winner] + 1 };
            const updatedStatistics = calculateUpdatedStatistics(prev.statistics, statsUpdate);
            const updatedSetStats = calculateUpdatedStatistics(prev.currentSetStats, statsUpdate);

            const newHistoryEntry: RallyHistoryEntry = {
                entryType: 'rally',
                index: (prev.currentSetHistory?.length || 0) + 1,
                timestamp: Date.now(),
                scores: newScores,
                server: winner,
                faultingTeam,
                prevServer: prev.currentServer,
                rallySnapshot,
                statsUpdate,
            };

            const newHistory = [...(prev.currentSetHistory || []), newHistoryEntry];
            const setWinner = checkSetEnd(newScores, prev.setsWon, maxSets);

            if (setWinner) {
                const nextState = handleGameEnd(
                    { ...prev, currentServer: winner, statistics: updatedStatistics },
                    newScores,
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
                newScores,
                updatedSetStats,
                newHistory
            );
        });
    }, [maxSets, handleGameEnd]);

    const callTimeout = useCallback((team: TeamKey) => {
        setMatch(prev => {
            const newEntry: TimeoutHistoryEntry = {
                entryType: 'timeout',
                index: (prev.currentSetHistory?.length || 0) + 1,
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
                index: (prev.currentSetHistory?.length || 0) + 1,
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
                index: (prev.currentSetHistory?.length || 0) + 1,
                timestamp: Date.now(),
                scores: adjustedScores,
                team,
                delta: adjustment,
            };
            const newHistory = [...(prev.currentSetHistory || []), newEntry];
            return handleGameEnd(prev, adjustedScores, prev.currentSetStats, newHistory);
        });
        pendingEventRef.current = { type: 'ScoreAdjusted' };
    }, [handleGameEnd]);

    const updateSetsWon = useCallback((team: TeamKey, newSetsWon: number) => {
        setMatch(prev => {
            const updatedSetsWon = { ...prev.setsWon, [team]: newSetsWon };
            const matchWinner = checkMatchEnd(updatedSetsWon, maxSets);
            if (matchWinner) {
                alert(`${teams[matchWinner]} ha ganado el partido!`);
                pendingEventRef.current = { type: 'MatchEnded', winner: matchWinner };
                return { ...prev, setsWon: updatedSetsWon, winner: matchWinner, matchStarted: false, currentServer: null, ballPossession: null };
            }
            pendingEventRef.current = { type: 'ScoreAdjusted' };
            return { ...prev, setsWon: updatedSetsWon };
        });
    }, [teams, maxSets]);

    const willRallyEndSet = useCallback((winner: TeamKey) => {
        const newScores = { ...match.scores, [winner]: match.scores[winner] + 1 };
        return checkSetEnd(newScores, match.setsWon, maxSets);
    }, [match.scores, match.setsWon, maxSets]);

    return useMemo(() => ({
        match, startMatch, resetMatch, setServer, updateBallPossession, endRally,
        pendingSetEnd: !!pendingSetUpdate,
        confirmSetEnd,
        callTimeout, callSubstitution, adjustScore, updateSetsWon, willRallyEndSet,
    }), [match, startMatch, resetMatch, setServer, updateBallPossession, endRally,
        pendingSetUpdate,
        confirmSetEnd,
        callTimeout, callSubstitution, adjustScore, updateSetsWon, willRallyEndSet,
    ]);
};
