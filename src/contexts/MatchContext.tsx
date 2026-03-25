import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useMatchManager } from '../hooks/useMatchManager';
import { initialMatchData, initialMatchDetails } from '../domain/match/defaults';
import type { MatchData, MatchDetails, MatchDomainEvent } from '../types';

type MatchManager = ReturnType<typeof useMatchManager>;

interface MatchContextValue {
    matchManager: MatchManager;
    matchDetails: MatchDetails;
    setMatchDetails: React.Dispatch<React.SetStateAction<MatchDetails>>;
    setOnMatchEvent: (fn: ((e: MatchDomainEvent) => void) | null) => void;
    restoreSession: (data: { matchData: MatchData; matchDetails: MatchDetails }) => void;
}

const MatchContext = createContext<MatchContextValue | null>(null);

export const MatchProvider = ({ children }: { children: React.ReactNode }) => {
    const [matchDetails, setMatchDetails] = useState<MatchDetails>(initialMatchDetails);

    // Stable ref for onEvent delegation — Match.tsx registers its socket emission handler here
    const onMatchEventRef = useRef<((e: MatchDomainEvent) => void) | null>(null);
    const stableOnEvent = useCallback((event: MatchDomainEvent) => {
        onMatchEventRef.current?.(event);
    }, []);
    const setOnMatchEvent = useCallback((fn: ((e: MatchDomainEvent) => void) | null) => {
        onMatchEventRef.current = fn;
    }, []);

    const matchManager = useMatchManager(
        initialMatchData,
        matchDetails.teams,
        matchDetails.maxSets,
        stableOnEvent
    );

    // Always-current ref to matchManager so restoreSession is stable
    const matchManagerRef = useRef(matchManager);
    matchManagerRef.current = matchManager;

    const restoreSession = useCallback((data: { matchData: MatchData; matchDetails: MatchDetails }) => {
        matchManagerRef.current.restoreMatch(data.matchData);
        setMatchDetails(data.matchDetails);
    }, []);

    return (
        <MatchContext.Provider value={{ matchManager, matchDetails, setMatchDetails, setOnMatchEvent, restoreSession }}>
            {children}
        </MatchContext.Provider>
    );
};

export const useMatchContext = (): MatchContextValue => {
    const ctx = useContext(MatchContext);
    if (!ctx) throw new Error('useMatchContext must be used within MatchProvider');
    return ctx;
};
