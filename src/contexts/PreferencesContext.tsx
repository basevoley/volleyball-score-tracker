import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useConfig } from './ConfigContext';
import { useMatchContext } from './MatchContext';
import type { AutomationLayoutMode, EffectPreferences } from '../types';
import { loadEffectPreferences, saveEffectPreferences } from '../domain/effects/preferences';

interface PreferencesContextValue {
    noStats: boolean;
    setNoStats: (val: boolean) => void;
    // Session-only (not persisted): resets to 'preset' on every page load
    automationLayout: AutomationLayoutMode;
    setAutomationLayout: (mode: AutomationLayoutMode) => void;
    // Point celebration (crowd + text effects); persisted in localStorage, except `target`, which
    // lives in memory only and resets on match reset / team change before kick-off
    effectPreferences: EffectPreferences;
    setEffectPreferences: (prefs: EffectPreferences) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
    const [noStats, setNoStatState] = useState(() => Cookies.get('no-stats') === 'true');
    const [automationLayout, setAutomationLayout] = useState<AutomationLayoutMode>('preset');
    const [effectPreferences, setEffectPreferencesState] = useState<EffectPreferences>(loadEffectPreferences);
    const { config, setConfig } = useConfig();
    const { matchManager, matchDetails, addMatchEventListener } = useMatchContext();

    // Which team to celebrate belongs to one match: forget it rather than cheer for the wrong team next time
    const resetCelebrationTarget = useCallback(() => {
        setEffectPreferencesState(prefs => (prefs.target === 'none' ? prefs : { ...prefs, target: 'none' }));
    }, []);

    useEffect(
        () => addMatchEventListener(event => { if (event.type === 'MatchReset') resetCelebrationTarget(); }),
        [addMatchEventListener, resetCelebrationTarget],
    );

    // Before the match starts, different teams mean a different match (mid-match renames keep the target)
    const teamsKey = `${matchDetails.teams.teamA}\u0000${matchDetails.teams.teamB}`;
    const [seenTeamsKey, setSeenTeamsKey] = useState(teamsKey);
    if (teamsKey !== seenTeamsKey) {
        setSeenTeamsKey(teamsKey);
        if (matchManager.match.matchPhase === 'pre-match' && effectPreferences.target !== 'none') {
            setEffectPreferencesState({ ...effectPreferences, target: 'none' });
        }
    }

    const setEffectPreferences = useCallback((prefs: EffectPreferences) => {
        setEffectPreferencesState(prefs);
        saveEffectPreferences(prefs);
    }, []);

    const setNoStats = useCallback((val: boolean) => {
        setNoStatState(val);
    }, []);

    useEffect(() => {
        Cookies.set('no-stats', String(noStats), { expires: 365 });
        if (noStats && config.afterMatch.showStats) {
            setConfig(prev => ({ ...prev, afterMatch: { ...prev.afterMatch, showStats: false } }));
        }
    }, [noStats]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <PreferencesContext.Provider value={{ noStats, setNoStats, automationLayout, setAutomationLayout, effectPreferences, setEffectPreferences }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = (): PreferencesContextValue => {
    const ctx = useContext(PreferencesContext);
    if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
    return ctx;
};
