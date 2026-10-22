// components/RallyController.jsx

import { IconButton, Button, Tooltip, Typography } from "@mui/material";
import type { useMatchManager } from '../../hooks/useMatchManager';
import type { TeamRecord } from '../../types';

type MatchManager = ReturnType<typeof useMatchManager>;

interface Props {
  teams: TeamRecord<string>;
  matchManager: MatchManager;
}
import ActionButtons from "./ActionButtons";
import HistoryUndoBar from "./HistoryUndoBar";
import type { RallyActionUndo } from "./HistoryUndoBar";
import ConfirmationDialog from "../../shared/components/ConfirmationDialog";
import { RestartAlt } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";

const RallyControl = ({
  teams,
  matchManager,
}: Props) => {

  const {
    match,
    rally,
    handleAction,
    undoLastAction,
    discardRally,
    canUndo,
    endRally,
    confirmSetEnd,
    pendingSetEnd,
  } = matchManager;

  // Local confirmation dialog state (was previously in RallyState)
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);

  // Open rally confirmation when a terminal action (error/fault/point) is added
  const prevActionCountRef = useRef(rally.actionHistory.length);
  useEffect(() => {
    const { actionHistory } = rally;
    if (actionHistory.length > prevActionCountRef.current) {
      const lastAction = actionHistory[actionHistory.length - 1];
      if (['error', 'fault', 'point'].includes(lastAction.action)) {
        setShowConfirmation(true);
      }
    } else if (actionHistory.length < prevActionCountRef.current || actionHistory.length === 0) {
      // Action undone or rally reset
      setShowConfirmation(false);
    }
    prevActionCountRef.current = actionHistory.length;
  }, [rally.actionHistory]);

  // Close confirmation when rally resets (new rally id)
  const prevRallyIdRef = useRef(rally.id);
  useEffect(() => {
    if (rally.id !== prevRallyIdRef.current) {
      prevRallyIdRef.current = rally.id;
      setShowConfirmation(false);
      setShowDiscardConfirmation(false);
    }
  }, [rally.id]);

  const lastRallyAction = rally.actionHistory[rally.actionHistory.length - 1];
  const rallyActionUndo: RallyActionUndo | null = lastRallyAction
    ? { label: `${actionLabels_sp[lastRallyAction.action]} ${teams[lastRallyAction.team] || lastRallyAction.team}`, undo: undoLastAction }
    : null;

  // Rally event handlers
  const handleEndRally = () => {
    const lastAction = rally.actionHistory[rally.actionHistory.length - 1];
    const faultingTeam = lastAction?.action === 'fault' ? lastAction.team : null;
    const winner = rally.possession!;
    endRally(winner, faultingTeam);
    setShowConfirmation(false);
  };

  const handleCancelConfirmation = () => {
    undoLastAction();
    setShowConfirmation(false);
  };

  const handleDiscardRally = () => {
    setShowDiscardConfirmation(true);
  };

  const confirmDiscardRally = () => {
    discardRally();
    setShowDiscardConfirmation(false);
  };

  const handleEndSet = () => {
    confirmSetEnd(true);
    setShowConfirmation(false);
  };

  const handleDiscardSetEnd = () => {
    confirmSetEnd(false);
    undoLastAction();
    setShowConfirmation(false);
  };

  return (
    <>
      {/* Action Buttons */}
      <ActionButtons
        rallyStage={rally.stage}
        currentServer={match.currentServer}
        currentPossession={rally.possession}
        handleAction={handleAction}
      />

      {/* Rally End Confirmation */}
      <ConfirmationDialog
        open={showConfirmation}
        message="¿Finalizar rally y asignar punto?"
        onConfirm={handleEndRally}
        onCancel={handleCancelConfirmation}
      />

      {/* Set End Confirmation */}
      <ConfirmationDialog
        open={pendingSetEnd}
        message={<Typography align='center'>Este punto finaliza el set.<br/> ¿Seguro que desea terminar el set?</Typography>}
        onConfirm={handleEndSet}
        onCancel={handleDiscardSetEnd}
      />

      {/* Rally Discard Confirmation */}
      <ConfirmationDialog
        message="¿Seguro que desea descartar el rally y repetir el punto?"
        open={showDiscardConfirmation}
        onConfirm={confirmDiscardRally}
        onCancel={() => setShowDiscardConfirmation(false)}
      />

      {/* Action History and Controls */}
      <HistoryUndoBar teams={teams} matchManager={matchManager} rallyAction={rallyActionUndo}>
        {/* Discard Button - Responsive */}
        <Tooltip title={'Descartar y repetir el punto'}>
          <span>
            <IconButton
              onClick={handleDiscardRally}
              disabled={!canUndo}
              sx={{
                display: { xs: 'flex', md: 'none' },
                backgroundColor: '#FF9800',
                color: 'white',
                '&:hover': { backgroundColor: '#F57C00' },
                '&:disabled': { backgroundColor: '#e0e0e0' }
              }}
            >
              <RestartAlt />
            </IconButton>
            <Button
              onClick={handleDiscardRally}
              disabled={!canUndo}
              variant="contained"
              startIcon={<RestartAlt />}
              sx={{
                display: { xs: 'none', md: 'flex' },
                backgroundColor: '#FF9800',
                color: 'white',
                fontSize: '0.75rem',
                '&:hover': { backgroundColor: '#F57C00' },
                '&:disabled': { backgroundColor: '#e0e0e0' }
              }}
            >
              Repetir Punto
            </Button>
          </span>
        </Tooltip>
      </HistoryUndoBar>
    </>
  );
};

const actionLabels_sp: Record<string, string> = {
  serve: 'Saque',
  reception: 'Recepción',
  attack: 'Ataque',
  block: 'Bloqueo',
  dig: 'Defensa',
  continue: 'Continúa',
  fault: 'Falta',
  point: 'Punto',
  error: 'Error',
};

export default RallyControl;
