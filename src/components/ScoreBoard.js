import React from 'react';
import styled from 'styled-components';

const ScoreBoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const ScoresContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const TeamScoreA = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color:  ${({ $color }) => $color || '#007BFF'}; /* Blue for Team A */
  color: white;
  padding: 10px;
  border-radius: 8px;
  position: relative;
  border: ${({ $isPossession }) => ($isPossession ? '3px solid #32CD32' : 'none')}; /* Green border for possession */
  text-align: center;
`;

const TeamInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TeamScoreB = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${({ $color }) => $color || '#FF5733'}; /* Orange for Team B */
  color: white;
  padding: 10px;
  border-radius: 8px;
  position: relative;
  border: ${({ $isPossession }) => ($isPossession ? '3px solid #32CD32' : 'none')}; /* Green border for possession */
  text-align: center;
`;

const ScoreNumberContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ScoreNumber = styled.p`
  font-size: 3em;
  margin: 0 10px;
`;

const SetsWonContainer = styled.div`
display: flex;
    flex-direction: column;
    align-items: center;
`;

const SetsWonSelect = styled.select`
  margin-top: 5px;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
  width: fit-content;
`;

const ServingIndicator = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 15px;
  height: 15px;
  background-color: #FFD700; /* Gold for serving */
  border-radius: 50%;
`;

const TeamLogo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 5px;
`;

const ScoreAdjustContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ScoreAdjustButton = styled.button`
  margin: 5px;
  padding: 5px 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:hover:enabled { background-color: #45a049; }
`;

function ScoreBoard({ teams, teamLogos, teamColors, scores, setsWon, currentServer, ballPossession, matchStarted, onAdjustScore, maxSets, onSetsWonChange }) {
  const handleSetsWonChange = (team, event) => {
    const newSetsWon = parseInt(event.target.value, 10);
    onSetsWonChange(team, newSetsWon);
  };

  const renderSetsWonOptions = () => {
    const maxValue = maxSets / 2;
    const options = [];
    for (let i = 0; i <= maxValue; i++) {
      options.push(<option key={i} value={i}>{i}</option>);
    }
    return options;
  };

  return (
    <ScoreBoardContainer>
      <ScoresContainer>
        <TeamScoreA $isPossession={ballPossession === 'teamA'} $color={teamColors.teamA}>
          <TeamInfo>
            <TeamLogo src={teamLogos.teamA} alt={`${teams.teamA} logo`} />
            <span>{teams.teamA}</span>
          </TeamInfo>
          <ScoreNumberContainer>
            <ScoreAdjustContainer>
              <ScoreAdjustButton disabled={!matchStarted} onClick={() => onAdjustScore('teamA', 1)}>+</ScoreAdjustButton>
              <ScoreAdjustButton disabled={!matchStarted} onClick={() => onAdjustScore('teamA', -1)}>-</ScoreAdjustButton>
            </ScoreAdjustContainer>
            <ScoreNumber>{scores.teamA}</ScoreNumber>
          <SetsWonContainer>
            Sets: 
            <SetsWonSelect disabled={!matchStarted} value={setsWon.teamA} onChange={(event) => handleSetsWonChange('teamA', event)}>
              {renderSetsWonOptions()}
            </SetsWonSelect>
          </SetsWonContainer>
          </ScoreNumberContainer>
          {currentServer === 'teamA' && <ServingIndicator />}
        </TeamScoreA>
        <TeamScoreB $isPossession={ballPossession === 'teamB'} $color={teamColors.teamB}>
          <TeamInfo>
            <TeamLogo src={teamLogos.teamB} alt={`${teams.teamB} logo`} />
            <span>{teams.teamB}</span>
          </TeamInfo>
          <ScoreNumberContainer>
          <SetsWonContainer>
            Sets: 
            <SetsWonSelect disabled={!matchStarted} value={setsWon.teamB} onChange={(event) => handleSetsWonChange('teamB', event)}>
              {renderSetsWonOptions()}
            </SetsWonSelect>
          </SetsWonContainer>
            <ScoreNumber>{scores.teamB}</ScoreNumber>
            <ScoreAdjustContainer>
              <ScoreAdjustButton disabled={!matchStarted} onClick={() => onAdjustScore('teamB', 1)}>+</ScoreAdjustButton>
              <ScoreAdjustButton disabled={!matchStarted} onClick={() => onAdjustScore('teamB', -1)}>-</ScoreAdjustButton>
            </ScoreAdjustContainer>
          </ScoreNumberContainer>
          {currentServer === 'teamB' && <ServingIndicator />}
        </TeamScoreB>
      </ScoresContainer>
    </ScoreBoardContainer>
  );
}

export default ScoreBoard;
