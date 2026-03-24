import {  Button, Grid, Stack } from '@mui/material';
import React from 'react';
import styled from 'styled-components';
import type { RallyStage, TeamKey } from '../../types';

interface ActionButtonProps {
  type?: string;
  disabled?: boolean;
  $visible?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActionButton = (styled(Button as any) as any)(({ type, disabled, $visible }: ActionButtonProps) => ({
  margin: '5px',
  backgroundColor: disabled ? '#ccc' : type === 'point' ? '#FFD700' : type === 'error' ? '#FF5733' : '#4CAF50',
  color: 'white',
  border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  visibility: $visible ? 'visible' : 'hidden',
  borderRadius: '5px',
  minHeight: '64px',
  '&:hover:enabled': {
    backgroundColor: type === 'point' ? '#ebce2fff' : type === 'error' ? '#e04e2dff' : '#45a049',
  },
}));

interface Props {
  rallyStage: RallyStage;
  currentServer: TeamKey | null;
  currentPossession: TeamKey | null;
  handleAction: (action: string, team?: TeamKey | null) => void;
}

function ActionButtons({ rallyStage, currentServer, currentPossession, handleAction }: Props) {
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
