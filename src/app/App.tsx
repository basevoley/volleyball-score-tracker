// app.js
import React, { useCallback, useRef, useState } from 'react';
import { Container, Box, Typography, Paper, Tabs, Tab, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import PreMatch from '../features/pre-match/PreMatch';
import Match from '../features/match/Match';
import Controls from '../features/controls/Controls';
import Settings from '../features/settings/Settings';
import Cookies from 'js-cookie';
import ShortUUID from 'short-uuid';
import { SocketProvider } from '../services/socket/SocketContext';
import { ConnectionStatus } from '../shared/components/ConnectionStatus';
import OverlayPreview from '../features/controls/OverlayPreview';
import PackageJson from '../../package.json';
import { AppProviders } from './providers';
import { useMatchContext } from '../contexts/MatchContext';
import { useConfig } from '../contexts/ConfigContext';
import { useSession } from '../services/session/useSession';
import { useBroadcast } from '../services/socket/useBroadcast';
import type { MatchData, MatchDetails, Config } from '../types';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3005';
const OVERLAY_URL = import.meta.env.VITE_OVERLAY_URL || 'http://localhost:3001';

interface RestoreSessionDialogProps {
  session: { matchData: MatchData; matchDetails: MatchDetails; config: Config };
  onRestore: () => void;
  onDiscard: () => void;
}

function RestoreSessionDialog({ session, onRestore, onDiscard }: RestoreSessionDialogProps) {
  const { matchData, matchDetails } = session;
  const { teams } = matchDetails;
  const { scores, setsWon, winner, matchPhase } = matchData;
  const matchProgress = matchPhase !== 'pre-match' || (matchData.setsWon.teamA > 0 || matchData.setsWon.teamB > 0);

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

// Inner shell — rendered inside all providers, has access to contexts
function AppContent({ overlayUrl }: { overlayUrl: string }) {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isUpMd = useMediaQuery(theme.breakpoints.up('md'));

  const { matchManager, matchDetails, restoreSession } = useMatchContext();
  const { config, setConfig } = useConfig();
  const { syncAll } = useBroadcast();

  const { savedSession, clearSavedSession, discardSession } = useSession(
    matchManager.match, matchDetails, config
  );

  const handleRestoreSession = () => {
    restoreSession({ matchData: savedSession!.matchData, matchDetails: savedSession!.matchDetails });
    setConfig(savedSession!.config);
    clearSavedSession();
    setActiveTab(savedSession!.matchData?.matchPhase === 'in-progress' ? 1 : 0);
    syncAll();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <>
      {savedSession && (
        <RestoreSessionDialog
          session={savedSession}
          onRestore={handleRestoreSession}
          onDiscard={discardSession}
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

          <Box sx={{ backgroundColor: '#e0e0e0' }}>
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
              }}
            >
              <Tab label="Datos del partido" />
              <Tab label="Partido" />
              <Tab label="Controles de vídeo" />
              <Tab label="Ajustes" />
            </Tabs>
          </Box>

          {activeTab === 0 && <PreMatch />}
          {activeTab === 1 && <Match />}
          {activeTab === 2 && <Controls />}
          {activeTab === 3 && <Settings />}

          <Box
            component="footer"
            sx={{
              py: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 'auto',
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
                borderColor: 'divider',
                borderRadius: '12px',
                color: 'text.secondary',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
    </>
  );
}

// Outer wrapper — computes socket key, sets up SocketProvider + all app providers
function App() {
  const [socketKey] = useState(() => {
    const existing = Cookies.get('websocket-key');
    if (existing) return existing;
    const translator = ShortUUID();
    const newKey = translator.new();
    Cookies.set('websocket-key', newKey, { expires: 365 });
    return newKey;
  });

  const overlayUrl = `${OVERLAY_URL}?key=${socketKey}`;

  // Stable ref-based handshake callback — inner contexts update the ref each render
  const handshakeDataRef = useRef<Record<string, unknown>>({});
  const onHandshake = useCallback(() => handshakeDataRef.current, []);

  return (
    <SocketProvider url={SOCKET_SERVER_URL} socketKey={socketKey} onHandshake={onHandshake}>
      <AppProviders>
        <HandshakeSync dataRef={handshakeDataRef} />
        <AppContent overlayUrl={overlayUrl} />
      </AppProviders>
    </SocketProvider>
  );
}

// Updates the handshake data ref with current context values each render
function HandshakeSync({ dataRef }: { dataRef: React.MutableRefObject<Record<string, unknown>> }) {
  const { matchManager, matchDetails } = useMatchContext();
  const { config } = useConfig();
  dataRef.current = { matchDetails, matchData: matchManager.match, config };
  return null;
}

export default App;
