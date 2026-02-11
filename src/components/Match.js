import { useEffect, useState, useRef } from 'react';
import ScoreBoard from './ScoreBoard';
import StatsHandler from './StatsHandler';
import { useMatchManager } from '../hooks/useMatchManager';
import { useSocket } from '../contexts/SocketContext';
import { Box, Button, ButtonGroup, Card, colors, IconButton, Paper, Stack, styled, TextField, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useRallyManager } from '../hooks/useRallyManager';
import ConfirmationDialog from './ConfirmationDialog';
import ActionButtons from './ActionButtons';
import { ArrowLeft, ArrowRight, RestartAlt, Undo } from '@mui/icons-material';


const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: 'flex',
  // gap: '10px', // Opcional: si quieres que estén separados como tus botones
  '& .MuiToggleButtonGroup-grouped': {
    // border: 'none', // Eliminamos el borde estándar de MUI
    // borderRadius: '5px !important', // Forzamos el radio de tu ActionButton
    // minHeight: '64px',
    // color: 'white',
    // backgroundColor: '#4CAF50', // Verde por defecto
    flex: 1, // Para que ocupen el mismo ancho
    transition: 'background-color 0.2s, color 0.2s',
    // '&:hover': {
    //   color: 'white',
    //   backgroundColor: '#45a049',
    // },
    '&.Mui-selected': {
      backgroundColor: '#4CAF50', //'#2E7D32', // Un verde más oscuro para el estado seleccionado
      color: 'white',
      // '&:hover': {
      //   backgroundColor: '#2E7D32', //'#1B5E20',
      // },
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
        '&.Mui-disabled': {
      backgroundColor: '#ccc',
      color: 'rgba(255, 255, 255, 0.7)',
      opacity: 0.6,
    },
  },
}));

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

