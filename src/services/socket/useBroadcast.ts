import { useCallback, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useMatchContext } from '../../contexts/MatchContext';
import { useConfig } from '../../contexts/ConfigContext';
import type { MatchData, MatchDomainEvent, MatchScores, TeamKey, TeamRecord, ComputedTeamStats } from '../../types';
import { computeEffectiveness } from '../../domain/match/stats';

interface MatchEvent {
    type: string | null;
    details: Record<string, unknown> | null;
}

export interface OverlayPayload {
    scores: MatchScores;
    setsWon: MatchScores;
    setScores: MatchScores[];
    currentServer: TeamKey | null;
    matchStarted: boolean;
    timeouts: MatchScores;
    substitutions: MatchScores;
    statistics: TeamRecord<ComputedTeamStats>;
    currentSetStats: TeamRecord<ComputedTeamStats>;
    winner: TeamKey | null;
    matchEvent: MatchEvent;
}

const buildMatchPayload = (match: MatchData, matchEvent: MatchEvent): OverlayPayload => {
    const computedStats: TeamRecord<ComputedTeamStats> = {
        teamA: computeEffectiveness(match.statistics.teamA, match.statistics.teamB),
        teamB: computeEffectiveness(match.statistics.teamB, match.statistics.teamA),
    };

    const isBetweenSets = !match.matchStarted && match.setStats.length > 0;
    const lastSet = Math.max(match.setStats.length - 1, 0);

    let currentSetStats: TeamRecord<ComputedTeamStats>;
    let scores: MatchScores;
    let setScores: MatchScores[];

    if (isBetweenSets) {
        const rawSet = match.setStats[lastSet].statistics;
        currentSetStats = {
            teamA: computeEffectiveness(rawSet.teamA, rawSet.teamB),
            teamB: computeEffectiveness(rawSet.teamB, rawSet.teamA),
        };
        scores = match.setScores[lastSet] ?? match.scores;
        setScores = match.winner ? match.setScores : match.setScores.slice(0, -1);
    } else {
        currentSetStats = {
            teamA: computeEffectiveness(match.currentSetStats.teamA, match.currentSetStats.teamB),
            teamB: computeEffectiveness(match.currentSetStats.teamB, match.currentSetStats.teamA),
        };
        scores = match.scores;
        setScores = match.setScores;
    }

    return {
        scores,
        setsWon: match.setsWon,
        setScores,
        currentServer: match.currentServer,
        matchStarted: match.matchStarted,
        timeouts: match.timeouts,
        substitutions: match.substitutions,
        statistics: computedStats,
        currentSetStats,
        winner: match.winner,
        matchEvent,
    };
};

export const useBroadcast = () => {
    const { socket } = useSocket();
    const { matchManager, matchDetails, addMatchEventListener } = useMatchContext();
    const { config } = useConfig();

    // Always-current refs — callbacks read these without stale closures
    const matchRef = useRef(matchManager.match);
    const teamsRef = useRef(matchDetails.teams);
    const configRef = useRef(config);
    const socketRef = useRef(socket);
    matchRef.current = matchManager.match;
    teamsRef.current = matchDetails.teams;
    configRef.current = config;
    socketRef.current = socket;

    // Derive overlay notification from domain event and emit matchData
    const handleMatchEvent = useCallback((event: MatchDomainEvent) => {
        const teams = teamsRef.current;
        let matchEvent: { type: string | null; details: Record<string, unknown> | null } = { type: null, details: null };
        if (event.type === 'RallyEnded' && event.faultingTeam) {
            matchEvent = { type: 'referee-call', details: { text: 'Falta', team: teams[event.faultingTeam] } };
        } else if (event.type === 'TimeoutCalled') {
            matchEvent = { type: 'timeout', details: { text: 'Tiempo muerto', team: teams[event.team] } };
        } else if (event.type === 'SubstitutionCalled') {
            matchEvent = { type: 'substitution', details: { text: 'Cambio', team: teams[event.team] } };
        } else if (event.type === 'RallyDiscarded') {
            matchEvent = { type: 'referee-call', details: { text: 'Se repite el punto' } };
        }
        socketRef.current?.emit('matchData', buildMatchPayload(matchRef.current, matchEvent));
    }, []);

    useEffect(() => {
        return addMatchEventListener(handleMatchEvent);
    }, [addMatchEventListener, handleMatchEvent]);

    // Emit updateConfig whenever config changes (skip the initial render)
    const isFirstConfigRender = useRef(true);
    useEffect(() => {
        if (isFirstConfigRender.current) {
            isFirstConfigRender.current = false;
            return;
        }
        socketRef.current?.emit('updateConfig', config);
    }, [config]);

    // Emit full current state — call on session restore or any manual resync
    const syncAll = useCallback(() => {
        socketRef.current?.emit('matchData', buildMatchPayload(matchRef.current, { type: null, details: null }));
        socketRef.current?.emit('updateConfig', configRef.current);
    }, []);

    return { syncAll };
};
