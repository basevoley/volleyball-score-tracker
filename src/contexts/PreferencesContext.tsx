import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useConfig } from './ConfigContext';

interface PreferencesContextValue {
    noStats: boolean;
    setNoStats: (val: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
    const [noStats, setNoStatState] = useState(() => Cookies.get('no-stats') === 'true');
    const { config, setConfig } = useConfig();

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
        <PreferencesContext.Provider value={{ noStats, setNoStats }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = (): PreferencesContextValue => {
    const ctx = useContext(PreferencesContext);
    if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
    return ctx;
};
