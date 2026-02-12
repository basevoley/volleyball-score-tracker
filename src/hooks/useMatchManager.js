import { useState, useCallback, useMemo, useRef } from 'react';

// --- Helper Functions ---
const calculatePercentage = (value, total) =>
    total === 0 ? '0%' : `${((value / total) * 100).toFixed(2)}%`;

const calculateComputedStats = (stats, team) => {
    const opp = team === 'teamA' ? 'teamB' : 'teamA';
    return {
        ...stats,
        [team]: {
            ...stats[team],
            serviceEffectiveness: calculatePercentage(stats[team].ace - stats[team].serveError, stats[team].serve),
            receptionEffectiveness: calculatePercentage(stats[team].reception - stats[team].receptionError, stats[opp].serve),
            attackEffectiveness: calculatePercentage(stats[team].attackPoint - stats[team].attackError, stats[team].attack),
            defenseEffectiveness: calculatePercentage(stats[team].dig - stats[team].digError, stats[opp].attack),
            selfErrors: stats[team].serveError + stats[team].receptionError + stats[team].digError +
                stats[team].attackError + stats[team].blockOut + stats[team].fault || 0,
        },
    };
};

const mergeStats = (current, update, team) =>
    Object.keys(current[team]).reduce((acc, key) => ({
        ...acc,
        [key]: current[team][key] + (update[team]?.[key] || 0),
    }), {});

const calculateUpdatedStatistics = (current, update) => {
    let stats = {
        teamA: mergeStats(current, update, 'teamA'),
        teamB: mergeStats(current, update, 'teamB'),
    };
    return calculateComputedStats(calculateComputedStats(stats, 'teamA'), 'teamB');
};

const createEmptyStats = () => ({
    teamA: {
        serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0,
        attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0,
        selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%',
        attackEffectiveness: '0%', defenseEffectiveness: '0%'
    },
    teamB: {
        serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0,
        attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0,
        selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%',
        attackEffectiveness: '0%', defenseEffectiveness: '0%'
    },
});

const checkSetEnd = (scores, setsWon, maxSets) => {
    const diff = Math.abs(scores.teamA - scores.teamB);
    const required = (setsWon.teamA + setsWon.teamB === maxSets - 1) ? 15 : 25;
    if (scores.teamA >= required && diff >= 2) return 'teamA';
    if (scores.teamB >= required && diff >= 2) return 'teamB';
    return null;
};

const checkMatchEnd = (setsWon, maxSets) => {
    const needed = Math.ceil(maxSets / 2);
    return setsWon.teamA >= needed ? 'teamA' : setsWon.teamB >= needed ? 'teamB' : null;
};