function Match({ matchDetails, matchData, setMatchData }) {
  const { teams, teamLogos, teamColors, maxSets } = matchDetails;
  const [rallyStage, setRallyStage] = useState('start');
  const didInitRef = useRef(false);
  const [expandedSetIndex, setExpandedSetIndex] = useState(
    matchData?.setStats?.length > 0 ? matchData.setStats.length - 1 : null
  );

  const { socket } = useSocket();

  // Use the match manager hook 
  const matchManager = useMatchManager(matchData, teams, maxSets);
  const { match, startMatch, resetMatch, setServer, updateBallPossession, endRally, callTimeout, callSubstitution, adjustScore, updateSetsWon, clearMatchEvent, getLastAction, clearLastAction, } = matchManager;

  // Sync parent/socket when match state changes 
  useEffect(() => {
    const lastSet = match.setStats ? Math.max(match.setStats.length - 1, 0) : 0;
    setExpandedSetIndex(null);

    if (!didInitRef.current) {
      didInitRef.current = true;
      return; // skip initial mount
    }

    const lastAction = getLastAction();
    if (!lastAction) return;

    // Skip socket emission for ball possession updates
    const skipSocket = lastAction.type === 'UPDATE_BALL_POSSESSION';

    // Prepare payload
    let socketPayload = { ...match };
    if (!match.matchStarted && match.setStats) {
      socketPayload.currentSetStats = { ...match.setStats[lastSet].statistics };
      socketPayload.scores = { ...match.setScores[lastSet] || match.scores };
      if (!match.winner) {
        socketPayload.setScores = match.setScores.slice(0, -1);
      }
    }
    delete socketPayload.ballPossession;
    delete socketPayload.setStats;
    delete socketPayload.currentSetHistory;
    if (socketPayload.currentSetStats?.history) {
      delete socketPayload.currentSetStats.history;
    }

    // Send to socket
    if (socket && !skipSocket) {
      socket.emit('matchData', socketPayload);
    }

    // Merge full state with existing parent state
    setMatchData(prev => ({
      ...prev,
      ...match,
      matchEvent: { type: null, details: null },
    }));

    // Clean matchEvent from local state after emission
    if (match.matchEvent.type !== null) {
      clearMatchEvent();
    }

    clearLastAction();

  }, [match, setMatchData, socket, getLastAction, clearLastAction, clearMatchEvent]);



  const rallyManager = useRallyManager(match.currentServer, updateBallPossession, setRallyStage);

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
    if (match.currentServer !== null) {
      updateInitialServer(match.currentServer);
      resetRally(match.currentServer);
    }
  }, [match.currentServer, updateInitialServer, resetRally]);



  const handleEndRally = () => {
    const lastAction = rally.actionHistory[rally.actionHistory.length - 1];
    const faultingTeam = lastAction?.action === 'fault' ? lastAction.team : null;
    const winner = rally.possession;

    // End rally in parent
    endRally(winner, rally.stats, faultingTeam);

    // Reset rally for next point
    resetRally(winner);
    setConfirmation(false);

  };

  const handleCancelConfirmation = () => { undoLastAction(); setConfirmation(false); };

  const handleDiscardRally = () => { setDiscardConfirmation(true); };

  const confirmDiscardRally = () => { discardRally(); updateBallPossession(match.currentServer, true); setDiscardConfirmation(false); };

  const renderPreviousActionText = () => {
    if (!canUndo) return 'Ninguna';
    const lastAction = rally.actionHistory[rally.actionHistory.length - 1];
    const { action, team } = lastAction;
    const teamName = teams[team] || team;
    return `${actionLabels_sp[action]} ${teamName}`;
  };



  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2 }, boxSizing: 'border-box', display: 'flex', height: '100%', flexGrow: 1, pb: '72px' }}>
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          p: { xs: 0, sm: 4 },
          boxSizing: 'border-box',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 1,
          }}>
          <Button onClick={startMatch} variant='contained' sx={{ display: (match.matchStarted || match.winner) ? 'none' : undefined }}>
            Iniciar partido
          </Button>
          <Button onClick={resetMatch} variant='contained' sx={{ display: (match.winner) ? undefined : 'none' }}>
            Reiniciar partido
          </Button>
        </Box>

        <Card sx={{ p: 1, m: 0, border: 'none', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-evenly' }} variant='outlined' elevation={0}>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              my: 1,
            }}>
            {/* <ToggleButtonGroup exclusive value={match.currentServer}
              onChange={(event, newVal) => setServer(newVal)} disabled={!match.matchStarted || rallyStage !== 'start'}
              color="success" size='small'
              sx={{ display: (match.matchStarted || match.winner) ? undefined : 'none' }}
            >
              <ToggleButton value='teamA'> <ArrowLeft />Saca Equipo A</ToggleButton >
              <ToggleButton value='teamB'>Saca Equipo B<ArrowRight /></ToggleButton >
            </ToggleButtonGroup> */}
            <StyledToggleButtonGroup
              exclusive
              value={match.currentServer}
              onChange={(event, newVal) => setServer(newVal)}
              disabled={!match.matchStarted || rallyStage !== 'start'}
              sx={{
                display: (match.matchStarted || match.winner) ? 'flex' : 'none',
                width: '100%', // Para que abarque el mismo ancho que los botones de acción
                mt: 1
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
          <ScoreBoard
            teams={teams}
            teamLogos={teamLogos}
            teamColors={teamColors}
            scores={match.scores}
            setsWon={match.setsWon}
            currentServer={match.currentServer}
            ballPossession={match.ballPossession}
            matchStarted={match.matchStarted}
            onAdjustScore={adjustScore}
            maxSets={maxSets}
            onSetsWonChange={updateSetsWon}
            timeouts={match.timeouts}
            substitutions={match.substitutions}
            onTimeout={callTimeout}
            onSubstitution={callSubstitution}
            rallyStage={rallyStage}
            handleAction={handleAction}
          />

          <ActionButtons
            rallyStage={rally.stage}
            currentServer={match.currentServer}
            currentPossession={rally.possession}
            handleAction={handleAction}
          />
          <ConfirmationDialog
            open={rally.showConfirmation}
            message="¿Finalizar rally y asignar punto?"
            onConfirm={handleEndRally}
            onCancel={handleCancelConfirmation}
          />
          <ConfirmationDialog
            message="¿Seguro que desea descartar el rally y repetir el punto?"
            open={rally.showDiscardConfirmation}
            onConfirm={confirmDiscardRally}
            onCancel={() => setDiscardConfirmation(false)}
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
              <Tooltip title={'Deshacer última acción'}>
                <span>
                  <IconButton onClick={undoLastAction} disabled={!canUndo}
                    sx={{
                      display: { xs: 'flex', md: 'none' },
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#45a049'
                      },
                      '&:disabled': {
                        backgroundColor: '#e0e0e0'
                      }
                    }}
                  >
                    <Undo />
                  </IconButton>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={undoLastAction}
                    disabled={!canUndo}
                    startIcon={<Undo />}
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      fontSize: '0.75rem',
                      '&:hover': {
                        backgroundColor: '#45a049'
                      },
                      '&:disabled': {
                        backgroundColor: '#e0e0e0'
                      }
                    }}
                  >
                    Deshacer Acción
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={'Descartar y repetir el punto'}>
                <span>
                  <IconButton onClick={handleDiscardRally} disabled={!canUndo}
                    sx={{
                      display: { xs: 'flex', md: 'none' },
                      backgroundColor: '#FF9800',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#F57C00'
                      },
                      '&:disabled': {
                        backgroundColor: '#e0e0e0'
                      }
                    }}
                  >
                    <RestartAlt />
                  </IconButton>
                  <Button onClick={handleDiscardRally} disabled={!canUndo}
                    variant="contained"
                    size="small"
                    startIcon={<RestartAlt />}
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      backgroundColor: '#FF9800',
                      color: 'white',
                      fontSize: '0.75rem',
                      '&:hover': {
                        backgroundColor: '#F57C00'
                      },
                      '&:disabled': {
                        backgroundColor: '#e0e0e0'
                      }
                    }}
                  >
                    Repetir Punto
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Card>

        <StatsHandler
          teams={teams}
          teamColors={teamColors}
          localMatchData={match}
          expandedSetIndex={expandedSetIndex}
          setExpandedSetIndex={setExpandedSetIndex}
        />
      </Paper>
    </Box>
  );
}

export default Match;