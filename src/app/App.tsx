// app.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MatchDetails, MatchData, Config } from '../types';
import { Container, Box, Typography, Paper, Tabs, Tab, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import PreMatch from '../features/pre-match/PreMatch';
import Match from '../features/match/Match';
import Controls from '../features/controls/Controls';
import Settings from '../features/settings/Settings';
import Cookies from 'js-cookie';
import ShortUUID from 'short-uuid';
import { SocketProvider } from '../services/socket/SocketContext';
import { AutomationProvider } from '../contexts/AutomationContext';
import { ConnectionStatus } from '../shared/components/ConnectionStatus';
import OverlayPreview from '../features/controls/OverlayPreview';
import PackageJson from '../../package.json';

const STORAGE_KEY = 'vb_tracker_session';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3005';
const OVERLAY_URL = import.meta.env.VITE_OVERLAY_URL || 'http://localhost:3001';

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
  subscribe: {
    enabled: false,
    position: 'center',
  },
  lineup: {
    enabled: false,
    showStats: true,
  }
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
  players: {
    teamA: [
      // {
      //   number: 0,
      //   name: "",
      //   roles: [""]
      // },
    ],
    teamB: [
      // {
      //   number: 0,
      //   name: "",
      //   roles: [""]
      // },
    ],
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

interface RestoreSessionDialogProps {
  session: { matchData: MatchData; matchDetails: MatchDetails; config: Config };
  onRestore: () => void;
  onDiscard: () => void;
}

function RestoreSessionDialog({ session, onRestore, onDiscard }: RestoreSessionDialogProps) {
  const { matchData, matchDetails } = session;
  const { teams } = matchDetails;
  const { scores, setsWon, winner, matchStarted } = matchData;
  const matchProgress = matchStarted || (matchData.setsWon.teamA > 0 || matchData.setsWon.teamB > 0)

  const statusLabel = winner
    ? 'Partido finalizado'
    : !matchProgress
    ? 'Partido no iniciado'
    : 'Partido en curso';

  return (
    <Dialog open maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>
        Partido en curso detectado
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          La página se recargó con un partido en progreso. ¿Deseas continuar?
        </Typography>
        <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>{teams.teamA}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mx: 1 }}>
              {scores.teamA} – {scores.teamB}
            </Typography>
            <Typography variant="subtitle1" fontWeight={600}>{teams.teamB}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Sets: {setsWon.teamA}</Typography>
            <Typography variant="caption" color="text.secondary" fontStyle="italic">{statusLabel}</Typography>
            <Typography variant="body2" color="text.secondary">Sets: {setsWon.teamB}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2, pt: 0 }}>
        <Button variant="contained" fullWidth onClick={onRestore}>
          Continuar partido
        </Button>
        <Button variant="outlined" fullWidth color="error" onClick={onDiscard}>
          Partido nuevo
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function App() {
  const [matchDetails, setMatchDetails] = useState<MatchDetails>(initialMatchDetails as MatchDetails);
  const [matchData, setMatchData] = useState<MatchData>(initialMatchData as MatchData);
  const [config, setConfig] = useState<Config>(initialConfig as Config);
  const [activeTab, setActiveTab] = useState(0);
  const [noStats, setNoStats] = useState(() => Cookies.get('no-stats') === 'true');
  const [savedSession, setSavedSession] = useState<{ matchData: MatchData; matchDetails: MatchDetails; config: Config } | null>(null);

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

  // Check for a saved session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const md = parsed.matchData;
        const det = parsed.matchDetails;
        const hasMatchProgress = md && (md.matchStarted || md.scores?.teamA > 0 || md.scores?.teamB > 0 || md.setsWon?.teamA > 0 || md.setsWon?.teamB > 0);
        const hasCustomSetup = det && (det.teams?.teamA !== initialMatchDetails.teams.teamA || det.teams?.teamB !== initialMatchDetails.teams.teamB);
        if (hasMatchProgress || hasCustomSetup) {
          setSavedSession(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist everything together whenever any piece changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ matchData, matchDetails, config }));
    } catch { /* storage unavailable or quota exceeded */ }
  }, [matchData, matchDetails, config]);

  useEffect(() => {
    Cookies.set('no-stats', String(noStats), { expires: 365 });
    if (noStats && config.afterMatch.showStats) {
      const updatedConfig = {
        ...config,
        afterMatch: { ...config.afterMatch, showStats: false },
      };
      setConfig(updatedConfig);
    }
  }, [noStats]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleRestoreSession = () => {
    setMatchData(savedSession!.matchData);
    setMatchDetails(savedSession!.matchDetails);
    setConfig(savedSession!.config);
    setSavedSession(null);
    setActiveTab(savedSession!.matchData?.matchStarted ? 1 : 0);
  };

  const handleDiscardSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedSession(null);
  };

  const handleHandshake = useCallback(() => {
    return {
      matchDetails: matchDetailsRef.current,
      matchData: matchDataRef.current,
      config: configRef.current,
    };
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const theme = useTheme();

  // Detecta si la pantalla es de tamaño mediano (md) o superior
  const isUpMd = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <SocketProvider url={SOCKET_SERVER_URL} socketKey={key} onHandshake={handleHandshake}>
      <AutomationProvider config={config} setConfig={setConfig} matchDetails={matchDetails} matchData={matchData}>
      {savedSession && (
        <RestoreSessionDialog
          session={savedSession}
          onRestore={handleRestoreSession}
          onDiscard={handleDiscardSession}
        />
      )}
      <ConnectionStatus />
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '400px',
          p: 0,
          minHeight: '100vh',
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
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}
        >

          <OverlayPreview overlayUrl={overlayUrl} />

          {/* Tabs with background */}
          <Box
            sx={{
              backgroundColor: '#e0e0e0',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isUpMd ? 'standard' : 'fullWidth'}
              centered={isUpMd}
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
              <Tab label="Datos del partido" />
              <Tab label="Partido" />
              <Tab label="Controles de vídeo" />
              <Tab label="Ajustes" />
            </Tabs>
          </Box>
          {activeTab === 0 && <PreMatch setMatchDetails={setMatchDetails} matchDetails={matchDetails} />}
          {activeTab === 1 && <Match matchDetails={matchDetails} matchData={matchData} setMatchData={setMatchData} noStats={noStats} />}
          {activeTab === 2 && <Controls config={config} setConfig={setConfig} matchDetails={matchDetails} matchData={matchData} noStats={noStats} />}
          {activeTab === 3 && <Settings noStats={noStats} setNoStats={setNoStats} />}

          <Box
            component="footer"
            sx={{
              py: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 'auto', // Empuja al fondo si estás en un flex container
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.3,
                border: '1px solid',
                borderColor: 'divider', // Color sutil del tema
                borderRadius: '12px', // Forma redondeada integrada
                color: 'text.secondary', // Color discreto
                backgroundColor: 'rgba(0, 0, 0, 0.02)', // Fondo casi imperceptible
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                },
              }}
            >
              <Box
                component="img"
                src="voleibol.png"
                alt="Volley Tracker Logo"
                sx={{ height: '20px' }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}
              >
                VolleyTracker v{PackageJson.version || '0.0.1B'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
      </AutomationProvider>
    </SocketProvider>
  );
}

export default App;
