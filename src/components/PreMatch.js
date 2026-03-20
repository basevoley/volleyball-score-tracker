import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Grid,
  InputLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CustomCombobox from './CustomCombobox';
import MatchSelector from './MatchSelector';
import ModalOverlay from './ModalOverlay';
import { useSocket } from '../contexts/SocketContext';
import { TeamColorSelector } from './TeamColorSelector';
import TeamPlayerList from './EditablePlayerList';

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
    setMatchDetails(prevDetails => {
      const updated = {
        ...prevDetails,
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

      return updated;
    });

  }, [teamA, teamB, teamALogo, teamBLogo, teamAColor, teamBColor,
    matchHeader, stadium, extendedInfo, competitionLogo,
    maxSets, statsA, statsB, socket, setMatchDetails]);

  useEffect(() => {
    if (socket) {
      socket.emit('matchDetails', matchDetails);
    }
  }, [matchDetails, socket])



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

  const hasStats = [...Object.values(statsA), ...Object.values(statsB)].some(val => Number(val) > 0);
  const hasPlayers = (matchDetails.players.teamA?.length > 0) || (matchDetails.players.teamB?.length > 0);

  const renderStatInputs = (statsA, statsB) => (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Grid container spacing={1}>
        {/* Header Row */}
        <Grid size={4}>
          <Typography variant="subtitle2" align="center" fontWeight="bold">
            {teamA}
          </Typography>
        </Grid>
        <Grid size={4}>
          <Typography variant="subtitle2" align="center" fontWeight="bold">
            -
          </Typography>
        </Grid>
        <Grid size={4}>
          <Typography variant="subtitle2" align="center" fontWeight="bold">
            {teamB}
          </Typography>
        </Grid>

        {/* Stat Rows */}
        {statFields.map(stat => (
          <React.Fragment key={stat.key}>
            <Grid size={4}>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={statsA[stat.key]}
                onChange={(e) => handleStatChange('A', stat.key, e.target.value)}
                sx={{
                  '& .MuiInputBase-root': {
                    height: '36px'
                  },
                  '& .MuiInputBase-input': {
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    padding: '6px 8px'
                  }
                }}
              />
            </Grid>
            <Grid size={4}>
              <Typography
                variant="body2"
                align="center"
                sx={{
                  fontSize: '0.9rem',
                  // lineHeight: '36px'
                }}
              >
                {stat.label}
              </Typography>
            </Grid>
            <Grid size={4}>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={statsB[stat.key]}
                onChange={(e) => handleStatChange('B', stat.key, e.target.value)}
                sx={{
                  '& .MuiInputBase-root': {
                    height: '36px'
                  },
                  '& .MuiInputBase-input': {
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    padding: '6px 8px'
                  }
                }}
              />
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
    </Box>
  );



  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2 }, boxSizing: 'border-box' }}>
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          p: { xs: 2, sm: 4 },
          boxSizing: 'border-box',
          borderRadius: 2
        }}
      >
        <Box sx={{
          display: 'flex',

          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Button
            variant="contained"
            onClick={() => setIsModalOpen(true)}
            sx={{
              gap: '8px',
            }}
          >
            Obtener desde FMV
            <Box
              component="img"
              src="fmv_icon.png"
              alt="FMV Logo"
              sx={{ height: '20px' }}
            />
          </Button>
        </Box>

        {isModalOpen && (
          <ModalOverlay onClose={() => setIsModalOpen(false)}>
            <MatchSelector onSelectMatch={handleSelectMatch} />
          </ModalOverlay>
        )}

        <TextField
          fullWidth
          size='small'
          label="Cabecera de presentación del partido"
          placeholder="Cabecera de presentación del partido"
          value={matchHeader}
          onChange={(e) => setMatchHeader(e.target.value)}
          sx={{ margin: '10px 0' }}
        />

        <TextField
          fullWidth
          size='small'
          label="Información secundaria"
          placeholder="Información secundaria"
          value={extendedInfo}
          onChange={(e) => setExtendedInfo(e.target.value)}
          sx={{ margin: '10px 0' }}
        />

        <TextField
          fullWidth
          size='small'
          label="Pabellón de juego"
          placeholder="Pabellón de juego"
          value={stadium}
          onChange={(e) => setStadium(e.target.value)}
          sx={{ margin: '10px 0' }}
        />

        <FormControl fullWidth sx={{ margin: '10px 0' }} size='small'>
          <InputLabel>Número de Sets</InputLabel>
          <Select
            value={maxSets}
            label="Número de Sets"
            size='small'
            onChange={(e) => {
              const newMaxSets = parseInt(e.target.value, 10);
              setMaxSets(newMaxSets);
            }}
          >
            <MenuItem value={3}>3 Sets</MenuItem>
            <MenuItem value={5}>5 Sets</MenuItem>
          </Select>
        </FormControl>

        <Box
          sx={{
            display: 'flex',
            width: '100%',
            gap: '5px',
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            size='small'
            label="Logo de la Competicion"
            placeholder="Logo de la Competicion"
            value={competitionLogo}
            onChange={(e) => setCompetitionLogo(e.target.value)}
          />
          <Box
            component="img"
            src={competitionLogo}
            alt="Competition Logo"
            sx={{ width: '100px', height: '100px', objectFit: 'contain' }}
          />
        </Box>
        <Divider sx={{ mt: 1 }} />
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Equipo Local (Equipo A)
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '5px'
          }}
        >
          <TextField
            fullWidth
            size='small'
            label="Nombre del Equipo A"
            placeholder="Nombre del Equipo A"
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
          />
          <TeamColorSelector color={teamAColor} onColorChange={setTeamAColor} />
        </Box>

        <Box sx={{ width: '100%', mt: 1 }}>
          <CustomCombobox
            label="URL del escudo del Equipo A"
            placeholderText="URL del escudo del Equipo A"
            inputValue={teamALogo}
            onInputChange={setTeamALogo}
          />
        </Box>
        <Divider sx={{ mt: 1 }} />
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Equipo Visitante (Equipo B)
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '5px'
          }}
        >
          <TextField
            fullWidth
            size='small'
            label="Nombre del Equipo B"
            placeholder="Nombre del Equipo B"
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
          />
          <TeamColorSelector color={teamBColor} onColorChange={setTeamBColor} />
        </Box>

        <Box sx={{ width: '100%', mt: 1 }}>
          <CustomCombobox label={"URL del escudo del Equipo B"} placeholderText={"URL del escudo del Equipo B"} inputValue={teamBLogo} onInputChange={setTeamBLogo} />
        </Box>

        <Accordion defaultExpanded={hasStats} sx={{ mt: 1, mb: 0, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" >Comparativa de Equipos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ width: '100%', mt: 1 }}>

              {renderStatInputs(statsA, statsB)}
            </Box>

          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded={hasPlayers} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Jugadores</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ width: '100%', mt: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {teamA}
              </Typography>
              <TeamPlayerList teamId="teamA" matchDetails={matchDetails} setMatchDetails={setMatchDetails} />
              <Typography variant="subtitle2" fontWeight="bold">
                {teamB}
              </Typography>
              <TeamPlayerList teamId="teamB" matchDetails={matchDetails} setMatchDetails={setMatchDetails} />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}

export default PreMatch;