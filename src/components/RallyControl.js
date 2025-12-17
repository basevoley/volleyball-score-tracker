import { useEffect } from 'react';
import styled from 'styled-components';
import ActionButtons from './ActionButtons';
import ConfirmationDialog from './ConfirmationDialog';
import FaultButtons from './FaultButtons';
import { useRallyManager } from '../hooks/useRallyManager';

const RallyControlContainer = styled.div`
  width: 100%;
  margin: 20px 0px;
  position: relative;
`;

const UndoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;
const PreviousActionTextContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
const PreviousActionLabel = styled.span`
  margin: 0;
  font-size: 0.9em;
  color: #555;
  font-weight: bold;
`;
const PreviousActionText = styled.span`
  margin: 0;
  font-size: 0.9em;
  color: #555;
`;

const StyledButton = styled.button`
  margin: 5px;
  padding: 10px 20px;
  background-color: ${({ disabled }) => (disabled ? '#ccc' : '#3f382eff')};
  color: white;
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 1em;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  border-radius: 5px;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:hover:enabled { background-color: #302414ff; }
`;

const actionLabels_sp = {
  serve: 'Saque',
  reception: 'Recepción',
  attack: 'Ataque',
  block: 'Bloqueo',
  dig: 'Defensa',
  continue: 'Continúa',
  fault: 'Falta',
  point: 'Punto',
  error: 'Error',
}

function RallyControl({ teams, currentServer, onRallyEnd, updateBallPossession, onRallyStageChange }) {
  // Create rally manager with possession change callback 
  const rallyManager = useRallyManager(currentServer, updateBallPossession, onRallyStageChange);

  const {
    rally,
    handleAction,
    undoLastAction,
    resetRally,
    discardRally,
    updateInitialServer,
    setConfirmation,
    setDiscardConfirmation,
    canUndo,
  } = rallyManager;

  // Sync currentServer when it changes (new point) 
  useEffect(() => {
    if (currentServer !== null) {
      updateInitialServer(currentServer);
      resetRally(currentServer);
    }
  }, [currentServer, updateInitialServer, resetRally]);



  const handleEndRally = () => {
    const lastAction = rally.actionHistory[rally.actionHistory.length - 1];
    const faultingTeam = lastAction?.action === 'fault' ? lastAction.team : null;
    const winner = rally.possession;

    // End rally in parent
    onRallyEnd(winner, rally.stats, faultingTeam);

    // Reset rally for next point
    resetRally(winner);
    setConfirmation(false);

  };

  const handleCancelConfirmation = () => { undoLastAction(); setConfirmation(false); };

  const handleDiscardRally = () => { setDiscardConfirmation(true); };

  const confirmDiscardRally = () => { discardRally(); updateBallPossession(currentServer, true); setDiscardConfirmation(false); };

  const renderPreviousActionText = () => {
    if (!canUndo) return 'Ninguna';
    const lastAction = rally.actionHistory[rally.actionHistory.length - 1];
    const { action, team } = lastAction;
    const teamName = teams[team] || team;
    return `${actionLabels_sp[action]} ${teamName}`;
  };

  return (
    <RallyControlContainer>
      <UndoContainer>
        <PreviousActionTextContainer>
          <PreviousActionLabel>Acción anterior:</PreviousActionLabel>
          <PreviousActionText>{renderPreviousActionText()}</PreviousActionText>
        </PreviousActionTextContainer>
        <StyledButton onClick={undoLastAction} disabled={!canUndo}>Deshacer acción</StyledButton>
        <StyledButton onClick={handleDiscardRally} disabled={!canUndo}>Repetir punto</StyledButton>
      </UndoContainer>
      <FaultButtons
        teams={teams}
        currentServer={currentServer}
        handleAction={handleAction}
      />


      <ActionButtons
        rallyStage={rally.stage}
        currentServer={currentServer}
        currentPossession={rally.possession}
        handleAction={handleAction}
      />

      {rally.showConfirmation && (
        <ConfirmationDialog
          message="¿Finalizar rally y asignar punto?"
          onConfirm={handleEndRally}
          onCancel={handleCancelConfirmation}
        />
      )}

      {rally.showDiscardConfirmation && (
        <ConfirmationDialog
          message="¿Seguro que desea descartar el rally y repetir el punto?"
          onConfirm={confirmDiscardRally}
          onCancel={() => setDiscardConfirmation(false)}
        />
      )}
    </RallyControlContainer>
  );
}

export default RallyControl;