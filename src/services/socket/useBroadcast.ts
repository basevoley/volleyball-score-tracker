import { useCallback, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useMatchContext } from '../../contexts/MatchContext';
import { useConfig } from '../../contexts/ConfigContext';
import type { MatchData, MatchDetails, MatchDomainEvent, MatchScores, TeamKey, TeamRecord, ComputedTeamStats, MatchPhase, OverlaySetup } from '../../types';
import { computeEffectiveness } from '../../domain/match/stats';

export interface MatchEventPayload {
    timestamp: number;
    type: string | null;
    details: Record<string, unknown> | null;
}

export interface OverlayPayload {
    scores: MatchScores;
    setsWon: MatchScores;
    setScores: MatchScores[];
    currentServer: TeamKey | null;
    matchPhase: MatchPhase;
    timeouts: MatchScores;
    substitutions: MatchScores;
    statistics: TeamRecord<ComputedTeamStats>;
    currentSetStats: TeamRecord<ComputedTeamStats>;
    winner: TeamKey | null;
}

const buildMatchPayload = (match: MatchData): OverlayPayload => {
    const computedStats: TeamRecord<ComputedTeamStats> = {
        teamA: computeEffectiveness(match.statistics.teamA, match.statistics.teamB),
        teamB: computeEffectiveness(match.statistics.teamB, match.statistics.teamA),
    };

    const isBetweenSets = match.matchPhase === 'between-sets';
    const allSetScores = match.setStats.map(s => s.scores);
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
        scores = match.setStats[lastSet].scores;
        setScores = match.winner ? allSetScores : allSetScores.slice(0, -1);
    } else {
        currentSetStats = {
            teamA: computeEffectiveness(match.currentSetStats.teamA, match.currentSetStats.teamB),
            teamB: computeEffectiveness(match.currentSetStats.teamB, match.currentSetStats.teamA),
        };
        scores = match.scores;
        setScores = allSetScores;
    }

    return {
        scores,
        setsWon: match.setsWon,
        setScores,
        currentServer: match.currentServer,
        matchPhase: match.matchPhase,
        timeouts: match.timeouts,
        substitutions: match.substitutions,
        statistics: computedStats,
        currentSetStats,
        winner: match.winner,
    };
};

export const useBroadcast = () => {
    const { socket } = useSocket();
    const { matchManager, matchDetails, addMatchEventListener } = useMatchContext();
    const { config, overlaySetup } = useConfig();

    // Always-current refs — callbacks read these without stale closures
    const matchRef = useRef(matchManager.match);
    const teamsRef = useRef(matchDetails.teams);
    const matchDetailsRef = useRef<MatchDetails>(matchDetails);
    const configRef = useRef(config);
    const overlaySetupRef = useRef<OverlaySetup>(overlaySetup);
    const socketRef = useRef(socket);
    matchRef.current = matchManager.match;
    teamsRef.current = matchDetails.teams;
    matchDetailsRef.current = matchDetails;
    configRef.current = config;
    overlaySetupRef.current = overlaySetup;
    socketRef.current = socket;

    // Derive overlay notification from domain event, emit matchData and a dedicated matchEvent
    const handleMatchEvent = useCallback((event: MatchDomainEvent) => {
        const teams = teamsRef.current;
        let matchEvent: MatchEventPayload | null = null;
        if (event.type === 'RallyEnded' && event.faultingTeam) {
            matchEvent = { timestamp: Date.now(), type: 'referee-call', details: { text: 'Falta', team: teams[event.faultingTeam] } };
        } else if (event.type === 'TimeoutCalled') {
            matchEvent = { timestamp: Date.now(), type: 'timeout', details: { text: 'Tiempo muerto', team: teams[event.team] } };
        } else if (event.type === 'SubstitutionCalled') {
            matchEvent = { timestamp: Date.now(), type: 'substitution', details: { text: 'Cambio', team: teams[event.team] } };
        } else if (event.type === 'RallyDiscarded') {
            matchEvent = { timestamp: Date.now(), type: 'referee-call', details: { text: 'Se repite el punto' } };
        }
        socketRef.current?.emit('matchData', buildMatchPayload(matchRef.current));
        if (matchEvent) {
            socketRef.current?.emit('matchEvent', matchEvent);
        }
    }, []);

    useEffect(() => {
        return addMatchEventListener(handleMatchEvent);
    }, [addMatchEventListener, handleMatchEvent]);

    // Emit updateConfig whenever runtimeConfig changes (skip the initial render)
    const isFirstConfigRender = useRef(true);
    useEffect(() => {
        if (isFirstConfigRender.current) {
            isFirstConfigRender.current = false;
            return;
        }
        socketRef.current?.emit('updateConfig', config);
    }, [config]);

    // Emit overlaySetup whenever it changes (skip the initial render)
    const isFirstOverlaySetupRender = useRef(true);
    useEffect(() => {
        if (isFirstOverlaySetupRender.current) {
            isFirstOverlaySetupRender.current = false;
            return;
        }
        socketRef.current?.emit('overlaySetup', overlaySetup);
    }, [overlaySetup]);

    // Emit matchDetails whenever it changes (skip the initial render)
    const isFirstDetailsRender = useRef(true);
    useEffect(() => {
        if (isFirstDetailsRender.current) {
            isFirstDetailsRender.current = false;
            return;
        }
        socketRef.current?.emit('matchDetails', matchDetails);
    }, [matchDetails]);

    // Respond to handshake with the full current state in the correct format
    useEffect(() => {
        if (!socket) return;
        const handleHandshake = () => {
            socket.emit('handshake-response', {
                message: 'Hello from ControlApp!',
                matchData: buildMatchPayload(matchRef.current),
                runtimeConfig: configRef.current,
                overlaySetup: overlaySetupRef.current,
                matchDetails: matchDetailsRef.current,
            });
        };
        socket.on('handshake', handleHandshake);
        return () => { socket.off('handshake', handleHandshake); };
    }, [socket]);

    // Emit full current state — call on session restore or any manual resync
    const syncAll = useCallback(() => {
        socketRef.current?.emit('matchData', buildMatchPayload(matchRef.current));
        socketRef.current?.emit('updateConfig', configRef.current);
        socketRef.current?.emit('overlaySetup', overlaySetupRef.current);
        socketRef.current?.emit('matchDetails', matchDetailsRef.current);
    }, []);

    return { syncAll };
};