// --- Hook ---
export const useMatchManager = (initialData, teams, maxSets) => {
    const [match, setMatch] = useState(() => ({
        scores: { teamA: 0, teamB: 0 },
        setsWon: { teamA: 0, teamB: 0 },
        setScores: [],
        currentServer: null,
        ballPossession: null,
        matchStarted: false,
        timeouts: { teamA: 0, teamB: 0 },
        substitutions: { teamA: 0, teamB: 0 },
        statistics: createEmptyStats(),
        currentSetStats: createEmptyStats(),
        currentSetHistory: [],
        setStats: [],
        winner: null,
        matchEvent: { type: null, details: null },
        ...(initialData || {}),
    }));

    const matchEventRef = useRef(null);

    // Helper to handle set/match end logic
    const handleGameEnd = useCallback((state, scores, currentSetStats, history) => {
        const setWinner = checkSetEnd(scores, state.setsWon, maxSets);
        if (!setWinner) return { ...state, scores, currentSetStats: currentSetStats, currentSetHistory: history };

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
            currentSetStats: createEmptyStats(),
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
            statistics: createEmptyStats(),
            currentSetStats: createEmptyStats(),
            currentSetHistory: [],
            setStats: [],
            winner: null,
            matchEvent: { type: null, details: null },
        });
        matchEventRef.current = { type: 'RESET_MATCH' };
    }, []);

    const setServer = useCallback((server) => {
        setMatch(prev => ({ ...prev, currentServer: server, ballPossession: server }));
        matchEventRef.current = { type: 'SET_CURRENT_SERVER' };
    }, []);

    const updateBallPossession = useCallback((newPossession, rallyDiscarded = false) => {
        setMatch(prev => ({
            ...prev,
            ballPossession: newPossession,
            matchEvent: rallyDiscarded ? { type: 'referee-call', details: { text: 'Se repite el punto' } } : prev.matchEvent,
        }));
        matchEventRef.current = { type: 'UPDATE_BALL_POSSESSION' };
    }, []);

    const endRally = useCallback((winner, statsUpdate = {}, faultingTeam = null) => {
        setMatch(prev => {
            const newScores = { ...prev.scores, [winner]: prev.scores[winner] + 1 };
            const updatedStatistics = calculateUpdatedStatistics(prev.statistics, statsUpdate);
            const updatedSetStats = calculateUpdatedStatistics(prev.currentSetStats, statsUpdate);

            const newHistoryEntry = {
                index: (prev.currentSetHistory?.length || 0) + 1,
                timestamp: Date.now(),
                scores: newScores,
                event: faultingTeam ? { type: 'fault', team: faultingTeam } : { type: 'rally', details: statsUpdate },
            };

            const newHistory = [...(prev.currentSetHistory || []), newHistoryEntry];
            const matchEvent = faultingTeam
                ? { type: 'referee-call', details: { text: 'Falta', team: teams[faultingTeam] } }
                : prev.matchEvent;

            return handleGameEnd(
                { ...prev, currentServer: winner, matchEvent, statistics: updatedStatistics },
                newScores,
                updatedSetStats,
                newHistory
            );
        });
        matchEventRef.current = { type: 'RALLY_END' };
    }, [teams, handleGameEnd]);

    const callTimeout = useCallback((team) => {
        setMatch(prev => ({
            ...prev,
            timeouts: { ...prev.timeouts, [team]: prev.timeouts[team] + 1 },
            currentSetHistory: [...(prev.currentSetHistory || []), {
                index: (prev.currentSetHistory?.length || 0) + 1,
                timestamp: Date.now(),
                scores: { ...prev.scores },
                event: { type: 'timeout', team },
            }],
            matchEvent: { type: 'timeout', details: { text: 'Tiempo muerto', team: teams[team] } },
        }));
        matchEventRef.current = { type: 'TIMEOUT' };
    }, [teams]);

    const callSubstitution = useCallback((team) => {
        setMatch(prev => ({
            ...prev,
            substitutions: { ...prev.substitutions, [team]: prev.substitutions[team] + 1 },
            currentSetHistory: [...(prev.currentSetHistory || []), {
                index: (prev.currentSetHistory?.length || 0) + 1,
                timestamp: Date.now(),
                scores: { ...prev.scores },
                event: { type: 'substitution', team },
            }],
            matchEvent: { type: 'substitution', details: { text: 'Cambio', team: teams[team] } },
        }));
        matchEventRef.current = { type: 'TIMEOUT' };
    }, [teams]);

    const adjustScore = useCallback((team, adjustment) => {
        setMatch(prev => {
            const adjustedScores = { ...prev.scores, [team]: Math.max(0, prev.scores[team] + adjustment) };
            const newHistory = [...(prev.currentSetHistory || []), {
                index: (prev.currentSetHistory?.length || 0) + 1,
                timestamp: Date.now(),
                scores: adjustedScores,
                event: { type: 'rally' },
            }];

            return handleGameEnd(prev, adjustedScores, prev.currentSetStats, newHistory);
        });
        matchEventRef.current = { type: 'ADJUST_SCORE' };
    }, [handleGameEnd]);

    const updateSetsWon = useCallback((team, newSetsWon) => {
        setMatch(prev => {
            const updatedSetsWon = { ...prev.setsWon, [team]: newSetsWon };
            const matchWinner = checkMatchEnd(updatedSetsWon, maxSets);

            if (matchWinner) {
                alert(`${teams[matchWinner]} ha ganado el partido!`);
                return { ...prev, setsWon: updatedSetsWon, winner: matchWinner, matchStarted: false, currentServer: null, ballPossession: null, };
            }

            return { ...prev, setsWon: updatedSetsWon };
        });
        matchEventRef.current = { type: 'UPDATE_SETS_WON' };

    }, [teams, maxSets]);

    const clearMatchEvent = useCallback(() => { setMatch(prev => ({ ...prev, matchEvent: { type: null, details: null } })); }, []);

    const getLastAction = useCallback(() => matchEventRef.current, []); const clearLastAction = useCallback(() => { matchEventRef.current = null; }, []);

    return useMemo(() => ({ 
        match, startMatch, resetMatch, setServer, updateBallPossession, endRally, callTimeout, callSubstitution, adjustScore, updateSetsWon, clearMatchEvent, getLastAction, clearLastAction, 
    }), [match, startMatch, resetMatch, setServer, updateBallPossession, endRally, callTimeout, callSubstitution, adjustScore, updateSetsWon, clearMatchEvent, getLastAction, clearLastAction,]);
};