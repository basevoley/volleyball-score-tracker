import { useCallback, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useMatchContext } from '../../contexts/MatchContext';
import { useConfig } from '../../contexts/ConfigContext';
import type { MatchData, MatchDomainEvent } from '../../types';

// Shape a matchData payload for the overlay (backward-compatible format)
const buildMatchPayload = (
    match: MatchData,
    matchEvent: { type: string | null; details: Record<string, unknown> | null }
) => {
    const lastSet = match.setStats ? Math.max(match.setStats.length - 1, 0) : 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { ...match, matchEvent };
    if (!match.matchStarted && match.setStats.length > 0) {
        payload.currentSetStats = { ...match.setStats[lastSet].statistics };
        payload.scores = { ...match.setScores[lastSet] || match.scores };
        if (!match.winner) {
            payload.setScores = match.setScores.slice(0, -1);
        }
    }
    delete payload.ballPossession;
    delete payload.setStats;
    delete payload.currentSetHistory;
    return payload;
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
