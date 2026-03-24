import React from 'react';
import type { TeamKey, TeamRecord, MatchData } from '../../types';
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamLogos: TeamRecord<string>;
  teamColors: TeamRecord<string>;
  teams: TeamRecord<string>;
  match: Pick<MatchData, 'winner' | 'setsWon'>;
}

function WinnerDialog({isOpen, onClose, teamLogos, teamColors, teams, match}: Props) {

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
                        src={match.winner ? teamLogos[match.winner] : undefined}
                        sx={{
                            width: 130,
                            height: 130,
                            mx: 'auto',
                            border: `2px solid ${match.winner ? teamColors[match.winner] : 'transparent'}`,
                            boxShadow: `0 0 25px 5px ${match.winner ? teamColors[match.winner] : 'transparent'}80`,
                            backgroundColor: 'white',
                        }}
                    />
                    <Typography variant="h5">
                        {match.winner ? teams[match.winner] : ''} ha ganado el partido
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