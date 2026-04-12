import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialConfig, initialOverlaySetup } from '../domain/match/defaults';
import { loadOverlaySetup, saveOverlaySetup } from '../services/session/sessionStorage';
import type { RuntimeConfig, OverlaySetup } from '../types';

interface ConfigContextValue {
    config: RuntimeConfig;
    setConfig: React.Dispatch<React.SetStateAction<RuntimeConfig>>;
    overlaySetup: OverlaySetup;
    setOverlaySetup: React.Dispatch<React.SetStateAction<OverlaySetup>>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
    const [config, setConfig] = useState<RuntimeConfig>(initialConfig);
    const [overlaySetup, setOverlaySetup] = useState<OverlaySetup>(
        () => loadOverlaySetup() ?? initialOverlaySetup
    );

    useEffect(() => {
        saveOverlaySetup(overlaySetup);
    }, [overlaySetup]);

    return (
        <ConfigContext.Provider value={{ config, setConfig, overlaySetup, setOverlaySetup }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = (): ConfigContextValue => {
    const ctx = useContext(ConfigContext);
    if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
    return ctx;
};
