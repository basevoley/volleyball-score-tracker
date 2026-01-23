// app.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PreMatch from './components/PreMatch';
import Match from './components/Match';
import Controls from './components/Controls';
import ResizablePreview from './components/ResizablePreview';
import Cookies from 'js-cookie';
import ShortUUID from 'short-uuid';
import { SocketProvider } from './contexts/SocketContext';
import { ConnectionStatus } from './components/ConnectionStatus';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3005';
const OVERLAY_URL = process.env.REACT_APP_OVERLAY_URL || 'http://localhost:3001';

const initialConfig = {
  scoreboard: {
    enabled: false,
    type: 'classic',
    position: 'top',
    showHistory: true,
  },
  matchup: {
    enabled: false,
  },
  lowerThird: {
    enabled: false,
  },
  socialMedia: {
    enabled: false,
    position: 'top-left',
    channels: [
      { network: 'YouTube', handle: 'voleibolAlcala', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png' },
      { network: 'TikTok', handle: 'cv_Alcala', icon: 'https://images.seeklogo.com/logo-png/34/2/tiktok-logo-png_seeklogo-340606.png' },
      { network: 'Instagram', handle: 'voleibolalcala', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Instagram-Gradient-Logo-PNG.png' },
      { network: 'Twitch', handle: 'cvalcalaoficial', icon: 'https://images.seeklogo.com/logo-png/44/2/twitch-new-logo-png_seeklogo-447573.png' },
      { network: 'Facebook', handle: 'Club-Voleibol-Alcalá', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png' },
    ],
  },
  teamComparison: {
    enabled: false,
  },
  afterMatch: {
    enabled: false,
    showStats: true,
  },
  sponsors: {
    enabled: false,
    imageUrls: [
      'sponsors-1.png',
      'sponsors-2.png',
      'sponsors-3.png',
    ],
    displayTime: 5000,
  },
};

const initialMatchDetails = {
  teams: { teamA: 'Equipo Local Demo', teamB: 'Equipo Visitante Demo' },
  teamLogos: {
    teamA: 'logo192.png',
    teamB: 'logo.svg'
  },
  teamColors: {
    teamA: '#007BFF',
    teamB: '#FF5733'
  },
  matchHeader: 'CATEGORIA - Division',
  extendedInfo: 'Fase - Jornada X',
  stadium: 'Pabellón donde se juega, Ciudad',
  competitionLogo: 'sample_logo.jpg',
  maxSets: 5,
  stats: {
    teamA: {
      ranking: 0,
      competitionPoints: 0,
      matchesPlayed: 0,
      totalMatchesWon: 0,
      won3Points: 0,
      won2Points: 0,
      totalMatchesLost: 0,
      lost1Point: 0,
      lost0Points: 0,
      totalPointsScored: 0,
      totalPointsReceived: 0,
    },
    teamB: {
      ranking: 0,
      competitionPoints: 0,
      matchesPlayed: 0,
      totalMatchesWon: 0,
      won3Points: 0,
      won2Points: 0,
      totalMatchesLost: 0,
      lost1Point: 0,
      lost0Points: 0,
      totalPointsScored: 0,
      totalPointsReceived: 0,
    }
  },
};

const initialMatchData = {
  scores: { teamA: 0, teamB: 0 },
  setsWon: { teamA: 0, teamB: 0 },
  setScores: [],
  currentServer: null,
  ballPossession: null,
  matchStarted: false,
  timeouts: { teamA: 0, teamB: 0 },
  substitutions: { teamA: 0, teamB: 0 },
  statistics: {
    teamA: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
    teamB: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
  },
  currentSetStats: {
    teamA: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
    teamB: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
  },
  currentSetHistory: [],
  setStats: [],
  winner: null,
  matchEvent: {
    type: null,
    details: null,
  },
};

function App() {
  const [matchDetails, setMatchDetails] = useState(initialMatchDetails);
  const [matchData, setMatchData] = useState(initialMatchData);
  const [config, setConfig] = useState(initialConfig);
  const [activeTab, setActiveTab] = useState(0);

  const matchDetailsRef = useRef(matchDetails);
  const matchDataRef = useRef(matchData);
  const configRef = useRef(config);

  // Update refs whenever state changes
  useEffect(() => {
    matchDetailsRef.current = matchDetails;
  }, [matchDetails]);

  useEffect(() => {
    matchDataRef.current = matchData;
  }, [matchData]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [key] = useState(() => {
    // Load the key from a cookie or generate a new short UUID
    const existingKey = Cookies.get('websocket-key');
    if (existingKey) {
      return existingKey;
    } else {
      const translator = ShortUUID();
      const newKey = translator.new();
      Cookies.set('websocket-key', newKey, { expires: 365 });
      return newKey;
    }
  });

  const overlayUrl = `${OVERLAY_URL}?key=${key}`;

  const handleHandshake = useCallback(() => {
    return {
      matchDetails: matchDetailsRef.current,
      matchData: matchDataRef.current,
      config: configRef.current,
    };
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const openOtherApp = () => {
    navigator.clipboard.writeText(overlayUrl);
    alert("Output URL copied to clipboard");
  };

  return (
    <SocketProvider url={SOCKET_SERVER_URL} socketKey={key} onHandshake={handleHandshake}>
      <ConnectionStatus />
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '400px',
          p:0,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            backgroundColor: '#f9f9f9',
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Header with title and copy button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              pb: 1
            }}
          >
            <Typography variant="h5" sx={{ m: 0 }}>
              Vista Previa
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={openOtherApp}
              startIcon={<ContentCopyIcon />}
              sx={{
                backgroundColor: '#4CAF50',
                color: 'white',
                fontSize: '0.75rem',
                padding: '6px 12px',
                '&:hover': {
                  backgroundColor: '#45a049'
                }
              }}
            >
              Copiar URL
            </Button>
          </Box>

          <Box sx={{ px: 0 }}>
            <ResizablePreview src={overlayUrl} />
          </Box>

          {/* Tabs with background */}
          <Box
            sx={{
              backgroundColor: '#e0e0e0',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  backgroundColor: '#e0e0e0',
                  '&.Mui-selected': {
                    backgroundColor: '#f9f9f9#007bff',
                    color: '#007bff'
                  },
                  '&:hover': {
                    backgroundColor: '#d0d0d0'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#007bff',
                  height: 3
                }
              }} >
                <Tab label="Datos del partido"/>
                <Tab label="Partido"/>
                <Tab label="Controles de vídeo"/>
            </Tabs>
          </Box>
          <Box sx={{ p: 0 }}>
            {activeTab === 0 && <PreMatch setMatchDetails={setMatchDetails} matchDetails={matchDetails} />}
            {activeTab === 1 && <Match matchDetails={matchDetails} matchData={matchData} setMatchData={setMatchData} />}
            {activeTab === 2 && <Controls config={config} setConfig={setConfig} />}
          </Box>
        </Paper>
      </Container>
    </SocketProvider>
  );
}

export default App;