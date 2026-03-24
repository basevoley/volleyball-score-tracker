import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { TeamKey, RallyState, RallyActionType } from '../types';
import { createEmptyRallyStats } from '../domain/match/stats';
import { RALLY_ACTION_HANDLERS } from '../domain/rally/actionHandlers';

export const useRallyManager = (
    initialServer: TeamKey | null,
    onPossessionChange: ((possession: TeamKey) => void) | null
) => {
    const [rally, setRally] = useState<RallyState>(() => ({
        id: Date.now(),
        stage: 'start',
        possession: initialServer || null,
        actionHistory: [],
        stats: createEmptyRallyStats(),
        showConfirmation: false,
        showDiscardConfirmation: false,
    }));

    const initialPossession = useRef<TeamKey | null>(initialServer || null);
    const previousPossession = useRef<TeamKey | null>(initialServer || null);

    // Notify parent when possession changes (after render)
    useEffect(() => {
        if (rally.possession !== previousPossession.current && rally.possession !== null) {
            previousPossession.current = rally.possession;
            if (onPossessionChange) {
                onPossessionChange(rally.possession);
            }
        }
    }, [rally.possession, onPossessionChange]);

    const handleAction = useCallback((action: string, faultingTeam: TeamKey | null = null) => {
        const handler = RALLY_ACTION_HANDLERS[action as RallyActionType];
        if (!handler) return;

        setRally(prev => {
            const result = handler.apply(prev, faultingTeam ?? undefined);
            return {
                ...prev,
                stats: result.stats,
                stage: result.stage,
                ...(result.possession !== undefined ? { possession: result.possession } : {}),
                ...(result.showConfirmation ? { showConfirmation: true } : {}),
                actionHistory: [
                    ...prev.actionHistory,
                    { action: action as RallyActionType, team: result.team, rallyStage: prev.stage, previousPossession: prev.possession },
                ],
            };
        });
    }, []);

    const undoLastAction = useCallback(() => {
        setRally(prev => {
            if (prev.actionHistory.length === 0) return prev;

            const lastEntry = prev.actionHistory[prev.actionHistory.length - 1];
            const handler = RALLY_ACTION_HANDLERS[lastEntry.action];
            const newStats = handler.undo(lastEntry, prev.stats);

            return {
                ...prev,
                stats: newStats,
                stage: lastEntry.rallyStage,
                possession: lastEntry.previousPossession || prev.possession,
                actionHistory: prev.actionHistory.slice(0, -1),
                showConfirmation: false,
            };
        });
    }, []);

    const resetRally = useCallback((newServer?: TeamKey | null) => {
        const server = newServer !== undefined ? newServer : initialPossession.current;
        setRally({
            id: Date.now(),
            stage: 'start',
            possession: server,
            actionHistory: [],
            stats: createEmptyRallyStats(),
            showConfirmation: false,
            showDiscardConfirmation: false,
        });
        if (server !== null) {
            initialPossession.current = server;
            previousPossession.current = server;
        }
    }, []);

    const discardRally = useCallback(() => {
        setRally(prev => ({
            ...prev,
            stage: 'start',
            possession: initialPossession.current,
            actionHistory: [],
            stats: createEmptyRallyStats(),
            showConfirmation: false,
            showDiscardConfirmation: false,
        }));
    }, []);

    const updateInitialServer = useCallback((newServer: TeamKey) => {
        initialPossession.current = newServer;
        previousPossession.current = newServer;
        setRally(prev => ({ ...prev, possession: newServer }));
    }, []);

    const setConfirmation = useCallback((show: boolean) => {
        setRally(prev => ({ ...prev, showConfirmation: show }));
    }, []);

    const setDiscardConfirmation = useCallback((show: boolean) => {
        setRally(prev => ({ ...prev, showDiscardConfirmation: show }));
    }, []);

    return useMemo(() => ({
        rally,
        handleAction, undoLastAction,
        resetRally, discardRally, updateInitialServer, setConfirmation, setDiscardConfirmation,
        canUndo: rally.actionHistory.length > 0,
        lastAction: rally.actionHistory[rally.actionHistory.length - 1],
    }), [rally, handleAction, undoLastAction, resetRally, discardRally, updateInitialServer, setConfirmation, setDiscardConfirmation]);
};
