import React, { useReducer, useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import ScoreBoard from './ScoreBoard';
import RallyControl from './RallyControl';
import Statistics from './Statistics';
import MatchReport from './MatchReport';
import MatchExcel from './MatchExcel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Customized } from 'recharts';

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
`;

const TimeoutContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 20px;
`;

const TimeoutButton = styled.button`
  flex: 1;
  margin: 0 5px;
  padding: 10px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:hover:enabled { background-color: #e68900; }
`;

const DownloadsContainer = styled.div`
display: flex;
    align-items: end;
    justify-content: end;
    width: 100%;
    padding-top: 20px;
`;
// --- Helper Functions ---
const calculatePercentage = (value, total) => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(2)}%`;
};

const calculateComputedStats = (updatedStats, team) => {
  const opposingTeam = team === 'teamA' ? 'teamB' : 'teamA';
  return ({
    ...updatedStats,
    [team]: {
      ...updatedStats[team],
      serviceEffectiveness: calculatePercentage(updatedStats[team].ace - updatedStats[team].serveError, updatedStats[team].serve),
      receptionEffectiveness: calculatePercentage(updatedStats[team].reception - updatedStats[team].receptionError, updatedStats[opposingTeam].serve),
      attackEffectiveness: calculatePercentage(updatedStats[team].attackPoint - updatedStats[team].attackError, updatedStats[team].attack),
      defenseEffectiveness: calculatePercentage(updatedStats[team].dig - updatedStats[team].digError, updatedStats[opposingTeam].attack),
      selfErrors: (updatedStats[team].serveError + updatedStats[team].receptionError + updatedStats[team].digError + updatedStats[team].attackError + updatedStats[team].blockOut + updatedStats[team].fault) || 0,
    }
  })
}

const updateStatsByTeam = (team, currentStats, statsUpdate) => ({
  serve: currentStats[team].serve + (statsUpdate[team]?.serve || 0),
  ace: currentStats[team].ace + (statsUpdate[team]?.ace || 0),
  serveError: currentStats[team].serveError + (statsUpdate[team]?.serveError || 0),
  reception: currentStats[team].reception + (statsUpdate[team]?.reception || 0),
  receptionError: currentStats[team].receptionError + (statsUpdate[team]?.receptionError || 0),
  dig: currentStats[team].dig + (statsUpdate[team]?.dig || 0),
  digError: currentStats[team].digError + (statsUpdate[team]?.digError || 0),
  attack: currentStats[team].attack + (statsUpdate[team]?.attack || 0),
  attackPoint: currentStats[team].attackPoint + (statsUpdate[team]?.attackPoint || 0),
  attackError: currentStats[team].attackError + (statsUpdate[team]?.attackError || 0),
  block: currentStats[team].block + (statsUpdate[team]?.block || 0),
  blockPoint: currentStats[team].blockPoint + (statsUpdate[team]?.blockPoint || 0),
  blockOut: currentStats[team].blockOut + (statsUpdate[team]?.blockOut || 0),
  fault: currentStats[team].fault + (statsUpdate[team]?.fault || 0),
});

const calculateUpdatedStatistics = (currentStats, statsUpdate) => {
  let updatedStats =
  {
    teamA: updateStatsByTeam('teamA', currentStats, statsUpdate),
    teamB: updateStatsByTeam('teamB', currentStats, statsUpdate),
  }
  updatedStats = calculateComputedStats(updatedStats, 'teamA');
  updatedStats = calculateComputedStats(updatedStats, 'teamB');
  return updatedStats;
};

// Empty stats template (includes computed fields so UI shows initialized values)
const emptyStats = {
  teamA: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
  teamB: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
};

// Helper to check and handle game/set end
const checkAndApplyGameEnd = (state, maxSets, teams) => {
  const scoreDifference = state.scores.teamA - state.scores.teamB;
  const isTiebreakerSet = state.setsWon.teamA + state.setsWon.teamB === maxSets - 1;
  const requiredPoints = isTiebreakerSet ? 15 : 25;

  let newSetsWon = { ...state.setsWon };
  let newScores = { ...state.scores };
  let matchEnded = false;
  let setEnded = false;
  const newSetScores = [...state.setScores, { teamA: state.scores.teamA, teamB: state.scores.teamB }];
  let newSetStats = [...state.setStats];

  if (state.winner) {
    return state;
  }

  if (state.scores.teamA >= requiredPoints && scoreDifference >= 2) {
    newSetsWon.teamA += 1;
    setEnded = true;
  } else if (state.scores.teamB >= requiredPoints && scoreDifference <= -2) {
    newSetsWon.teamB += 1;
    setEnded = true;
  }

  if (setEnded) {
    // Save current set stats before resetting
    newSetStats.push({
      setNumber: state.setsWon.teamA + state.setsWon.teamB + 1,
      scores: { teamA: state.scores.teamA, teamB: state.scores.teamB },
      statistics: state.currentSetStats,
      history: state.currentSetHistory || [],
    });

    if (newSetsWon.teamA === Math.ceil(maxSets / 2) || newSetsWon.teamB === Math.ceil(maxSets / 2)) {
      matchEnded = true;
    }
    newScores = { teamA: 0, teamB: 0 };
  }

  if (matchEnded) {
    const winner = newSetsWon.teamA > newSetsWon.teamB ? "teamA" : "teamB";
    alert(`${teams[winner]} ha ganado el partido!`);
    return {
      ...state,
      setsWon: newSetsWon,
      setScores: newSetScores,
      setStats: newSetStats,
      matchStarted: false,
      timeouts: { teamA: 0, teamB: 0 },
      winner,
      currentServer: null,
      ballPossession: null,
    };
  } else if (setEnded) {
    return {
      ...state,
      scores: newScores,
      setsWon: newSetsWon,
      setScores: newSetScores,
      setStats: newSetStats,
      currentSetStats: { ...emptyStats }, // Reset stats for new set
      currentSetHistory: [],
      timeouts: { teamA: 0, teamB: 0 },
    };
  } else {
    return state;
  }
};

// --- Reducer and Initial State ---

const initialState = {
  scores: { teamA: 0, teamB: 0 },
  setsWon: { teamA: 0, teamB: 0 },
  setScores: [],
  currentServer: null,
  ballPossession: null,
  matchStarted: false,
  timeouts: { teamA: 0, teamB: 0 },
  statistics: { ...emptyStats },
  currentSetStats: { ...emptyStats },
  currentSetHistory: [],
  setStats: [], // Array of { setNumber, scores: { teamA, teamB }, statistics: {...} }
  winner: '',
  matchEvent: {
    type: null,
    details: null,
  },
};

const matchReducer = (state, action) => {
  switch (action.type) {
    case 'START_MATCH':
      return {
        ...state,
        matchStarted: true,
      };
    case 'SET_CURRENT_SERVER':
      return {
        ...state,
        currentServer: action.server,
        ballPossession: action.server,
      };
    case 'UPDATE_BALL_POSSESSION':
      const matchEvent = action.rallyDiscarded ? { type: 'referee-call', details: { text: 'Se repite el punto' } } : state.matchEvent;
      return { ...state, ballPossession: action.newPossession, matchEvent };
    case 'RALLY_END': {
      const { winner, statsUpdate, faultingTeam, teams, maxSets } = action;
      const newScores = {
        ...state.scores,
        [winner]: state.scores[winner] + 1,
      };
      const updatedStatistics = calculateUpdatedStatistics(state.statistics, statsUpdate);
      const updatedSetStats = calculateUpdatedStatistics(state.currentSetStats, statsUpdate);
      const matchEvent = faultingTeam ? { type: 'referee-call', details: { text: 'Falta', team: teams[faultingTeam] } } : state.matchEvent;
      const newHistoryEntry = {
        index: (state.currentSetHistory ? state.currentSetHistory.length : 0) + 1,
        timestamp: Date.now(),
        scores: newScores,
        event: faultingTeam ? { type: 'fault', team: faultingTeam } : { type: 'rally', details: statsUpdate },
      };
      const stateAfterRally = {
        ...state,
        scores: newScores,
        statistics: updatedStatistics,
        currentSetStats: updatedSetStats,
        currentSetHistory: [...(state.currentSetHistory || []), newHistoryEntry],
        currentServer: winner,
        matchEvent,
      };
      // Check if this rally ended a set/match
      return checkAndApplyGameEnd(stateAfterRally, maxSets, teams);
    }
    case 'TIMEOUT':
      const { teams } = action;
      const newTimeouts = {
        ...state.timeouts,
        [action.team]: state.timeouts[action.team] + 1,
      };
      const timeoutHistoryEntry = {
        index: (state.currentSetHistory ? state.currentSetHistory.length : 0) + 1,
        timestamp: Date.now(),
        scores: { ...state.scores },
        event: { type: 'timeout', team: action.team },
      };
      return {
        ...state,
        timeouts: newTimeouts,
        currentSetHistory: [...(state.currentSetHistory || []), timeoutHistoryEntry],
        matchEvent: { type: 'timeout', details: { text: 'Tiempo muerto', team: teams[action.team] } }
      };
    case 'ADJUST_SCORE':
      const adjustedScores = {
        ...state.scores,
        [action.team]: Math.max(0, state.scores[action.team] + action.adjustment),
      };
      const adjustHistoryEntry = {
        index: (state.currentSetHistory ? state.currentSetHistory.length : 0) + 1,
        timestamp: Date.now(),
        scores: adjustedScores,
        event: { type: 'rally' },
      };
      const stateAfterAdjust = {
        ...state,
        scores: adjustedScores,
        currentSetHistory: [...(state.currentSetHistory || []), adjustHistoryEntry],
      };
      // Check if adjustment ended a set/match
      return checkAndApplyGameEnd(stateAfterAdjust, action.maxSets, action.teams);
    case 'UPDATE_SETS_WON':
      const stateAfterSetUpdate = {
        ...state,
        setsWon: {
          ...state.setsWon,
          [action.team]: action.newSetsWon,
        },
      };
      // Check if set update ended the match
      return checkAndApplyGameEnd(stateAfterSetUpdate, action.maxSets, action.teams);
    case 'RESET_MATCH':
      return initialState;
    case 'CLEAN_MATCH_EVENT':
      return {
        ...state,
        matchEvent: { type: null, details: null },
      };
    default:
      return state;
  }
};

// --- Main Match Component ---

function Match({ matchDetails, matchData, setMatchData, socket }) {
  const { teams, teamLogos, maxSets } = matchDetails;
  const [localMatchData, dispatch] = useReducer(matchReducer, matchData || initialState);
  const [rallyStage, setRallyStage] = useState('start'); // Track rally stage
  const lastActionRef = useRef(null);
  const didInitRef = useRef(false);
  const [expandedSetIndex, setExpandedSetIndex] = useState(
    (matchData && matchData.setStats && matchData.setStats.length > 0) ? matchData.setStats.length - 1 : null
  );


  // Sync parent/socket once per action
  useEffect(() => {
    // Keep the per-set accordion focused on the most recent set when setStats changes
    const len = localMatchData.setStats ? localMatchData.setStats.length : 0;
    if (len > 0) setExpandedSetIndex(len - 1);
    else setExpandedSetIndex(null);

    if (!didInitRef.current) {
      didInitRef.current = true;
      return; // skip initial mount
    }

    const lastAction = lastActionRef.current;
    if (!lastAction) return;

    // Skip socket emission for ball possession updates
    const skipSocket = lastAction.type === 'UPDATE_BALL_POSSESSION';

    // Prepare payload: during play, only emit currentSetStats; on match end, emit all setStats
    let socketPayload = { ...localMatchData };
    if (localMatchData.winner) {
      // Match ended: send aggregated statistics and all set data
      socketPayload.statistics = localMatchData.statistics;
      socketPayload.setStats = localMatchData.setStats;
    } else {
      // During play: only send current set stats
      socketPayload.statistics = localMatchData.currentSetStats;
      delete socketPayload.setStats;
    }

    // Send to socket
    if (socket && !skipSocket) {
      socket.emit('matchData', socketPayload);
    }
    
    // Merge full state with existing parent state
    setMatchData(prev => ({
      ...prev,
      ...localMatchData,
      matchEvent: { type: null, details: null },
    }));

    // Clean matchEvent from local state after emission
    if (localMatchData.matchEvent.type !== null) {
      dispatch({ type: 'CLEAN_MATCH_EVENT' });
    }

    lastActionRef.current = null;
  }, [localMatchData, setMatchData, socket]);

  const handleStartMatch = () => {
    lastActionRef.current = { type: 'START_MATCH' };
    dispatch({ type: 'START_MATCH' });
  };

  const handleSetCurrentServer = (server) => {
    lastActionRef.current = { type: 'SET_CURRENT_SERVER' };
    dispatch({ type: 'SET_CURRENT_SERVER', server });
  };

  const updateBallPossession = (newPossession, rallyDiscarded = null) => {
    lastActionRef.current = { type: 'UPDATE_BALL_POSSESSION' };
    dispatch({ type: 'UPDATE_BALL_POSSESSION', newPossession, rallyDiscarded });
  };

  const handleRallyEnd = (winner, statsUpdate = {}, faultingTeam = null) => {
    lastActionRef.current = { type: 'RALLY_END' };
    dispatch({ type: 'RALLY_END', winner, statsUpdate, faultingTeam, teams, maxSets });
  };

  const handleTimeout = (team) => {
    lastActionRef.current = { type: 'TIMEOUT' };
    dispatch({ type: 'TIMEOUT', team, teams });
  };

  const handleAdjustScore = (team, adjustment) => {
    lastActionRef.current = { type: 'ADJUST_SCORE' };
    dispatch({ type: 'ADJUST_SCORE', team, adjustment, maxSets, teams });
  };

  const handleRallyStageChange = (stage) => {
    setRallyStage(stage);
  };

  const handleSetsWonChange = (team, newSetsWon) => {
    lastActionRef.current = { type: 'UPDATE_SETS_WON' };
    dispatch({
      type: 'UPDATE_SETS_WON',
      team,
      newSetsWon,
      maxSets,
      teams,
    });
  };

  return (
    <MatchContainer>
      <div>
        <TeamButton onClick={() => handleStartMatch()} disabled={localMatchData.matchStarted} >Iniciar partido</TeamButton>
      </div>
      <div>
        <TeamButton onClick={() => handleSetCurrentServer('teamA')} disabled={!localMatchData.matchStarted || rallyStage !== 'start'}>Saca Equipo A</TeamButton>
        <TeamButton onClick={() => handleSetCurrentServer('teamB')} disabled={!localMatchData.matchStarted || rallyStage !== 'start'}>Saca Equipo B</TeamButton>
      </div>

      <ScoreBoard
        teams={teams}
        teamLogos={teamLogos}
        scores={localMatchData.scores}
        setsWon={localMatchData.setsWon}
        currentServer={localMatchData.currentServer}
        ballPossession={localMatchData.ballPossession}
        matchStarted={localMatchData.matchStarted}
        onAdjustScore={handleAdjustScore}
        maxSets={maxSets}
        onSetsWonChange={handleSetsWonChange}
      />
      <TimeoutContainer>
        <TimeoutButton
          onClick={() => handleTimeout('teamA')}
          disabled={!localMatchData.matchStarted || localMatchData.timeouts.teamA >= 2 || rallyStage !== 'start'}
        >
          Tiempo Muerto (Equipo A)  ({localMatchData.timeouts.teamA}/2)
        </TimeoutButton>
        <TimeoutButton
          onClick={() => handleTimeout('teamB')}
          disabled={!localMatchData.matchStarted || localMatchData.timeouts.teamB >= 2 || rallyStage !== 'start'}
        >
          Tiempo Muerto (Equipo B) ({localMatchData.timeouts.teamB}/2)
        </TimeoutButton>
      </TimeoutContainer>

      <RallyControl
        teams={teams}
        currentServer={localMatchData.currentServer}
        ballPossession={localMatchData.ballPossession}
        onRallyEnd={handleRallyEnd}
        updateBallPossession={updateBallPossession}
        matchStarted={localMatchData.matchStarted}
        onSetCurrentServer={handleSetCurrentServer}
        onRallyStageChange={handleRallyStageChange}
      />
      <Accordion style={{ width: '100%', marginTop: 16 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Estadísticas y Descargas</Typography>
        </AccordionSummary>
        <AccordionDetails style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DownloadsContainer>
            <MatchReport teams={teams} statistics={localMatchData.statistics} setScores={localMatchData.setScores} setStats={localMatchData.setStats} />
            <MatchExcel teams={teams} statistics={localMatchData.statistics} setScores={localMatchData.setScores} setStats={localMatchData.setStats} />
          </DownloadsContainer>
          <div style={{ marginTop: 12, marginBottom: 8 }}>
            <Typography variant="h6" style={{ fontWeight: 600, color: '#333' }}>
              Set {(localMatchData.setsWon.teamA + localMatchData.setsWon.teamB) + 1} - Estadísticas en Vivo
            </Typography>
          </div>
          <Statistics teams={teams} statistics={localMatchData.currentSetStats} />

          {localMatchData.setStats && localMatchData.setStats.length > 0 && (
            <div>
              <h3>Resumen de sets</h3>
              {localMatchData.setStats.map((set, index) => (
                <Accordion
                  key={index}
                  expanded={expandedSetIndex === index}
                  style={{ marginBottom: 8, backgroundColor: '#ffffff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                  onChange={(e, isExpanded) => setExpandedSetIndex(isExpanded ? index : null)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f6f6f6', padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>Set {set.setNumber}:</span>
                        <span style={{ fontWeight: 600 }}>{teams.teamA}</span>
                        <span style={{ color: '#666' }}>{set.scores.teamA}</span>
                        <span style={{ margin: '0 6px' }}>-</span>
                        <span style={{ fontWeight: 600 }}>{teams.teamB}</span>
                        <span style={{ color: '#666' }}>{set.scores.teamB}</span>
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 12, display: 'block', backgroundColor: '#fff' }}>
                    <Statistics teams={teams} statistics={set.statistics} />
                    {set.history && set.history.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <SetTimeline history={set.history} teams={teams} />
                      </div>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          )}

            <div>
              <Accordion style={{ marginTop: 12, backgroundColor: '#ffffff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f6f6f6', padding: '8px 12px' }}>
                  <Typography style={{ fontWeight: 600 }}>Estadísticas Totales del Partido</Typography>
                </AccordionSummary>
                <AccordionDetails style={{ padding: 12, display: 'block', backgroundColor: '#fff' }}>
                  <Statistics teams={teams} statistics={localMatchData.statistics} />
                </AccordionDetails>
              </Accordion>
            </div>
        </AccordionDetails>
      </Accordion>
    </MatchContainer>
  );
}

// Per-set timeline chart with event labels and optimized mobile layout
function SetTimeline({ history = [], teams }) {
  if (!history || history.length === 0) return null;
  const data = history.map((h, i) => ({
    rally: i + 1,
    teamA: h.scores.teamA,
    teamB: h.scores.teamB,
    event: h.event,
    timestamp: h.timestamp,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const p = payload[0].payload;
    return (
      <div style={{ background: 'white', border: '1px solid #ccc', padding: 8, fontSize: 12 }}>
        <div style={{ fontWeight: 700 }}>Rally {label}</div>
        <div>{teams.teamA}: {p.teamA}</div>
        <div>{teams.teamB}: {p.teamB}</div>
        {p.event && p.event.type !== 'rally' && (
          <div style={{ marginTop: 6 }}><strong>Evento:</strong> {p.event.type}</div>
        )}
      </div>
    );
  };

  const renderDot = (props) => {
    const { cx, cy, payload, dataKey } = props;
    const hasEvent = payload && payload.event && payload.event.type && payload.event.type !== 'rally';
    const fill = dataKey === 'teamA' ? '#1976d2' : '#d32f2f';
    return (
      <circle cx={cx} cy={cy} r={hasEvent ? 5 : 2.5} fill={fill} stroke={hasEvent ? '#333' : 'none'} strokeWidth={1} />
    );
  };

  return (
    <div style={{ width: '100%', height: 180, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 8, left: 6, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rally" label={{ value: 'Rally', position: 'insideBottomRight', offset: -6 }} tick={{ fontSize: 10 }} />
          <YAxis width={30} label={{ value: 'Puntos', angle: -90, position: 'insideLeft', offset: 0 }} allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="teamA" stroke="#1976d2" dot={renderDot} isAnimationActive={false} strokeWidth={2} />
          <Line type="monotone" dataKey="teamB" stroke="#d32f2f" dot={renderDot} isAnimationActive={false} strokeWidth={2} />
          <Customized component={(props) => {
            const { xAxisMap, yAxisMap } = props;
            if (!xAxisMap || !yAxisMap) return null;
            const xScale = xAxisMap[0].scale;
            const yScale = yAxisMap[0].scale;
            return (
              <g>
                {data.map((d, i) => {
                  if (!d.event || d.event.type === 'rally') return null;
                  const eventTeam = d.event.team;
                  const isFault = d.event.type === 'fault';
                  const isTimeout = d.event.type === 'timeout';
                  if (!isFault && !isTimeout) return null;
                  const cx = xScale(d.rally);
                  const cy = eventTeam === 'teamA' ? yScale(d.teamA) - 14 : yScale(d.teamB) + 14;
                  const color = eventTeam === 'teamA' ? '#1976d2' : '#d32f2f';
                  const eventLabel = isFault ? `Fault (${teams[eventTeam]})` : `Timeout (${teams[eventTeam]})`;
                  
                  return (
                    <g key={`evt-${i}`} style={{ cursor: 'pointer' }}>
                      {/* SVG symbol: X for fault, rect/lines for timeout */}
                      {isFault ? (
                        // Fault: X symbol
                        <>
                          <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke={color} strokeWidth={2} />
                          <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} stroke={color} strokeWidth={2} />
                        </>
                      ) : (
                        // Timeout: two vertical lines (pause icon)
                        <>
                          <rect x={cx - 4} y={cy - 5} width={2} height={10} fill={color} />
                          <rect x={cx + 2} y={cy - 5} width={2} height={10} fill={color} />
                        </>
                      )}
                      {/* Tooltip on hover (using title for native browser tooltip) */}
                      <title>{eventLabel}</title>
                      {/* Invisible larger rect for easier hover target on mobile */}
                      <rect x={cx - 8} y={cy - 8} width={16} height={16} fill="transparent" pointerEvents="all" style={{ cursor: 'pointer' }}>
                        <title>{eventLabel}</title>
                      </rect>
                    </g>
                  );
                })}
              </g>
            );
          }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Match;
