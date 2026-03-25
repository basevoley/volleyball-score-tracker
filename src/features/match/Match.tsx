import { useEffect, useState } from 'react';
import ScoreBoard from './ScoreBoard';
import StatsHandler from './StatsHandler';
import { Box, Card, Paper } from '@mui/material';
import WinnerDialog from './WinnerDialog';
import RallyControl from './RallyControl';
import MatchHeader from '../../shared/components/MatchHeader';
import { useMatchContext } from '../../contexts/MatchContext';
import { usePreferences } from '../../contexts/PreferencesContext';

function Match() {
  const { matchManager, matchDetails, addMatchEventListener } = useMatchContext();
  const { noStats } = usePreferences();
  const { teams, teamLogos, teamColors } = matchDetails;
  const { match } = matchManager;

  const [expandedSetIndex, setExpandedSetIndex] = useState<number | null>(
    match.setStats ? Math.max(match.setStats.length - 1, 0) : null
  );
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);

  // Collapse set stats panel on every new rally event
  useEffect(() => {
    return addMatchEventListener(() => setExpandedSetIndex(null));
  }, [addMatchEventListener]);

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
