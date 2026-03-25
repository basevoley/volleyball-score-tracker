import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../services/socket/SocketContext';
import useAutomationRunner from '../hooks/useAutomationRunner';
import { ALL_SEQUENCES } from '../domain/automation/sequences';
import type { Sequence, SequenceTrigger } from '../types';
import { useConfig } from './ConfigContext';
import { useMatchContext } from './MatchContext';

type SocketEventTrigger = Extract<SequenceTrigger, { type: 'socketEvent' }>;
type AutoSequence = Sequence & { trigger: SocketEventTrigger };

const AutomationContext = createContext<ReturnType<typeof useAutomationRunner> & {
    runSequence: (sequence: Sequence) => void;
    automationsEnabled: Record<string, boolean>;
    toggleAutomation: (id: string) => void;
    manualSequences: Sequence[];
    autoSequences: AutoSequence[];
} | null>(null);

const MANUAL_SEQUENCES = ALL_SEQUENCES.filter(s => s.trigger.type === 'manual');
const AUTO_SEQUENCES = ALL_SEQUENCES.filter(
    (s): s is AutoSequence => s.trigger.type === 'socketEvent'
);

const initialAutomationsEnabled = AUTO_SEQUENCES.reduce<Record<string, boolean>>((acc, seq) => {
    acc[seq.id] = seq.defaultEnabled ?? true;
    return acc;
}, {});

export const AutomationProvider = ({ children }: { children: React.ReactNode }) => {
    const { socket, onSocketEmit } = useSocket();
    const { config, setConfig } = useConfig();
    const { matchManager, matchDetails } = useMatchContext();

    const runner = useAutomationRunner({ config, setConfig, socket: socket! });

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

    const [automationsEnabled, setAutomationsEnabled] = useState(initialAutomationsEnabled);
    const automationsEnabledRef = useRef(automationsEnabled);
    useEffect(() => {
        automationsEnabledRef.current = automationsEnabled;
    }, [automationsEnabled]);

    const toggleAutomation = useCallback((id: string) => {
        setAutomationsEnabled(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // Set up socket event subscriptions for all auto-triggered sequences.
    useEffect(() => {
        const triggerStates = AUTO_SEQUENCES.reduce<Record<string, Record<string, unknown>>>((acc, seq) => {
            acc[seq.id] = { ...(seq.trigger.initialState ?? {}) };
            return acc;
        }, {});

        const byEvent = AUTO_SEQUENCES.reduce<Record<string, AutoSequence[]>>((acc, seq) => {
            const { event } = seq.trigger;
            if (!acc[event]) acc[event] = [];
            acc[event].push(seq);
            return acc;
        }, {});

        const unsubscribes = Object.entries(byEvent).map(([event, sequences]) =>
            onSocketEmit(event, (data) => {
                for (const seq of sequences) {
                    if (!automationsEnabledRef.current[seq.id]) continue;
                    if (seq.trigger.condition(data as Record<string, unknown>, triggerStates[seq.id])) {
                        runnerRunRef.current(seq, () => ctxRef.current);
                    }
                }
            })
        );

        return () => unsubscribes.forEach(fn => fn());
    }, [onSocketEmit]);

    const runSequence = useCallback((sequence: Sequence) => {
        runnerRunRef.current(sequence, () => ctxRef.current);
    }, []);

    const value = {
        ...runner,
        runSequence,
        automationsEnabled,
        toggleAutomation,
        manualSequences: MANUAL_SEQUENCES,
        autoSequences: AUTO_SEQUENCES,
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
