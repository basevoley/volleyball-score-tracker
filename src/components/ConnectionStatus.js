// components/ConnectionStatusCompact.js
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  Snackbar,
  Alert,
  Button,
  CircularProgress,
  Box
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';

export const ConnectionStatus = () => {
  const { connectionStatus, reconnect } = useSocket();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (connectionStatus !== 'connected') {
      setOpen(true);
    } else {
      // Auto-close after 2 seconds when connected
      const timer = setTimeout(() => setOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway' && connectionStatus !== 'connected') {
      return;
    }
    setOpen(false);
  };

  const getSeverity = () => {
    if (connectionStatus === 'connected') return 'success';
    if (connectionStatus === 'reconnecting') return 'warning';
    return 'error';
  };

  const getMessage = () => {
    if (connectionStatus === 'connected') return 'Conectado';
    if (connectionStatus === 'reconnecting') return 'Reconectando...';
    return 'Servicio de mensajería desconectado';
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={connectionStatus === 'connected' ? 2000 : null}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity={getSeverity()}
        variant="filled"
        icon={connectionStatus === 'reconnecting' ? <CircularProgress size={20} color="inherit" /> : undefined}
        action={
          connectionStatus === 'disconnected' ? (
            <Button color="inherit" size="small" onClick={reconnect}>
              <RefreshIcon fontSize="small" />
            </Button>
          ) : undefined
        }
        sx={{ minWidth: '250px' }}
      >
        {getMessage()}
      </Alert>
    </Snackbar>
  );
};
