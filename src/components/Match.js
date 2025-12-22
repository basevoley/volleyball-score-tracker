import { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import ScoreBoard from './ScoreBoard';
import RallyControl from './RallyControl';
import StatsHandler from './StatsHandler';
import { useMatchManager } from '../hooks/useMatchManager';
import { useSocket } from '../contexts/SocketContext';

// --- Styled Components ---

const MatchContainer = styled.div`
display: flex; 
flex-direction: column; 
align-items: center; 
padding: 5px; 
max-width: 600px; 
margin: auto; 
background-color: #f9f9f9; 
border-radius: 8px; 
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
`;

const TeamButton = styled.button`
margin: 5px;
` ;

const TimeoutContainer = styled.div`
display: flex; 
justify-content: space-between;
width: 100%;
margin-top: 20px;` ;

const TimeoutButton = styled.button` 
flex: 1; 
margin: 0 5px; 
padding: 10px; 
background-color: #ff9800; 
color: white; 
border: none; 
border-radius: 5px; 
cursor: pointer; 
&:disabled { 
  opacity: 0.6;
  cursor: not-allowed; 
} 
&:hover:enabled { 
  background-color: #e68900; 
}` ;

// --- Main Match Component ---

function Match({ matchDetails, matchData, setMatchData }) {
  const { teams, teamLogos, maxSets } = matchDetails;
  const [rallyStage, setRallyStage] = useState('start');
  const didInitRef = useRef(false);
  const [expandedSetIndex, setExpandedSetIndex] = useState(
    matchData?.setStats?.length > 0 ? matchData.setStats.length - 1 : null
  );

  const { socket } = useSocket();

  // Use the match manager hook 
  const matchManager = useMatchManager(matchData, teams, maxSets); 
  const { match, startMatch, resetMatch, setServer, updateBallPossession, endRally, callTimeout, adjustScore, updateSetsWon, clearMatchEvent, getLastAction, clearLastAction, } = matchManager;

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
    if (!match.matchStarted) {
      socketPayload.currentSetStats = { ...match.setStats[lastSet] };
      socketPayload.scores = { ...match.setScores[lastSet] || match.scores };
      socketPayload.setScores = match.setScores.slice(0, -1);
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

  return (
    <MatchContainer>
      <div>
        <TeamButton onClick={startMatch} disabled={match.matchStarted || match.winner}>
          Iniciar partido
        </TeamButton>
        <TeamButton onClick={resetMatch} disabled={!match.winner}>
          Reiniciar partido
        </TeamButton>
      </div>
      <div>
        <TeamButton onClick={() => setServer('teamA')} disabled={!match.matchStarted || rallyStage !== 'start'}>Saca Equipo A</TeamButton>
        <TeamButton onClick={() => setServer('teamB')} disabled={!match.matchStarted || rallyStage !== 'start'}>Saca Equipo B</TeamButton>
      </div>

      <ScoreBoard
        teams={teams}
        teamLogos={teamLogos}
        scores={match.scores}
        setsWon={match.setsWon}
        currentServer={match.currentServer}
        ballPossession={match.ballPossession}
        matchStarted={match.matchStarted}
        onAdjustScore={adjustScore}
        maxSets={maxSets}
        onSetsWonChange={updateSetsWon}
      />

      <TimeoutContainer>
        <TimeoutButton
          onClick={() => callTimeout('teamA')}
          disabled={
            !match.matchStarted ||
            match.timeouts.teamA >= 2 ||
            rallyStage !== 'start'
          }
        >
          Tiempo Muerto (Equipo A) ({match.timeouts.teamA}/2)
        </TimeoutButton>
        <TimeoutButton
          onClick={() => callTimeout('teamB')}
          disabled={
            !match.matchStarted ||
            match.timeouts.teamB >= 2 ||
            rallyStage !== 'start'
          }
        >
          Tiempo Muerto (Equipo B) ({match.timeouts.teamB}/2)
        </TimeoutButton>
      </TimeoutContainer>

      <RallyControl
        teams={teams}
        currentServer={match.currentServer}
        onRallyEnd={endRally}
        updateBallPossession={updateBallPossession}
        onRallyStageChange={setRallyStage}
      />

      <StatsHandler
        teams={teams}
        localMatchData={match}
        expandedSetIndex={expandedSetIndex}
        setExpandedSetIndex={setExpandedSetIndex}
      />
    </MatchContainer>
  );
}

export default Match;