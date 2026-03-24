import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { TeamKey, TeamRecord, RallyTeamStats, RallyState } from '../types';

const createEmptyStats = (): TeamRecord<RallyTeamStats> => ({
    teamA: {
        serve: 0,
        ace: 0,
        serveError: 0,
        reception: 0,
        receptionError: 0,
        dig: 0,
        digError: 0,
        attack: 0,
        attackPoint: 0,
        attackError: 0,
        block: 0,
        blockPoint: 0,
        blockOut: 0,
        fault: 0,
    },
    teamB: {
        serve: 0,
        ace: 0,
        serveError: 0,
        reception: 0,
        receptionError: 0,
        dig: 0,
        digError: 0,
        attack: 0,
        attackPoint: 0,
        attackError: 0,
        block: 0,
        blockPoint: 0,
        blockOut: 0,
        fault: 0,
    },
});

export const useRallyManager = (
    initialServer: TeamKey | null,
    onPossessionChange: ((possession: TeamKey) => void) | null
) => {
    const [rally, setRally] = useState<RallyState>(() => ({
        id: Date.now(),
        stage: 'start',
        possession: initialServer || null,
        actionHistory: [],
        stats: createEmptyStats(),
        showConfirmation: false,
        showDiscardConfirmation: false,
    }));

    const initialPossession = useRef<TeamKey | null>(initialServer || null);
    const previousPossession = useRef<TeamKey | null>(initialServer || null);

    // Helper to get opposing team
    const getOpposingTeam = useCallback((team: TeamKey): TeamKey => {
        return team === 'teamA' ? 'teamB' : 'teamA';
    }, []);

    // Notify parent when possession changes (after render)
    useEffect(() => {
        if (rally.possession !== previousPossession.current && rally.possession !== null) {
            previousPossession.current = rally.possession;
            if (onPossessionChange) {
                onPossessionChange(rally.possession);
            }
        }
    }, [rally.possession, onPossessionChange]);

    // SERVE ACTION
    const handleServe = useCallback(() => {
        setRally(prev => {
            const team = prev.possession!;
            const newStats = { ...prev.stats };
            newStats[team] = { ...newStats[team], serve: newStats[team].serve + 1 };

            return {
                ...prev,
                stats: newStats,
                stage: 'afterServe',
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'serve', team, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, []);

    // RECEPTION ACTION
    const handleReception = useCallback(() => {
        setRally(prev => {
            const team = prev.possession!;
            const opposingTeam = getOpposingTeam(team);
            const newStats = { ...prev.stats };
            newStats[opposingTeam] = { ...newStats[opposingTeam], reception: newStats[opposingTeam].reception + 1 };

            return {
                ...prev,
                stats: newStats,
                stage: 'afterReception',
                possession: opposingTeam, // Just update possession, useEffect will notify parent
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'reception', team: opposingTeam, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, [getOpposingTeam]);

    // ATTACK ACTION
    const handleAttack = useCallback(() => {
        setRally(prev => {
            const team = prev.possession!;
            const newStats = { ...prev.stats };
            newStats[team] = { ...newStats[team], attack: newStats[team].attack + 1 };

            return {
                ...prev,
                stats: newStats,
                stage: 'afterAttack',
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'attack', team, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, []);

    // BLOCK ACTION
    const handleBlock = useCallback(() => {
        setRally(prev => {
            const team = prev.possession!;
            const opposingTeam = getOpposingTeam(team);
            const newStats = { ...prev.stats };
            newStats[opposingTeam] = { ...newStats[opposingTeam], block: newStats[opposingTeam].block + 1 };

            return {
                ...prev,
                stats: newStats,
                stage: 'afterBlock',
                possession: opposingTeam,
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'block', team: opposingTeam, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, [getOpposingTeam]);

    // CONTINUE (DIG by same team) ACTION
    const handleContinue = useCallback(() => {
        setRally(prev => {
            const team = prev.possession!;
            const newStats = { ...prev.stats };
            newStats[team] = { ...newStats[team], dig: newStats[team].dig + 1 };

            return {
                ...prev,
                stats: newStats,
                stage: 'afterDig',
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'continue', team, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, []);

    // DIG (by opposing team) ACTION
    const handleDig = useCallback(() => {
        setRally(prev => {
            const team = prev.possession!;
            const opposingTeam = getOpposingTeam(team);
            const newStats = { ...prev.stats };

            newStats[opposingTeam] = { ...newStats[opposingTeam], dig: newStats[opposingTeam].dig + 1 };

            if (prev.stage === 'afterBlock') {
                newStats[team] = { ...newStats[team], attack: newStats[team].attack + 1 };
            }

            return {
                ...prev,
                stats: newStats,
                stage: 'afterDig',
                possession: opposingTeam,
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'dig', team: opposingTeam, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, [getOpposingTeam]);

    // ERROR ACTION
    const handleError = useCallback(() => {
        setRally(prev => {
            const team = prev.possession!;
            const opposingTeam = getOpposingTeam(team);
            const newStats = { ...prev.stats };

            if (prev.stage === 'afterServe') {
                newStats[team] = { ...newStats[team], serveError: newStats[team].serveError + 1 };
            } else if (prev.stage === 'afterReception') {
                newStats[team] = { ...newStats[team], receptionError: newStats[team].receptionError + 1 };
            } else if (prev.stage === 'afterAttack') {
                newStats[team] = { ...newStats[team], attackError: newStats[team].attackError + 1 };
            } else if (prev.stage === 'afterDig') {
                newStats[team] = { ...newStats[team], digError: newStats[team].digError + 1 };
            } else if (prev.stage === 'afterBlock') {
                newStats[team] = { ...newStats[team], blockOut: newStats[team].blockOut + 1 };
            }

            return {
                ...prev,
                stats: newStats,
                possession: opposingTeam,
                showConfirmation: true,
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'error', team, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, [getOpposingTeam]);

    // FAULT ACTION
    const handleFault = useCallback((faultingTeam: TeamKey) => {
        setRally(prev => {
            const teamAwarded = getOpposingTeam(faultingTeam);
            const newStats = { ...prev.stats };
            newStats[faultingTeam] = { ...newStats[faultingTeam], fault: newStats[faultingTeam].fault + 1 };

            return {
                ...prev,
                stats: newStats,
                possession: teamAwarded,
                showConfirmation: true,
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'fault', team: faultingTeam, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, [getOpposingTeam]);

    // POINT ACTION
    const handlePoint = useCallback(() => {
        setRally(prev => {
            const team = prev.possession!;
            const newStats = { ...prev.stats };

            if (prev.stage === 'afterServe') {
                newStats[team] = { ...newStats[team], ace: newStats[team].ace + 1 };
            } else if (prev.stage === 'afterBlock') {
                newStats[team] = { ...newStats[team], blockPoint: newStats[team].blockPoint + 1 };
            } else if (prev.stage === 'afterAttack') {
                newStats[team] = { ...newStats[team], attackPoint: newStats[team].attackPoint + 1 };
            }

            return {
                ...prev,
                stats: newStats,
                showConfirmation: true,
                actionHistory: [
                    ...prev.actionHistory,
                    { action: 'point', team, rallyStage: prev.stage, previousPossession: prev.possession }
                ],
            };
        });
    }, []);

    // UNDO ACTION
    const undoLastAction = useCallback(() => {
        setRally(prev => {
            if (prev.actionHistory.length === 0) return prev;

            const lastAction = prev.actionHistory[prev.actionHistory.length - 1];
            const { action, team, rallyStage: previousStage, previousPossession } = lastAction;
            const opposingTeam = getOpposingTeam(team);
            const newStats = { ...prev.stats };

            switch (action) {
                case 'serve':
                    newStats[team] = { ...newStats[team], serve: newStats[team].serve - 1 };
                    break;
                case 'reception':
                    newStats[team] = { ...newStats[team], reception: newStats[team].reception - 1 };
                    break;
                case 'attack':
                    newStats[team] = { ...newStats[team], attack: newStats[team].attack - 1 };
                    break;
                case 'block':
                    newStats[team] = { ...newStats[team], block: newStats[team].block - 1 };
                    break;
                case 'continue':
                    newStats[team] = { ...newStats[team], dig: newStats[team].dig - 1 };
                    break;
                case 'dig':
                    newStats[team] = { ...newStats[team], dig: newStats[team].dig - 1 };
                    if (previousStage === 'afterBlock') {
                        newStats[opposingTeam] = { ...newStats[opposingTeam], attack: newStats[opposingTeam].attack - 1 };
                    }
                    break;
                case 'error':
                    if (previousStage === 'afterServe') {
                        newStats[team] = { ...newStats[team], serveError: newStats[team].serveError - 1 };
                    } else if (previousStage === 'afterReception') {
                        newStats[team] = { ...newStats[team], receptionError: newStats[team].receptionError - 1 };
                    } else if (previousStage === 'afterAttack') {
                        newStats[team] = { ...newStats[team], attackError: newStats[team].attackError - 1 };
                    } else if (previousStage === 'afterDig') { newStats[team] = { ...newStats[team], digError: newStats[team].digError - 1 }; } else if (previousStage === 'afterBlock') { newStats[team] = { ...newStats[team], blockOut: newStats[team].blockOut - 1 }; } break; case 'fault': newStats[team] = { ...newStats[team], fault: newStats[team].fault - 1 }; break; case 'point': if (previousStage === 'afterServe') { newStats[team] = { ...newStats[team], ace: newStats[team].ace - 1 }; } else if (previousStage === 'afterBlock') { newStats[team] = { ...newStats[team], blockPoint: newStats[team].blockPoint - 1 }; } else if (previousStage === 'afterAttack') { newStats[team] = { ...newStats[team], attackPoint: newStats[team].attackPoint - 1 }; } break; default: break;
            }

            return {
                ...prev,
                stats: newStats,
                stage: previousStage,
                possession: previousPossession || prev.possession,
                actionHistory: prev.actionHistory.slice(0, -1),
                showConfirmation: false,
            };
        });

    }, [getOpposingTeam]);


    // Simple action dispatcher - just maps UI actions to hook methods
    const handleAction = useCallback((action: string, faultingTeam: TeamKey | null = null) => {
        switch (action) {
            case 'serve':
                handleServe();
                break;
            case 'reception':
                handleReception();
                break;
            case 'attack':
                handleAttack();
                break;
            case 'block':
                handleBlock();
                break;
            case 'continue':
                handleContinue();
                break;
            case 'dig':
                handleDig();
                break;
            case 'error':
                handleError();
                break;
            case 'fault':
                handleFault(faultingTeam!);
                break;
            case 'point':
                handlePoint();
                break;
            default:
                break;
        }
    }, [handleAttack, handleBlock, handleContinue, handleDig, handleError, handleFault, handlePoint, handleReception, handleServe]);

    // RESET RALLY
    const resetRally = useCallback((newServer?: TeamKey | null) => {
        const server = newServer !== undefined ? newServer : initialPossession.current;
        setRally({
            id: Date.now(),
            stage: 'start',
            possession: server,
            actionHistory: [],
            stats: createEmptyStats(),
            showConfirmation: false,
            showDiscardConfirmation: false,
        });
        if (server !== null) {
            initialPossession.current = server;
            previousPossession.current = server;
        }
    }, []);

    // DISCARD RALLY
    const discardRally = useCallback(() => { setRally(prev => ({ ...prev, stage: 'start', possession: initialPossession.current, actionHistory: [], stats: createEmptyStats(), showConfirmation: false, showDiscardConfirmation: false, })); }, []);

    // UPDATE INITIAL SERVER (when new point starts)
    const updateInitialServer = useCallback((newServer: TeamKey) => { initialPossession.current = newServer; previousPossession.current = newServer; setRally(prev => ({ ...prev, possession: newServer, })); }, []);

    // TOGGLE CONFIRMATIONS
    const setConfirmation = useCallback((show: boolean) => { setRally(prev => ({ ...prev, showConfirmation: show })); }, []);

    const setDiscardConfirmation = useCallback((show: boolean) => { setRally(prev => ({ ...prev, showDiscardConfirmation: show })); }, []);

    // Memoize the return object
    const returnValue = useMemo(() => ({
        rally,
        // High-level action handlers
        handleAction, undoLastAction,
        // Rally management
        resetRally, discardRally, updateInitialServer, setConfirmation, setDiscardConfirmation,
        // Computed values
        canUndo: rally.actionHistory.length > 0,
        lastAction: rally.actionHistory[rally.actionHistory.length - 1],
    }), [rally, handleAction, undoLastAction, resetRally, discardRally, updateInitialServer, setConfirmation, setDiscardConfirmation,]);

    return returnValue;
};
