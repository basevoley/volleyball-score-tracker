import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

interface Props {
  open: boolean;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({ open, message, onConfirm, onCancel }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-describedby="confirmation-dialog-description"
    >
      <DialogContent>
          {message}
      </DialogContent>
      <DialogActions sx={{justifyContent: 'center'}}>
        <Button 
          onClick={onCancel} 
          variant="outlined"
        >
          No
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          autoFocus
        >
          Si
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmationDialog;
