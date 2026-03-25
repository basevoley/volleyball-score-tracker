import { useCallback, useEffect, useRef, useState } from 'react';
import ScoreBoard from './ScoreBoard';
import StatsHandler from './StatsHandler';
import { useSocket } from '../../services/socket/SocketContext';
import { Box, Card, Paper } from '@mui/material';
import WinnerDialog from './WinnerDialog';
import RallyControl from './RallyControl';
import MatchHeader from '../../shared/components/MatchHeader';
import type { MatchData, MatchDomainEvent } from '../../types';
import { useMatchContext } from '../../contexts/MatchContext';
import { usePreferences } from '../../contexts/PreferencesContext';

function Match() {
  const { matchManager, matchDetails, setOnMatchEvent } = useMatchContext();
  const { noStats } = usePreferences();
  const { teams, teamLogos, teamColors } = matchDetails;
  const { match } = matchManager;

  const [expandedSetIndex, setExpandedSetIndex] = useState<number | null>(
    match.setStats ? Math.max(match.setStats.length - 1, 0) : null
  );
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const { socket } = useSocket();

  // Always-current ref to match state — read in the event callback without stale closures
  const matchRef = useRef<MatchData | null>(null);
  matchRef.current = match;

  const handleMatchEvent = useCallback((event: MatchDomainEvent) => {
    const currentMatch = matchRef.current!;

    // Derive the overlay notification from the domain event (keeps socket payload backward-compatible)
    let matchEvent: { type: string | null; details: Record<string, unknown> | null } = { type: null, details: null };
    if (event.type === 'RallyEnded' && event.faultingTeam) {
      matchEvent = { type: 'referee-call', details: { text: 'Falta', team: teams[event.faultingTeam] } };
    } else if (event.type === 'TimeoutCalled') {
      matchEvent = { type: 'timeout', details: { text: 'Tiempo muerto', team: teams[event.team] } };
    } else if (event.type === 'SubstitutionCalled') {
      matchEvent = { type: 'substitution', details: { text: 'Cambio', team: teams[event.team] } };
    } else if (event.type === 'RallyDiscarded') {
      matchEvent = { type: 'referee-call', details: { text: 'Se repite el punto' } };
    }

    // Shape the socket payload (overlay-compatible)
    const lastSet = currentMatch.setStats ? Math.max(currentMatch.setStats.length - 1, 0) : 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socketPayload: any = { ...currentMatch, matchEvent };
    if (!currentMatch.matchStarted && currentMatch.setStats.length > 0) {
      socketPayload.currentSetStats = { ...currentMatch.setStats[lastSet].statistics };
      socketPayload.scores = { ...currentMatch.setScores[lastSet] || currentMatch.scores };
      if (!currentMatch.winner) {
        socketPayload.setScores = currentMatch.setScores.slice(0, -1);
      }
    }
    delete socketPayload.ballPossession;
    delete socketPayload.setStats;
    delete socketPayload.currentSetHistory;

    socket?.emit('matchData', socketPayload);
    setExpandedSetIndex(null);
  }, [socket, teams]);

  // Register / unregister the event handler with MatchContext
  useEffect(() => {
    setOnMatchEvent(handleMatchEvent);
    return () => setOnMatchEvent(null);
  }, [handleMatchEvent, setOnMatchEvent]);

  // Open winner dialog when match ends
  useEffect(() => {
    if (match.winner) {
      setWinnerDialogOpen(true);
    }
  }, [match.winner]);

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
        <MatchHeader
          teams={teams}
          matchManager={matchManager}
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

          <ScoreBoard
            matchDetails={matchDetails}
            matchManager={matchManager}
          />

          {!noStats && (
            <RallyControl
              teams={teams}
              matchManager={matchManager}
            />
          )}
        </Card>

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

      <WinnerDialog
        isOpen={winnerDialogOpen}
        onClose={() => setWinnerDialogOpen(false)}
        teamColors={teamColors}
        teamLogos={teamLogos}
        teams={teams}
        match={match}
      />
    </Box>
  );
}

export default Match;
