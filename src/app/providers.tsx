import React from 'react';
import { ConfigProvider } from '../contexts/ConfigContext';
import { MatchProvider } from '../contexts/MatchContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { AutomationProvider } from '../contexts/AutomationContext';

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
    <ConfigProvider>
        <MatchProvider>
            <PreferencesProvider>
                <AutomationProvider>
                    {children}
                </AutomationProvider>
            </PreferencesProvider>
        </MatchProvider>
    </ConfigProvider>
);
