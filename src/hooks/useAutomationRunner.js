import { useState, useRef, useCallback, useEffect } from 'react';

const applyChanges = (config, changes) =>
    changes.reduce(
        (cfg, { section, key, value }) => ({
            ...cfg,
            [section]: { ...cfg[section], [key]: value },
        }),
        { ...config }
    );

const useAutomationRunner = ({ config, setConfig, socket }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [activeSequenceId, setActiveSequenceId] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(null);
    const [activeSteps, setActiveSteps] = useState([]);

    const configRef = useRef(config);
    const isRunningRef = useRef(false);
    const timeoutRef = useRef(null);
    const snapshotRef = useRef(null);
    const activeSequenceRef = useRef(null);

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
        clearTimeout(timeoutRef.current);
        setIsRunning(false);
        setActiveSequenceId(null);
        setCurrentStepIndex(null);
        setActiveSteps([]);
        activeSequenceRef.current = null;

        if (snapshotRef.current) {
            // Restore snapshotted sections first, then apply resetOnStop on top
            applySnapshot();
        }

        if (sequence?.resetOnStop?.length > 0) {
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

    const run = useCallback((sequence, getCtx = () => ({})) => {
        // Interrupt any running sequence cleanly
        if (isRunningRef.current) {
            isRunningRef.current = false;
            clearTimeout(timeoutRef.current);
            snapshotRef.current = null;
            activeSequenceRef.current = null;
        }

        const steps = sequence.steps;
        if (steps.length === 0) return;

        // Take snapshot before starting
        if (sequence.snapshotSections?.length > 0) {
            snapshotRef.current = sequence.snapshotSections.reduce(
                (snap, section) => ({ ...snap, [section]: { ...configRef.current[section] } }),
                {}
            );
        }

        isRunningRef.current = true;
        activeSequenceRef.current = sequence;
        setIsRunning(true);
        setActiveSequenceId(sequence.id);
        setActiveSteps(steps);

        const runStep = (index) => {
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
