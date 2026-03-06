import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

function ConfirmationDialog({ open, message, onConfirm, onCancel }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-describedby="confirmation-dialog-description"
    >
      <DialogContent>
        {/* <DialogContentText id="confirmation-dialog-description"> */}
          {message}
        {/* </DialogContentText> */}
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
