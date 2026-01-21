// app.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import PreMatch from './components/PreMatch';
import Match from './components/Match';
import Controls from './components/Controls';
import ResizablePreview from './components/ResizablePreview';
import Cookies from 'js-cookie';
import ShortUUID from 'short-uuid';
import { SocketProvider } from './contexts/SocketContext';

// --- Styled Components ---

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  min-width: 400px;
  margin: auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  margin: 0 5px;
  background-color: ${({ $active }) => ($active ? '#007bff' : '#ccc')};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: ${({ $active }) => ($active ? '#0056b3' : '#bbb')};
  }
`;

const OpenLinkButton = styled.button`
  margin: 0 5px;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #45a049;
  }
`;

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
      // Añade más URLs según sea necesario
    ], displayTime: 5000,
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
  setScores: [],//{ teamA: 25, teamB: 0 },{ teamA: 25, teamB: 0 },],
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
  const [activeTab, setActiveTab] = useState('prematch');

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
      Cookies.set('websocket-key', newKey, { expires: 365 }); // Store the key in a cookie for 1 year
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
  }, []); // No dependencies needed - uses refs


  const openOtherApp = () => {
    // window.open(overlayUrl, '_blank');
    navigator.clipboard.writeText(overlayUrl);

    // Alert the copied text
    alert("Output URL copied to clipboard");
  };

  return (
    <SocketProvider url={SOCKET_SERVER_URL} socketKey={key} onHandshake={handleHandshake}>
      <AppContainer>
        <h2 style={{ margin: "0px" }}>Vista Previa</h2>
        <ResizablePreview src={overlayUrl} />
        <TabContainer>
          <TabButton $active={activeTab === 'prematch'} onClick={() => setActiveTab('prematch')}>
            Datos del partido
          </TabButton>
          <TabButton $active={activeTab === 'match'} onClick={() => setActiveTab('match')}>
            Partido
          </TabButton>
          <TabButton $active={activeTab === 'controls'} onClick={() => setActiveTab('controls')}>
            Controles de vídeo
          </TabButton>
          <OpenLinkButton onClick={openOtherApp}>
            Copiar URL de overlay
          </OpenLinkButton>
        </TabContainer>

        {activeTab === 'prematch' && <PreMatch setMatchDetails={setMatchDetails} matchDetails={matchDetails} />}
        {activeTab === 'match' && <Match matchDetails={matchDetails} matchData={matchData} setMatchData={setMatchData} />}
        {activeTab === 'controls' && <Controls config={config} setConfig={setConfig} />}
      </AppContainer>
    </SocketProvider>
  );
}

export default App;
