import { Box, Button, Grid, Stack } from '@mui/material';
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

const ActionButton = styled(Button)({
  margin: '5px',
  // padding: '10px 20px',
  backgroundColor: ({ type, disabled }) => {
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
  },
  color: 'white',
  border: 'none',
  cursor: ({ disabled }) => (disabled ? 'not-allowed' : 'pointer'),
  // fontSize: '1em',
  opacity: ({ disabled }) => (disabled ? 0.6 : 1),
  visibility: ({ $visible }) => ($visible ? 'visible' : 'hidden'),
  borderRadius: '5px',
  minHeight: '64px',
  // cursor: 'pointer',
  '&:hover:enabled': {
    backgroundColor: ({ type }) => {
      switch (type) {
        case 'point':
          return '#ebce2fff'; // Gold for points
        case 'error':
          return '#e04e2dff'; // Orange for errors
        default:
          return '#45a049'; // Green for general actions
      }
    },
  }
});

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
    actions.push({ label: `Saque ${currentTeamLbl} `, action: 'serve' });
  } else if (rallyStage === 'afterServe') {
    actions.push({ label: `Recepcion ${opposingTeamLbl} `, action: 'reception' });
  } else if (rallyStage === 'afterReception') {
    actions.push({ label: `Ataque ${currentTeamLbl} `, action: 'attack' });
  } else if (rallyStage === 'afterAttack') {
    actions.push({ label: `Bloqueo ${opposingTeamLbl} `, action: 'block' });
    actions.push({ label: `Defensa ${opposingTeamLbl} `, action: 'dig' });
  } else if (rallyStage === 'afterBlock') {
    actions.push({ label: `Defensa ${opposingTeamLbl} `, action: 'dig' });
    actions.push({ label: `Continua ${currentTeamLbl} `, action: 'continue' });
  } else if (rallyStage === 'afterDig') {
    actions.push({ label: `Ataque ${currentTeamLbl} `, action: 'attack' });
  }

  const showErrorButton = ['afterServe', 'afterReception', 'afterAttack', 'afterBlock', 'afterDig'].includes(rallyStage);
  const showPointButton = ['afterServe', 'afterAttack', 'afterBlock'].includes(rallyStage);

  return (
    // <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1, width: '100%', pt: { xs: 2, sm: 4 }, boxSizing: 'border-box' }} >
      <Grid container rowSpacing={{ xs: 1, sm: 2, md: 3 }} columnSpacing={{ xs: 1, sm: 2, md: 3 }} width={'100%'} minHeight={'150px'} mt={{ xs: 1, sm: 2 }}
      // sx={{ width: '100%', mt: { xs: 1, sm: 2 }, minHeight: '150px' }}
      >
  <Grid size={4} display="flex" justifyContent="center" alignItems="center"
  // sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}
  >
            <ActionButton
          type="error"
          onClick={() => handleAction('error')}
          disabled={!currentServer}
          $visible={showErrorButton}
          color='error'
          variant='contained'
        >
          Error {currentTeamLbl}
        </ActionButton>
  </Grid>
  <Grid size={4} display="flex" justifyContent="center" alignItems="center"
  // sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}
  >
    <Stack>
        {actions.map(({ label, action }) => (
          <ActionButton
            key={action}
            onClick={() => handleAction(action)}
            disabled={!currentServer}
            $visible={true}
            color='success'
            variant='contained'
          >
            {label}
          </ActionButton>
        ))}
        </Stack>
  </Grid>
  <Grid size={4} display="flex" justifyContent="center" alignItems="center"
  // sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}
  >
        <ActionButton
          type="point"
          onClick={() => handleAction('point')}
          disabled={!currentServer}
          $visible={showPointButton}
                      color='warning'
            variant='contained'
        >
          Punto {currentTeamLbl}
        </ActionButton>  </Grid>
</Grid>
      // {/* <FixedButtonContainer>
      //   <ActionButton
      //     type="error"
      //     onClick={() => handleAction('error')}
      //     disabled={!currentServer}
      //     $visible={showErrorButton}
      //     color='error'
      //     variant='contained'
      //   >
      //     Error {currentTeamLbl}
      //   </ActionButton>
      // </FixedButtonContainer>
      // <InnerActionButtonContainer>
      //   {actions.map(({ label, action }) => (
      //     <ActionButton
      //       key={action}
      //       onClick={() => handleAction(action)}
      //       disabled={!currentServer}
      //       $visible={true}
      //       color='success'
      //       variant='contained'
      //     >
      //       {label}
      //     </ActionButton>
      //   ))}
      // </InnerActionButtonContainer>
      // <FixedButtonContainer>
      //   <ActionButton
      //     type="point"
      //     onClick={() => handleAction('point')}
      //     disabled={!currentServer}
      //     $visible={showPointButton}
      //                 color='warning'
      //       variant='contained'
      //   >
      //     Punto {currentTeamLbl}
      //   </ActionButton>
      // </FixedButtonContainer> */}
    // </Box>
  );
}

export default ActionButtons;
