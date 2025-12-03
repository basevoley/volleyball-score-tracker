// app.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PreMatch from './components/PreMatch';
import Match from './components/Match';
import Controls from './components/Controls';
import ResizablePreview from './components/ResizablePreview';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import ShortUUID from 'short-uuid';

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
  },
  matchup: {
    enabled: false,
  },
  lowerThird: {
    enabled: false,
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
],displayTime: 5000,
  },};

const initialMatchDetails = {
    teams: { teamA: 'Equipo Local Demo', teamB: 'Equipo Visitante Demo' },
    teamLogos: {
      teamA: 'logo192.png',
      teamB: 'logo.svg'
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
    statistics: {
      teamA: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
      teamB: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
    },
    currentSetStats: {
      teamA: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
      teamB: { serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0, attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0, selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%', attackEffectiveness: '0%', defenseEffectiveness: '0%' },
    },
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
  const [socket, setSocket] = useState(null);

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

  useEffect(() => {
    // Connect to the Socket.io server using the key
    const socketInstance = io(SOCKET_SERVER_URL, {
      query: { key },
    });

    socketInstance.on('connect', () => {
      console.log(`Socket.io connection established - client id: ${socketInstance.id}`);
    });

    socketInstance.on('message', (data) => {
      console.log('Message received:', data);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.io connection closed');
    });

    socketInstance.on('error', (error) => {
      console.error('Socket.io error:', error);
    });

    setSocket(socketInstance);

    // Cleanup function to disconnect the socket when the component unmounts
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [key]);

  const openOtherApp = () => {
    // window.open(overlayUrl, '_blank');
    navigator.clipboard.writeText(overlayUrl);

  // Alert the copied text
  alert("Output URL copied to clipboard");
  };

  return (
    <AppContainer>
      <h2 style={{ margin: "0px"}}>Vista Previa</h2>
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

      {activeTab === 'prematch' && <PreMatch setMatchDetails={setMatchDetails} matchDetails={matchDetails} socket={socket} />}
      {activeTab === 'match' && <Match matchDetails={matchDetails} matchData={matchData} setMatchData={setMatchData} socket={socket} />}
      {activeTab === 'controls' && <Controls socket={socket} config={config} setConfig={setConfig} />}
    </AppContainer>
  );
}

export default App;
