import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  DialogTitle
} from '@mui/material';

const Modal = ({ children, onClose }) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            padding: 1
          }
        }
      }}
    >
      <DialogTitle>Selector de Partidos</DialogTitle>

      <DialogContent sx={{ pt: 5 }}>
        {children}
      </DialogContent>

      <DialogActions sx={{ padding: 0 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: '#ff5733',
            color: 'white',
            '&:hover': {
              backgroundColor: '#e04e2d'
            }
          }}
        >
          Descartar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
