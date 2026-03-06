import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Avatar,
    Box, 
    Button 
} from '@mui/material';

import TrophyIcon from '@mui/icons-material/EmojiEvents';

function WinnerDialog({isOpen, onClose, teamLogos, teamColors, teams, match}) {

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            slotProps={{ paper: { sx: { borderRadius: 3, textAlign: 'center', p: 2 } } }}
        >
            <DialogTitle display='flex' flexDirection={'row'} justifyContent={'space-evenly'}>
                <TrophyIcon sx={{ fontSize: 60, color: '#FFD700' }} />
                <Typography variant="h4" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
                    ¡Final!
                </Typography>
                <TrophyIcon sx={{ fontSize: 60, color: '#FFD700' }} />
            </DialogTitle>
            <DialogContent sx={{ overflow: 'visible' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src={teamLogos[match.winner]}
                        sx={{
                            width: 130,
                            height: 130,
                            mx: 'auto',
                            border: `2px solid ${teamColors[match.winner]}`,
                            boxShadow: `0 0 25px 5px ${teamColors[match.winner]}80`, // El "80" al final añade 50% de opacidad hex
                            backgroundColor: 'white',
                        }}
                    />
                    <Typography variant="h5">
                        {teams[match.winner]} ha ganado el partido
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Marcador final: {match.setsWon.teamA} - {match.setsWon.teamB}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    color="primary"
                >
                    Aceptar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default WinnerDialog;