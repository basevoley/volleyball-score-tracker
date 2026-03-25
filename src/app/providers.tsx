import React from 'react';
import { ConfigProvider } from '../contexts/ConfigContext';
import { MatchProvider } from '../contexts/MatchContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { AutomationProvider } from '../contexts/AutomationContext';
import { ALL_SEQUENCES } from '../domain/automation/sequences';

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
    <ConfigProvider>
        <MatchProvider>
            <PreferencesProvider>
                <AutomationProvider sequences={ALL_SEQUENCES}>
                    {children}
                </AutomationProvider>
            </PreferencesProvider>
        </MatchProvider>
    </ConfigProvider>
);
