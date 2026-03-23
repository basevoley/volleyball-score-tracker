import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import useAutomationRunner from '../hooks/useAutomationRunner';
import { ALL_SEQUENCES } from '../automation/sequences';

const AutomationContext = createContext(null);

const MANUAL_SEQUENCES = ALL_SEQUENCES.filter(s => s.trigger.type === 'manual');
const AUTO_SEQUENCES = ALL_SEQUENCES.filter(s => s.trigger.type === 'socketEvent');

const initialAutomationsEnabled = AUTO_SEQUENCES.reduce((acc, seq) => {
    acc[seq.id] = seq.defaultEnabled ?? true;
    return acc;
}, {});

export const AutomationProvider = ({ children, config, setConfig, matchDetails, matchData }) => {
    const { socket, onSocketEmit } = useSocket();
    const runner = useAutomationRunner({ config, setConfig, socket });

    const hasStats = [...Object.values(matchDetails.stats.teamA), ...Object.values(matchDetails.stats.teamB)]
        .some(val => Number(val) > 0);
    const hasPlayers = (matchDetails.players.teamA?.length > 0) || (matchDetails.players.teamB?.length > 0);
    const hasMatchStats = matchData
        ? [...Object.values(matchData.statistics.teamA), ...Object.values(matchData.statistics.teamB)]
            .some(val => typeof val === 'number' && val > 0)
        : false;

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

    const toggleAutomation = useCallback((id) => {
        setAutomationsEnabled(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // Set up socket event subscriptions for all auto-triggered sequences.
    // Sequences are grouped by socket event so a single listener handles multiple triggers per event.
    // triggerStates holds per-sequence mutable state for stateful conditions (e.g. rising-edge detection).
    useEffect(() => {
        const triggerStates = AUTO_SEQUENCES.reduce((acc, seq) => {
            acc[seq.id] = { ...(seq.trigger.initialState ?? {}) };
            return acc;
        }, {});

        const byEvent = AUTO_SEQUENCES.reduce((acc, seq) => {
            const { event } = seq.trigger;
            if (!acc[event]) acc[event] = [];
            acc[event].push(seq);
            return acc;
        }, {});

        const unsubscribes = Object.entries(byEvent).map(([event, sequences]) =>
            onSocketEmit(event, (data) => {
                for (const seq of sequences) {
                    if (!automationsEnabledRef.current[seq.id]) continue;
                    if (seq.trigger.condition(data, triggerStates[seq.id])) {
                        runnerRunRef.current(seq, () => ctxRef.current);
                    }
                }
            })
        );

        return () => unsubscribes.forEach(fn => fn());
    }, [onSocketEmit]);

    const runSequence = useCallback((sequence) => {
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

export const useAutomation = () => useContext(AutomationContext);
