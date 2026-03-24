import { useState, useRef, useCallback, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { Config, ConfigChange, Sequence, SequenceStep, AutomationCtx } from '../types';

const applyChanges = (config: Config, changes: ConfigChange[]): Config =>
    changes.reduce(
        (cfg, { section, key, value }) => ({
            ...cfg,
            [section]: { ...cfg[section], [key]: value },
        }),
        { ...config }
    );

interface UseAutomationRunnerParams {
    config: Config;
    setConfig: (config: Config) => void;
    socket: Socket;
}

const useAutomationRunner = ({ config, setConfig, socket }: UseAutomationRunnerParams) => {
    const [isRunning, setIsRunning] = useState(false);
    const [activeSequenceId, setActiveSequenceId] = useState<string | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
    const [activeSteps, setActiveSteps] = useState<SequenceStep[]>([]);

    const configRef = useRef<Config>(config);
    const isRunningRef = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const snapshotRef = useRef<Partial<Config> | null>(null);
    const activeSequenceRef = useRef<Sequence | null>(null);

    useEffect(() => {
        configRef.current = config;
    }, [config]);

    const applySnapshot = useCallback(() => {
        if (!snapshotRef.current) return;
        const restored = Object.entries(snapshotRef.current).reduce(
            (cfg, [section, values]) => ({ ...cfg, [section]: { ...values } }),
            { ...configRef.current }
        );
        snapshotRef.current = null;
        configRef.current = restored;
        setConfig(restored);
        socket.emit('updateConfig', restored);
    }, [setConfig, socket]);

    const stop = useCallback(() => {
        const sequence = activeSequenceRef.current;
        isRunningRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsRunning(false);
        setActiveSequenceId(null);
        setCurrentStepIndex(null);
        setActiveSteps([]);
        activeSequenceRef.current = null;

        if (snapshotRef.current) {
            // Restore snapshotted sections first, then apply resetOnStop on top
            applySnapshot();
        }

        if (sequence?.resetOnStop && sequence.resetOnStop.length > 0) {
            // Apply after snapshot restore; read updated configRef
            const resetConfig = sequence.resetOnStop.reduce(
                (cfg, section) => ({ ...cfg, [section]: { ...cfg[section], enabled: false } }),
                { ...configRef.current }
            );
            configRef.current = resetConfig;
            setConfig(resetConfig);
            socket.emit('updateConfig', resetConfig);
        }
    }, [applySnapshot, setConfig, socket]);

    const run = useCallback((sequence: Sequence, getCtx: () => AutomationCtx = () => ({ hasStats: false, hasPlayers: false, hasMatchStats: false })) => {
        // Interrupt any running sequence cleanly
        if (isRunningRef.current) {
            isRunningRef.current = false;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            snapshotRef.current = null;
            activeSequenceRef.current = null;
        }

        const steps = sequence.steps;
        if (steps.length === 0) return;

        // Take snapshot before starting
        if (sequence.snapshotSections && sequence.snapshotSections.length > 0) {
            snapshotRef.current = sequence.snapshotSections.reduce(
                (snap, section) => ({ ...snap, [section]: { ...configRef.current[section] } }),
                {} as Partial<Config>
            );
        }

        isRunningRef.current = true;
        activeSequenceRef.current = sequence;
        setIsRunning(true);
        setActiveSequenceId(sequence.id);
        setActiveSteps(steps);

        const runStep = (index: number) => {
            if (!isRunningRef.current) return;

            // Past the end — check for loop or end naturally
            if (index >= steps.length) {
                const loopStartIndex = steps.findIndex(s => s.loopStart);
                if (loopStartIndex >= 0) {
                    runStep(loopStartIndex);
                } else {
                    isRunningRef.current = false;
                    activeSequenceRef.current = null;
                    setIsRunning(false);
                    setActiveSequenceId(null);
                    setCurrentStepIndex(null);
                    setActiveSteps([]);
                    if (snapshotRef.current) {
                        applySnapshot();
                    }
                }
                return;
            }

            const step = steps[index];
            const ctx = typeof getCtx === 'function' ? getCtx() : getCtx;

            // Skip step if condition evaluates to false at this moment
            if (step.condition && !step.condition(ctx)) {
                runStep(index + 1);
                return;
            }

            setCurrentStepIndex(index);
            const updatedConfig = applyChanges(configRef.current, step.changes);
            configRef.current = updatedConfig;
            setConfig(updatedConfig);
            socket.emit('updateConfig', updatedConfig);

            timeoutRef.current = setTimeout(() => runStep(index + 1), step.duration);
        };

        runStep(0);
    }, [applySnapshot, setConfig, socket]);

    return { run, stop, isRunning, activeSequenceId, currentStepIndex, activeSteps };
};

export default useAutomationRunner;
