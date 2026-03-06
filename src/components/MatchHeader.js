// components/match/MatchHeader.jsx

import { Box, Button, ToggleButton, ToggleButtonGroup, styled } from '@mui/material';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: 'flex',
  '& .MuiToggleButtonGroup-grouped': {
    flex: 1,
    transition: 'background-color 0.2s, color 0.2s',
    '&.Mui-selected': {
      backgroundColor: '#4CAF50',
      color: 'white',
      '&.Mui-disabled': {
        backgroundColor: '#A5D6A7',
      },
    },
    '@media (hover: hover)': {
      '&:hover': {
        color: 'white',
        backgroundColor: '#45a049',
      },
      '&.Mui-selected:hover': {
        backgroundColor: '#1B5E20',
      },
    },
  },
}));

const MatchHeader = ({
  teams,
  matchManager,
  rallyManager
}) => {

  const {
    match,
    startMatch,
    resetMatch,
    setServer
  } = matchManager;

  const {
    rally
  } = rallyManager;

  return (
    <>
      {/* Match Control Buttons */}
      <Box
        sx={{
          display: (!match.matchStarted || match.winner) ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 1,
        }}
      >
        <Button 
          onClick={startMatch} 
          variant='contained' 
          sx={{ display: (match.matchStarted || match.winner) ? 'none' : undefined }}
        >
          {match.setStats.length === 0? "Iniciar" : "Reanudar"} partido
        </Button>
        <Button 
          onClick={resetMatch} 
          variant='contained' 
          sx={{ display: match.winner ? undefined : 'none' }}
        >
          Reiniciar partido
        </Button>
      </Box>

      {/* Server Selection */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          my: 1,
        }}
      >
        <StyledToggleButtonGroup
          exclusive
          value={match.currentServer}
          onChange={(event, newVal) => setServer(newVal)}
          disabled={!match.matchStarted || rally.stage !== 'start'}
          sx={{
            display: (match.matchStarted || match.winner) ? 'flex' : 'none',
            width: '100%',
            px: 1
          }}
        >
          <ToggleButton value="teamA">
            <ArrowLeft sx={{ mr: 1 }} /> Saca Equipo A
          </ToggleButton>
          <ToggleButton value="teamB">
            Saca Equipo B <ArrowRight sx={{ ml: 1 }} />
          </ToggleButton>
        </StyledToggleButtonGroup>
      </Box>
    </>
  );
};

export default MatchHeader;
