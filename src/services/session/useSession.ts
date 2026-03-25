import { useCallback, useEffect, useState } from 'react';
import type { Config, MatchData, MatchDetails } from '../../types';
import { initialMatchDetails } from '../../domain/match/defaults';

const STORAGE_KEY = 'vb_tracker_session';

interface SavedSession {
    matchData: MatchData;
    matchDetails: MatchDetails;
    config: Config;
}

export const useSession = (match: MatchData, matchDetails: MatchDetails, config: Config) => {
    const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

    // Read saved session on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as SavedSession;
                const md = parsed.matchData;
                const det = parsed.matchDetails;
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
                    setSavedSession(parsed);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist session on every state change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ matchData: match, matchDetails, config }));
        } catch { /* storage unavailable or quota exceeded */ }
    }, [match, matchDetails, config]);

    const clearSavedSession = useCallback(() => {
        setSavedSession(null);
    }, []);

    const discardSession = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setSavedSession(null);
    }, []);

    return { savedSession, clearSavedSession, discardSession };
};
