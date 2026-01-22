import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Modal = ({ children, onClose }) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 1
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
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
          Cerrar
        </Button>
      </Box>

      <DialogContent sx={{ pt: 5 }}>
        {children}
      </DialogContent>

      {/* <DialogActions sx={{ padding: 2 }}>
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
          Cerrar
        </Button>
      </DialogActions> */}
    </Dialog>
  );
};

export default Modal;
