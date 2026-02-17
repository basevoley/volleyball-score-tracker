import { useEffect, useState, useRef } from 'react';
import ScoreBoard from './ScoreBoard';
import StatsHandler from './StatsHandler';
import { useMatchManager } from '../hooks/useMatchManager';
import { useSocket } from '../contexts/SocketContext';
import { Box, Button, Card, IconButton, Paper, styled, TextField, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useRallyManager } from '../hooks/useRallyManager';
import ConfirmationDialog from './ConfirmationDialog';
import ActionButtons from './ActionButtons';
import { ArrowLeft, ArrowRight, RestartAlt, Undo } from '@mui/icons-material';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Avatar
} from '@mui/material';
import TrophyIcon from '@mui/icons-material/EmojiEvents';


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
    if (!match.matchStarted && match.setStats.length > 0) {
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

    const willEndSet = matchManager.willRallyEndSet(winner);

    // End rally in parent
    endRally(winner, rally.stats, faultingTeam);

    if (!willEndSet) {
      resetRally(winner);
      setConfirmation(false);
    }
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

  const handleEndSet = () => {
    const winner = rally.possession;
    matchManager.confirmSetEnd(true);
    resetRally(winner);
    setConfirmation(false);
  }

  const handleDiscardSetEnd = () => {
    matchManager.confirmSetEnd(false); // Descarta la actualización del set
    undoLastAction();                  // Deshace el último toque/falta en el rally
    setConfirmation(false);
  }

  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);

  // Efecto para abrir el diálogo cuando haya un ganador
  useEffect(() => {
    if (match.winner) {
      setWinnerDialogOpen(true);
    }
  }, [match.winner]);

  const handleCloseWinnerDialog = () => {
    setWinnerDialogOpen(false);
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
            display: (!match.matchStarted || match.winner) ? 'flex' : 'none',
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
            <StyledToggleButtonGroup
              exclusive
              value={match.currentServer}
              onChange={(event, newVal) => setServer(newVal)}
              disabled={!match.matchStarted || rallyStage !== 'start'}
              sx={{
                display: (match.matchStarted || match.winner) ? 'flex' : 'none',
                width: '100%',
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
            open={matchManager.pendingSetEnd}
            message="Este punto finaliza el set, lo cual no se puede deshacer. ¿Seguro que desea terminar el set?"
            onConfirm={handleEndSet}
            onCancel={handleDiscardSetEnd}
          />
          <ConfirmationDialog
            message="¿Seguro que desea descartar el rally y repetir el punto?"
            open={rally.showDiscardConfirmation}
            onConfirm={confirmDiscardRally}
            onCancel={() => setDiscardConfirmation(false)}
          />
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
      <Dialog
        open={winnerDialogOpen}
        onClose={handleCloseWinnerDialog}
        slotProps={{ paper: { sx: { borderRadius: 3, textAlign: 'center', p: 2 } } }}
      >
        <DialogTitle display='flex' flexDirection={'row'} justifyContent={'space-evenly'}>
          <TrophyIcon sx={{ fontSize: 60, color: '#FFD700' }} />
          <Typography variant="h4" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
            ¡Final!
          </Typography>
          <TrophyIcon sx={{ fontSize: 60, color: '#FFD700' }} />
        </DialogTitle>
        <DialogContent sx={{ overflow: 'visible' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={teamLogos[match.winner]}
              sx={{
                width: 130,
                height: 130,
                mx: 'auto',
                border: `2px solid ${teamColors[match.winner]}`,
                boxShadow: `0 0 25px 5px ${teamColors[match.winner]}80`, // El "80" al final añade 50% de opacidad hex
                backgroundColor: 'white',
              }}
            />
            <Typography variant="h5">
              {teams[match.winner]} ha ganado el partido
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Marcador final: {match.setsWon.teamA} - {match.setsWon.teamB}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={handleCloseWinnerDialog}
            variant="contained"
            color="primary"
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Match;