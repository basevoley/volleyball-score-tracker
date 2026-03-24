import { useEffect, useState, useRef, type Dispatch, type SetStateAction } from 'react';
import ScoreBoard from './ScoreBoard';
import StatsHandler from './StatsHandler';
import { useMatchManager } from '../hooks/useMatchManager';
import { useSocket } from '../contexts/SocketContext';
import { Box, Card, Paper } from '@mui/material';
import { useRallyManager } from '../hooks/useRallyManager';
import WinnerDialog from './WinnerDialog';
import RallyControl from './RallyControl';
import MatchHeader from './MatchHeader';
import type { MatchDetails, MatchData } from '../types';

interface Props {
  matchDetails: MatchDetails;
  matchData: Partial<MatchData> | null;
  setMatchData: Dispatch<SetStateAction<MatchData>>;
  noStats: boolean;
}

function Match({ matchDetails, matchData, setMatchData, noStats }: Props) {
  const { teams, teamLogos, teamColors, maxSets } = matchDetails;
  const didInitRef = useRef(false);
  const initialSetStatsLength = matchData?.setStats?.length ?? 0;
  const [expandedSetIndex, setExpandedSetIndex] = useState(
    initialSetStatsLength > 0 ? initialSetStatsLength - 1 : null
  );
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const { socket } = useSocket();

  const matchManager = useMatchManager(matchData, teams, maxSets);
  const { 
    match, 
    updateBallPossession, 
    clearMatchEvent, 
    getLastAction, 
    clearLastAction,
  } = matchManager;

  // Rally manager hook
  const rallyManager = useRallyManager(match.currentServer, updateBallPossession);//, setRallyStage);
  const {
    resetRally,
    updateInitialServer,
  } = rallyManager;

  // Sync parent/socket when match state changes
  useEffect(() => {
    const lastSet = match.setStats ? Math.max(match.setStats.length - 1, 0) : 0;
    setExpandedSetIndex(null);

    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }

    const lastAction = getLastAction();
    if (!lastAction) return;

    const skipSocket = lastAction.type === 'UPDATE_BALL_POSSESSION';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let socketPayload: any = { ...match };
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

    if (socket && !skipSocket) {
      socket.emit('matchData', socketPayload);
    }

    setMatchData(prev => ({
      ...prev,
      ...match,
      matchEvent: { type: null, details: null },
    }));

    if (match.matchEvent.type !== null) {
      clearMatchEvent();
    }

    clearLastAction();

  }, [match, setMatchData, socket, getLastAction, clearLastAction, clearMatchEvent]);

  // Sync currentServer when it changes
  useEffect(() => {
    if (match.currentServer !== null) {
      updateInitialServer(match.currentServer);
      resetRally(match.currentServer);
    }
  }, [match.currentServer, updateInitialServer, resetRally]);

  // Open winner dialog when match ends
  useEffect(() => {
    if (match.winner) {
      setWinnerDialogOpen(true);
    }
  }, [match.winner]);

  const handleCloseWinnerDialog = () => {
    setWinnerDialogOpen(false);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 1, sm: 2 }, 
      boxSizing: 'border-box', 
      display: 'flex', 
      height: '100%', 
      flexGrow: 1, 
      pb: '72px' 
    }}>
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
        {/* Match Header Component */}
        <MatchHeader
          teams={teams}
          matchManager={matchManager}
          rallyManager={rallyManager}
        />

        <Card sx={{ 
          p: 1, 
          m: 0, 
          border: 'none', 
          display: 'flex', 
          flexDirection: 'column', 
          flexGrow: 1, 
          justifyContent: 'space-evenly' 
        }} variant='outlined' elevation={0}>

          {/* ScoreBoard */}
          <ScoreBoard
            matchDetails={matchDetails}
            matchManager={matchManager}
            rallyManager={rallyManager}
          />

          {/* Rally Controller Component */}
          {!noStats && (
            <RallyControl
              teams={teams}
              matchManager={matchManager}
              rallyManager={rallyManager}
            />
          )}
        </Card>

        {/* Stats Handler */}
        {!noStats && (
          <StatsHandler
          teams={teams}
          teamColors={teamColors}
          localMatchData={match}
          expandedSetIndex={expandedSetIndex}
          setExpandedSetIndex={setExpandedSetIndex}
          />
        )}
      </Paper>

      {/* Winner Dialog */}
      <WinnerDialog
        isOpen={winnerDialogOpen}
        onClose={handleCloseWinnerDialog}
        teamColors={teamColors}
        teamLogos={teamLogos}
        teams={teams}
        match={match}
      />
    </Box>
  );
}

export default Match;
