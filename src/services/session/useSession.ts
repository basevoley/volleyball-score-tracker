import { useCallback, useEffect, useState } from 'react';
import type { Config, MatchData, MatchDetails } from '../../types';
import { initialMatchDetails } from '../../domain/match/defaults';
import { loadSession, saveSession, clearSession } from './sessionStorage';

interface SavedSession {
    matchData: MatchData;
    matchDetails: MatchDetails;
    config: Config;
}

export const useSession = (match: MatchData, matchDetails: MatchDetails, config: Config) => {
    const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

    // Read saved session on mount
    useEffect(() => {
        const session = loadSession();
        if (!session) return;

        const { matchData: md, matchDetails: det } = session;
        const hasMatchProgress = md && (
            md.matchStarted ||
            md.scores?.teamA > 0 || md.scores?.teamB > 0 ||
            md.setsWon?.teamA > 0 || md.setsWon?.teamB > 0
        );
        const hasCustomSetup = det && (
            det.teams?.teamA !== initialMatchDetails.teams.teamA ||
            det.teams?.teamB !== initialMatchDetails.teams.teamB
        );
        if (hasMatchProgress || hasCustomSetup) {
            setSavedSession(session);
        } else {
            clearSession();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist session on every state change
    useEffect(() => {
        saveSession({ matchData: match, matchDetails, config });
    }, [match, matchDetails, config]);

    const clearSavedSession = useCallback(() => {
        setSavedSession(null);
    }, []);

    const discardSession = useCallback(() => {
        clearSession();
        setSavedSession(null);
    }, []);

    return { savedSession, clearSavedSession, discardSession };
};
