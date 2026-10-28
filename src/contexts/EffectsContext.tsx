import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { useMatchContext } from './MatchContext';
import { usePreferences } from './PreferencesContext';
import { useSocket } from '../services/socket/SocketContext';
import { CelebrationGate } from '../domain/effects/celebrationGate';
import { CelebrationController, type CelebrationDeps } from '../domain/effects/celebrationController';
import type { DialogSpec } from '../domain/effects/plan';
import { PointEffectsDialog } from '../features/match/PointEffectsDialog';

interface EffectsContextValue {
    // Lets automations wait for a point's celebration before taking over the overlay
    gate: CelebrationGate;
}

const EffectsContext = createContext<EffectsContextValue | null>(null);

// Unique per opened dialog, so a dialog replacing another remounts and restarts its countdown
let dialogKeySeed = 0;

export const EffectsProvider = ({ children }: { children: React.ReactNode }) => {
    const { matchManager, matchDetails, addMatchEventListener } = useMatchContext();
    const { effectPreferences } = usePreferences();
    const { socket } = useSocket();
    const history = matchManager.match.history;
    const [dialog, setDialog] = useState<{ spec: DialogSpec; key: number } | null>(null);
    const [gate] = useState(() => new CelebrationGate());

    const buildDeps = (): CelebrationDeps => ({
        gate,
        getPreferences: () => effectPreferences,
        getTeamName: team => matchDetails.teams[team],
        emit: payload => socket?.emit('triggerEffect', payload),
        onDialogChange: spec => setDialog(spec && { spec, key: ++dialogKeySeed }),
    });

    const [controller] = useState(() => new CelebrationController(buildDeps()));

    // Layout effects run before every passive effect, so by the time MatchProvider publishes an
    // event the controller already holds this render's preferences, team names and socket.
    useLayoutEffect(() => controller.setDeps(buildDeps()));

    useEffect(
        () => addMatchEventListener(event => controller.handleEvent(event, history)),
        [addMatchEventListener, controller, history],
    );

    return (
        <EffectsContext.Provider value={{ gate }}>
            {children}
            {dialog && (
                <PointEffectsDialog
                    key={dialog.key}
                    spec={dialog.spec}
                    onChoose={choice => controller.choose(choice)}
                    onDismiss={() => controller.dismiss()}
                />
            )}
        </EffectsContext.Provider>
    );
};

export const useEffects = (): EffectsContextValue => {
    const ctx = useContext(EffectsContext);
    if (!ctx) throw new Error('useEffects must be used within EffectsProvider');
    return ctx;
};
