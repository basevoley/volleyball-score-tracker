import { useCallback, useEffect, useState } from 'react';
import type { RuntimeConfig, OverlaySetup, MatchData, MatchDetails } from '../../types';
import { initialMatchDetails } from '../../domain/match/defaults';
import { loadSession, saveSession, clearSession } from './sessionStorage';

interface SavedSession {
    matchData: MatchData;
    matchDetails: MatchDetails;
    runtimeConfig: RuntimeConfig;
    overlaySetup: OverlaySetup;
}

export const useSession = (
    match: MatchData,
    matchDetails: MatchDetails,
    runtimeConfig: RuntimeConfig,
    overlaySetup: OverlaySetup,
) => {
    const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

    // Read saved session on mount
    useEffect(() => {
        const session = loadSession();
        if (!session) return;

        const { matchData: md, matchDetails: det } = session;
        const hasMatchProgress = md && (
            (md.matchPhase && md.matchPhase !== 'pre-match') ||
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
        saveSession({ matchData: match, matchDetails, runtimeConfig, overlaySetup });
    }, [match, matchDetails, runtimeConfig, overlaySetup]);

    const clearSavedSession = useCallback(() => {
        setSavedSession(null);
    }, []);

    const discardSession = useCallback(() => {
        clearSession();
        setSavedSession(null);
    }, []);

    return { savedSession, clearSavedSession, discardSession };
};
