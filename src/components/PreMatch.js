import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomCombobox from './CustomCombobox';
import MatchSelector from './MatchSelector';
import ModalOverlay from './ModalOverlay';
import { useSocket } from '../contexts/SocketContext';
import { TeamColorSelector } from './TeamColorSelector';

const PreMatchContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 600px;
  margin: auto;
`;

const SyncButton = styled.button`
  margin: 5px;
  padding: 7px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const FmvIcon = styled.img`
  height: 20px;
`;

const TeamNameInput = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 5px;
`;

const ImageSelector = styled.div`
  display: flex;
  width: 100%;
  gap: 5px;
`;

const ImagePreview = styled.img`
  width: 100px;
`;

const Input = styled.input`
  margin: 10px 0;
  padding: 8px;
  width: 100%;
`;

const Select = styled.select`
  margin: 10px 0;
  padding: 8px;
  width: 100%;
`;

const StatInputs = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 10px;
  width: 100%;
  margin-top: 15px;
`;

const StatInput = styled.input`
  padding: 8px;
  width: 80%;
`;
const StatLabel = styled.label`
  text-align: center;
`;

function PreMatch({ setMatchDetails, matchDetails }) {
  const [teamA, setTeamA] = useState(matchDetails.teams.teamA);
  const [teamB, setTeamB] = useState(matchDetails.teams.teamB);
  const [teamALogo, setTeamALogo] = useState(matchDetails.teamLogos.teamA);
  const [teamBLogo, setTeamBLogo] = useState(matchDetails.teamLogos.teamB);
  const [teamAColor, setTeamAColor] = useState(matchDetails.teamColors.teamA);
  const [teamBColor, setTeamBColor] = useState(matchDetails.teamColors.teamB);
  const [matchHeader, setMatchHeader] = useState(matchDetails.matchHeader);
  const [stadium, setStadium] = useState(matchDetails.stadium);
  const [extendedInfo, setExtendedInfo] = useState(matchDetails.extendedInfo);
  const [competitionLogo, setCompetitionLogo] = useState(matchDetails.competitionLogo);
  const [maxSets, setMaxSets] = useState(matchDetails.maxSets);
  const [statsA, setStatsA] = useState(matchDetails.stats.teamA);
  const [statsB, setStatsB] = useState(matchDetails.stats.teamB);

  const { socket } = useSocket();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const updatedMatchDetails = {
      teams: { teamA, teamB },
      teamLogos: { teamA: teamALogo, teamB: teamBLogo },
      teamColors: { teamA: teamAColor, teamB: teamBColor },
      matchHeader,
      stadium,
      extendedInfo,
      competitionLogo,
      maxSets,
      stats: {
        teamA: statsA,
        teamB: statsB,
      },
    };

    setMatchDetails(updatedMatchDetails);

    if (socket) {
      socket.emit('matchDetails', updatedMatchDetails);
    }
  }, [teamA, teamB, teamALogo, teamBLogo, teamAColor, teamBColor, matchHeader, stadium, extendedInfo, competitionLogo, maxSets, statsA, statsB, setMatchDetails, socket]);

  const handleStatChange = (team, stat, value) => {
    const intValue = parseInt(value, 10);
    if (team === 'A') {
      setStatsA(prevStats => ({
        ...prevStats,
        [stat]: isNaN(intValue) ? 0 : intValue,
      }));
    } else {
      setStatsB(prevStats => ({
        ...prevStats,
        [stat]: isNaN(intValue) ? 0 : intValue,
      }));
    }
  };

  const handleSelectMatch = (selectedMatchDetails) => {
    setMatchHeader(selectedMatchDetails.matchHeader);
    setStadium(selectedMatchDetails.stadium);
    setExtendedInfo(selectedMatchDetails.extendedInfo);
    setCompetitionLogo(selectedMatchDetails.competitionLogo)
    setTeamA(selectedMatchDetails.teamA);
    setTeamB(selectedMatchDetails.teamB);
    setTeamALogo(selectedMatchDetails.teamALogo);
    setTeamBLogo(selectedMatchDetails.teamBLogo);
    setMaxSets(selectedMatchDetails.maxSets);
    setStatsA(selectedMatchDetails.stats.teamA);
    setStatsB(selectedMatchDetails.stats.teamB);
    setIsModalOpen(false);
  };

  const statFields = [
    { label: 'Posición', key: 'ranking' },
    { label: 'Puntos', key: 'competitionPoints' },
    { label: 'Partidos Jugados', key: 'matchesPlayed' },
    { label: 'Total Ganados', key: 'totalMatchesWon' },
    { label: 'Ganados 3 Puntos', key: 'won3Points' },
    { label: 'Ganados 2 Puntos', key: 'won2Points' },
    { label: 'Total Perdidos', key: 'totalMatchesLost' },
    { label: 'Perdidos 1 Puntos', key: 'lost1Point' },
    { label: 'Perdidos 0 Puntos', key: 'lost0Points' },
    { label: 'Total Puntos Anotados', key: 'totalPointsScored' },
    { label: 'Total Puntos Recibidos', key: 'totalPointsReceived' },
  ];

  const renderStatInputs = (statsA, statsB) => (
    <StatInputs>
      <StatLabel>{teamA}</StatLabel>
      <StatLabel> - </StatLabel>
      <StatLabel>{teamB}</StatLabel>
      {statFields.map(stat => (
        <React.Fragment key={stat.key}>
          <StatInput
            type="number"
            value={statsA[stat.key]}
            onChange={(e) => handleStatChange('A', stat.key, e.target.value)}
          />
          <StatLabel>{stat.label}</StatLabel>
          <StatInput
            type="number"
            value={statsB[stat.key]}
            onChange={(e) => handleStatChange('B', stat.key, e.target.value)}
          />
        </React.Fragment>
      ))}
    </StatInputs>
  );

  return (
    <PreMatchContainer>
      <SyncButton onClick={() => setIsModalOpen(true)}>Obtener desde FMV <FmvIcon src='fmv_icon.png' alt='FMV Logo'></FmvIcon> </SyncButton>
      {isModalOpen && (
        <ModalOverlay onClose={() => setIsModalOpen(false)}>
          <MatchSelector onSelectMatch={handleSelectMatch} />
        </ModalOverlay>
      )}
      <Input
        type="text"
        placeholder="Cabecera de presentación del partido"
        value={matchHeader}
        onChange={(e) => setMatchHeader(e.target.value)}
      />
      <Input
        type="text"
        placeholder="Información secundaria"
        value={extendedInfo}
        onChange={(e) => setExtendedInfo(e.target.value)}
      />
      <Input
        type="text"
        placeholder="Pabellón de juego"
        value={stadium}
        onChange={(e) => setStadium(e.target.value)}
      />
      <Select
        value={maxSets}
        onChange={(e) => {
          const newMaxSets = parseInt(e.target.value, 10);
          setMaxSets(newMaxSets);
        }}
      >
        <option value={3}>3 Sets</option>
        <option value={5}>5 Sets</option>
      </Select>
      <ImageSelector>
        <Input
          type="text"
          placeholder="Logo de la Competicion"
          value={competitionLogo}
          onChange={(e) => setCompetitionLogo(e.target.value)}
        />
        <ImagePreview src={competitionLogo}></ImagePreview>
      </ImageSelector>
      <h2>Equipo Local (Equipo A)</h2>
      <TeamNameInput>
        <Input
          type="text"
          placeholder="Nombre del Equipo A"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
        />
        <TeamColorSelector color={teamAColor} onColorChange={setTeamAColor} />
      </TeamNameInput>
      <CustomCombobox placeholderText={"URL del escudo del Equipo A"} inputValue={teamALogo} onInputChange={setTeamALogo} />
      <h2>Equipo Visitante (Equipo B)</h2>
      <TeamNameInput>
        <Input
          type="text"
          placeholder="Nombre del Equipo B"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
        />
        <TeamColorSelector color={teamBColor} onColorChange={setTeamBColor} />
      </TeamNameInput>
      <CustomCombobox placeholderText={"URL del escudo del Equipo B"} inputValue={teamBLogo} onInputChange={setTeamBLogo} />

      <h2>Comparativa</h2>
      {renderStatInputs(statsA, statsB)}

    </PreMatchContainer>
  );
}

export default PreMatch;
