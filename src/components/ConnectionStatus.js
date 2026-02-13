import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  Alert,
  Button,
  CircularProgress,
  Box,
  Collapse,
  IconButton,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

export const ConnectionStatus = () => {
  const { connectionStatus, reconnect } = useSocket();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (connectionStatus !== 'connected') {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);

  return (
    <Collapse in={visible}         sx={{
          position: 'sticky', 
      top: 0,
      zIndex: (theme) => theme.zIndex.appBar + 1,
      pointerEvents: 'none' 
      }}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          py: { xs: 0, md: 1 },
        }}
      >
        <Alert
          severity={connectionStatus === 'connected' ? 'success' : connectionStatus === 'reconnecting' ? 'warning' : 'error'}
          variant="filled"
          icon={connectionStatus === 'reconnecting' ? <CircularProgress size={18} color="inherit" /> : undefined}
          action={
            connectionStatus === 'disconnected' ? (
              <>
                <Button color="inherit" size="small" onClick={reconnect} startIcon={<RefreshIcon />} sx={{ display: { xs: 'none', md: 'flex' } }}>
                  Reintentar
                </Button>
                <IconButton color="inherit" size="small" onClick={reconnect} sx={{ display: { xs: 'flex', md: 'none' } }}><RefreshIcon /></IconButton>
              </>
            ) : undefined
          }
          sx={{
            pointerEvents: 'auto', 
            width: { xs: '100%', md: 'auto' },
            minWidth: { md: '500px' },
            borderRadius: {
              xs: 0,   
              md: '8px'
            },
            boxShadow: { xs: 0, md: 2 },
            '& .MuiAlert-message': {
              textAlign: 'center',
              width: '100%',
            }
          }}
        >
          {connectionStatus === 'connected' ? 'Conexión restablecida' :
            connectionStatus === 'reconnecting' ? 'Reconectando...' :
              'Sin conexión con el servidor'}
        </Alert>
      </Box>
    </Collapse>
  );
};
