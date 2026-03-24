// components/RallyController.jsx

import { Box, Button, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import type { useMatchManager } from '../../hooks/useMatchManager';
import type { useRallyManager } from '../../hooks/useRallyManager';
import type { TeamRecord } from '../../types';

type MatchManager = ReturnType<typeof useMatchManager>;
type RallyManager = ReturnType<typeof useRallyManager>;

interface Props {
  teams: TeamRecord<string>;
  matchManager: MatchManager;
  rallyManager: RallyManager;
}
import ActionButtons from "./ActionButtons";
import ConfirmationDialog from "../../shared/components/ConfirmationDialog";
import { RestartAlt, Undo } from "@mui/icons-material";

const RallyControl = ({
  teams,
  matchManager,
  rallyManager
}: Props) => {

    const { 
    match, 
    updateBallPossession, 
    endRally, 
  } = matchManager;

  const {
    rally,
    handleAction,
    undoLastAction,
    resetRally,
    discardRally,
    setConfirmation,
    setDiscardConfirmation,
    canUndo,
  } = rallyManager;

  const renderPreviousActionText = () => {
    if (!canUndo) return 'Ninguna';
    const lastAction = rally.actionHistory[rally.actionHistory.length - 1];
    const { action, team } = lastAction;
    const teamName = teams[team] || team;
    return `${actionLabels_sp[action]} ${teamName}`;
  };

  // Rally event handlers
  const handleEndRally = () => {
    const lastAction = rally.actionHistory[rally.actionHistory.length - 1];
    const faultingTeam = lastAction?.action === 'fault' ? lastAction.team : null;
    const winner = rally.possession!;
    const willEndSet = matchManager.willRallyEndSet(winner);

    endRally(winner, rally.stats, faultingTeam, rally);

    if (!willEndSet) {
      resetRally(winner);
      setConfirmation(false);
    }
  };

  const handleCancelConfirmation = () => { 
    undoLastAction(); 
    setConfirmation(false); 
  };

  const handleDiscardRally = () => { 
    setDiscardConfirmation(true); 
  };

  const confirmDiscardRally = () => { 
    discardRally(); 
    updateBallPossession(match.currentServer!, true);
    setDiscardConfirmation(false); 
  };

  const handleEndSet = () => {
    const winner = rally.possession!;
    matchManager.confirmSetEnd(true);
    resetRally(winner);
    setConfirmation(false);
  };

  const handleDiscardSetEnd = () => {
    matchManager.confirmSetEnd(false);
    undoLastAction();
    setConfirmation(false);
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
        open={rally.showConfirmation}
        message="¿Finalizar rally y asignar punto?"
        onConfirm={handleEndRally}
        onCancel={handleCancelConfirmation}
      />

      {/* Set End Confirmation */}
      <ConfirmationDialog
        open={matchManager.pendingSetEnd}
        message={<Typography align='center'>Este punto finaliza el set, lo cual <b>NO</b> se puede deshacer.<br/> ¿Seguro que desea terminar el set?</Typography>}
        onConfirm={handleEndSet}
        onCancel={handleDiscardSetEnd}
      />

      {/* Rally Discard Confirmation */}
      <ConfirmationDialog
        message="¿Seguro que desea descartar el rally y repetir el punto?"
        open={rally.showDiscardConfirmation}
        onConfirm={confirmDiscardRally}
        onCancel={() => setDiscardConfirmation(false)}
      />

      {/* Action History and Controls */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          size='small'
          label="Acción anterior"
          placeholder="Ninguna"
          value={renderPreviousActionText()}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          sx={{ flex: 1 }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 1 }}>
          {/* Undo Button - Responsive */}
          <Tooltip title={'Deshacer última acción'}>
            <span>
              <IconButton 
                onClick={undoLastAction} 
                disabled={!canUndo}
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  '&:hover': { backgroundColor: '#45a049' },
                  '&:disabled': { backgroundColor: '#e0e0e0' }
                }}
              >
                <Undo />
              </IconButton>
              <Button
                variant="contained"
                onClick={undoLastAction}
                disabled={!canUndo}
                startIcon={<Undo />}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontSize: '0.75rem',
                  '&:hover': { backgroundColor: '#45a049' },
                  '&:disabled': { backgroundColor: '#e0e0e0' }
                }}
              >
                Deshacer Acción
              </Button>
            </span>
          </Tooltip>

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
        </Box>
      </Box>
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
