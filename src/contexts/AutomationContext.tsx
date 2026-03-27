import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import useAutomationRunner from '../hooks/useAutomationRunner';
import type { Sequence, SequenceTrigger } from '../types';
import { useConfig } from './ConfigContext';
import { useMatchContext } from './MatchContext';
import { useBroadcast } from '../services/socket/useBroadcast';

type DomainEventTrigger = Extract<SequenceTrigger, { type: 'domainEvent' }>;
type DomainEventSequence = Sequence & { trigger: DomainEventTrigger };

const AutomationContext = createContext<ReturnType<typeof useAutomationRunner> & {
    runSequence: (sequence: Sequence) => void;
    automationsEnabled: Record<string, boolean>;
    toggleAutomation: (id: string) => void;
    manualSequences: Sequence[];
    autoSequences: DomainEventSequence[];
} | null>(null);

export const AutomationProvider = ({ children, sequences }: { children: React.ReactNode; sequences: Sequence[] }) => {
    const { config, setConfig } = useConfig();
    const { matchManager, matchDetails, addMatchEventListener } = useMatchContext();

    const runner = useAutomationRunner({ config, setConfig });
    const { syncAll } = useBroadcast();

    const hasStats = [...Object.values(matchDetails.stats.teamA), ...Object.values(matchDetails.stats.teamB)]
        .some(val => Number(val) > 0);
    const hasPlayers = (matchDetails.players.teamA?.length > 0) || (matchDetails.players.teamB?.length > 0);
    const hasMatchStats = [...Object.values(matchManager.match.statistics.teamA), ...Object.values(matchManager.match.statistics.teamB)]
        .some(val => typeof val === 'number' && val > 0);

    const ctxRef = useRef({ hasStats, hasPlayers, hasMatchStats });
    useEffect(() => {
        ctxRef.current = { hasStats, hasPlayers, hasMatchStats };
    }, [hasStats, hasPlayers, hasMatchStats]);

    const runnerRunRef = useRef(runner.run);
    useEffect(() => {
        runnerRunRef.current = runner.run;
    }, [runner.run]);

    const runnerStopRef = useRef(runner.stop);
    useEffect(() => {
        runnerStopRef.current = runner.stop;
    }, [runner.stop]);

    const syncAllRef = useRef(syncAll);
    useEffect(() => {
        syncAllRef.current = syncAll;
    }, [syncAll]);

    const manualSequences = sequences.filter(s => s.trigger.type === 'manual');
    const autoSequences = sequences.filter((s): s is DomainEventSequence => s.trigger.type === 'domainEvent');

    const [automationsEnabled, setAutomationsEnabled] = useState(() =>
        autoSequences.reduce<Record<string, boolean>>((acc, seq) => {
            acc[seq.id] = seq.defaultEnabled ?? true;
            return acc;
        }, {})
    );
    const automationsEnabledRef = useRef(automationsEnabled);
    useEffect(() => {
        automationsEnabledRef.current = automationsEnabled;
    }, [automationsEnabled]);

    const toggleAutomation = useCallback((id: string) => {
        setAutomationsEnabled(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // Subscribe to domain events for all auto-triggered sequences
    useEffect(() => {
        const byEvent = autoSequences.reduce<Record<string, DomainEventSequence[]>>((acc, seq) => {
            const { event } = seq.trigger;
            if (!acc[event]) acc[event] = [];
            acc[event].push(seq);
            return acc;
        }, {});

        return addMatchEventListener((event) => {
            if (event.type === 'HistoryUndone') {
                runnerStopRef.current();
                syncAllRef.current();
                return;
            }
            const matching = byEvent[event.type] ?? [];
            for (const seq of matching) {
                if (!automationsEnabledRef.current[seq.id]) continue;
                runnerRunRef.current(seq, () => ctxRef.current);
            }
        });
    }, [addMatchEventListener]); // autoSequences is derived from stable prop

    const runSequence = useCallback((sequence: Sequence) => {
        runnerRunRef.current(sequence, () => ctxRef.current);
    }, []);

    const value = {
        ...runner,
        runSequence,
        automationsEnabled,
        toggleAutomation,
        manualSequences,
        autoSequences,
    };

    return (
        <AutomationContext.Provider value={value}>
            {children}
        </AutomationContext.Provider>
    );
};

export const useAutomation = () => {
    const ctx = useContext(AutomationContext);
    if (!ctx) throw new Error('useAutomation must be used within AutomationProvider');
    return ctx;
};
