import { useState, useCallback, useMemo, useRef } from 'react';
import type {
    TeamKey, TeamRecord, TeamStats, RallyTeamStats, MatchData, MatchScores,
    RallySnapshot, RallyHistoryEntry, TimeoutHistoryEntry, SubstitutionHistoryEntry, AdjustHistoryEntry,
} from '../types';
import { checkSetEnd, checkMatchEnd } from '../domain/match/rules';
import { calculateUpdatedStatistics, createEmptyMatchStats } from '../domain/match/stats';

// --- Hook ---
export const useMatchManager = (
    initialData: Partial<MatchData> | null,
    teams: TeamRecord<string>,
    maxSets: number
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
        matchEvent: { type: null, details: null },
        ...(initialData || {}),
    }));

    const matchEventRef = useRef<{ type: string } | null>(null);

    const [pendingSetUpdate, setPendingSetUpdate] = useState<MatchData | null>(null);

    const confirmSetEnd = useCallback((confirm: boolean) => {
        if (confirm && pendingSetUpdate) {
            setMatch(pendingSetUpdate);
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

    // Simple actions
    const startMatch = useCallback(() => {
        setMatch(prev => ({ ...prev, matchStarted: true }));
        matchEventRef.current = { type: 'START_MATCH' };
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
            matchEvent: { type: null, details: null },
        });
        matchEventRef.current = { type: 'RESET_MATCH' };
    }, []);

    const setServer = useCallback((server: TeamKey) => {
        setMatch(prev => ({ ...prev, currentServer: server, ballPossession: server }));
        matchEventRef.current = { type: 'SET_CURRENT_SERVER' };
    }, []);

    const updateBallPossession = useCallback((newPossession: TeamKey, rallyDiscarded = false) => {
        setMatch(prev => ({
            ...prev,
            ballPossession: newPossession,
            matchEvent: rallyDiscarded ? { type: 'referee-call', details: { text: 'Se repite el punto' } } : prev.matchEvent,
        }));
        matchEventRef.current = { type: 'UPDATE_BALL_POSSESSION' };
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
            const matchEvent = faultingTeam
                ? { type: 'referee-call', details: { text: 'Falta', team: teams[faultingTeam] } }
                : prev.matchEvent;

            const setWinner = checkSetEnd(newScores, prev.setsWon, maxSets);

            if (setWinner) {
                const nextState = handleGameEnd(
                    { ...prev, currentServer: winner, statistics: updatedStatistics },
                    newScores,
                    updatedSetStats,
                    newHistory
                );
                setPendingSetUpdate(nextState);
                return prev;
            }

            return handleGameEnd(
                { ...prev, currentServer: winner, matchEvent, statistics: updatedStatistics },
                newScores,
                updatedSetStats,
                newHistory
            );
        });
        matchEventRef.current = { type: 'RALLY_END' };
    }, [teams, maxSets, handleGameEnd]);

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
                matchEvent: { type: 'timeout', details: { text: 'Tiempo muerto', team: teams[team] } },
            };
        });
        matchEventRef.current = { type: 'TIMEOUT' };
    }, [teams]);

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
                matchEvent: { type: 'substitution', details: { text: 'Cambio', team: teams[team] } },
            };
        });
        matchEventRef.current = { type: 'SUBSTITUTION' };
    }, [teams]);

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
        matchEventRef.current = { type: 'ADJUST_SCORE' };
    }, [handleGameEnd]);

    const updateSetsWon = useCallback((team: TeamKey, newSetsWon: number) => {
        setMatch(prev => {
            const updatedSetsWon = { ...prev.setsWon, [team]: newSetsWon };
            const matchWinner = checkMatchEnd(updatedSetsWon, maxSets);

            if (matchWinner) {
                alert(`${teams[matchWinner]} ha ganado el partido!`);
                return { ...prev, setsWon: updatedSetsWon, winner: matchWinner, matchStarted: false, currentServer: null, ballPossession: null };
            }

            return { ...prev, setsWon: updatedSetsWon };
        });
        matchEventRef.current = { type: 'UPDATE_SETS_WON' };
    }, [teams, maxSets]);

    const clearMatchEvent = useCallback(() => {
        setMatch(prev => ({ ...prev, matchEvent: { type: null, details: null } }));
    }, []);

    const getLastAction = useCallback(() => matchEventRef.current, []);
    const clearLastAction = useCallback(() => { matchEventRef.current = null; }, []);

    const willRallyEndSet = useCallback((winner: TeamKey) => {
        const newScores = { ...match.scores, [winner]: match.scores[winner] + 1 };
        return checkSetEnd(newScores, match.setsWon, maxSets);
    }, [match.scores, match.setsWon, maxSets]);

    return useMemo(() => ({
        match, startMatch, resetMatch, setServer, updateBallPossession, endRally,
        pendingSetEnd: !!pendingSetUpdate,
        confirmSetEnd,
        callTimeout, callSubstitution, adjustScore, updateSetsWon, clearMatchEvent, getLastAction, clearLastAction, willRallyEndSet,
    }), [match, startMatch, resetMatch, setServer, updateBallPossession, endRally,
        pendingSetUpdate,
        confirmSetEnd,
        callTimeout, callSubstitution, adjustScore, updateSetsWon, clearMatchEvent, getLastAction, clearLastAction, willRallyEndSet,
    ]);
};
