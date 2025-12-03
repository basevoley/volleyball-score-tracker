import React from 'react';
import styled from 'styled-components';

const ActionButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const InnerActionButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
    width: 33%;
`;

const ActionButton = styled.button`
  margin: 5px;
  padding: 10px 20px;
  background-color: ${({ type, disabled }) => {
    if (disabled) {
      return '#ccc'; // Gray for disabled buttons
    }
    switch (type) {
      case 'point':
        return '#FFD700'; // Gold for points
      case 'error':
        return '#FF5733'; // Orange for errors
      default:
        return '#4CAF50'; // Green for general actions
    }
  }};
  color: white;
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 1em;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  border-radius: 5px;
  cursor: pointer;
  &:hover:enabled {   background-color: ${({ type }) => {
    switch (type) {
      case 'point':
        return '#ebce2fff'; // Gold for points
      case 'error':
        return '#e04e2dff'; // Orange for errors
      default:
        return '#45a049'; // Green for general actions
    }
  }};
 }
`;

const FixedButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33%;
`;

function ActionButtons({ rallyStage, currentServer, currentPossession, handleAction }) {
  const actions = [];
  const currentTeamLbl = currentPossession === 'teamA' ? 'Equipo A' : 'Equipo B';
  const opposingTeamLbl = currentPossession === 'teamA' ? 'Equipo B' : 'Equipo A';

  if (rallyStage === 'start') {
    actions.push({ label: `Saque ${currentTeamLbl}`, action: 'serve' });
  } else if (rallyStage === 'afterServe') {
    actions.push({ label: `Recepcion ${opposingTeamLbl}`, action: 'reception' });
  } else if (rallyStage === 'afterReception') {
    actions.push({ label: `Ataque ${currentTeamLbl}`, action: 'attack' });
  } else if (rallyStage === 'afterAttack') {
    actions.push({ label: `Bloqueo ${opposingTeamLbl}`, action: 'block' });
    actions.push({ label: `Defensa ${opposingTeamLbl}`, action: 'dig' });
  } else if (rallyStage === 'afterBlock') {
    actions.push({ label: `Defensa ${opposingTeamLbl}`, action: 'dig' });
    actions.push({ label: `Continua ${currentTeamLbl}`, action: 'continue' });
  } else if (rallyStage === 'afterDig') {
    actions.push({ label: `Ataque ${currentTeamLbl}`, action: 'attack' });
  }

  const showErrorButton = ['afterServe', 'afterReception', 'afterAttack', 'afterBlock', 'afterDig'].includes(rallyStage);
  const showPointButton = ['afterServe', 'afterAttack', 'afterBlock'].includes(rallyStage);

  return (
    <ActionButtonContainer>
      <FixedButtonContainer>
        <ActionButton
          type="error"
          onClick={() => handleAction('error')}
          disabled={!currentServer}
          $visible={showErrorButton}
        >
          Error {currentTeamLbl}
        </ActionButton>
      </FixedButtonContainer>
      <InnerActionButtonContainer>
      {actions.map(({ label, action }) => (
        <ActionButton
          key={action}
          onClick={() => handleAction(action)}
          disabled={!currentServer}
          $visible={true}
        >
          {label}
        </ActionButton>
      ))}
      </InnerActionButtonContainer>
      <FixedButtonContainer>
        <ActionButton
          type="point"
          onClick={() => handleAction('point')}
          disabled={!currentServer}
          $visible={showPointButton}
        >
          Punto {currentTeamLbl}
        </ActionButton>
      </FixedButtonContainer>
    </ActionButtonContainer>
  );
}

export default ActionButtons;
