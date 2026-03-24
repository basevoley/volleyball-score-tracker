import React, { useState, useEffect } from 'react';
import type { Player, MatchDetails, TeamKey } from '../../types';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TextField, IconButton
} from '@mui/material';
import { AddCircle, DeleteOutline } from '@mui/icons-material';

interface PlayerRowProps {
  player: Player & { id?: number };
  index: number;
  onUpdate: (index: number, field: string, value: string | number) => void;
  onDelete: (index: number) => void;
}

const PlayerRow = ({ player, index, onUpdate, onDelete }: PlayerRowProps) => {
    const [localValue, setLocalValue] = useState<{ name: string; number: number | string }>({ name: player.name, number: player.number });

    useEffect(() => {
        setLocalValue({ name: player.name, number: player.number });
    }, [player.name, player.number]);

    const handleChange = (field: string, value: string | number) => {
        // Validación específica para el número entre 1 y 99
        if (field === 'number') {
            if (value === '') {
                setLocalValue(prev => ({ ...prev, number: '' }));
                return;
            }
            const val = parseInt(String(value), 10);
            if (val >= 1 && val <= 99) {
                setLocalValue(prev => ({ ...prev, number: val }));
            }
            return;
        }
        setLocalValue(prev => ({ ...prev, [field]: value }));
    };

    const handleBlur = (field: 'name' | 'number') => {
        const lv = localValue as Record<string, string | number>;
        const pv = player as unknown as Record<string, string | number>;
        if (lv[field] !== pv[field]) {
            onUpdate(index, field, lv[field]);
        }
    };

    return (
        <TableRow>
            <TableCell sx={{ minWidth: "6ch", maxWidth: "8ch", px: 1 }}>
                <TextField
                    variant="standard"
                    type="number"
                    value={localValue.number}
                    onChange={(e) => handleChange('number', e.target.value)}
                    onBlur={() => handleBlur('number')}
                    helperText={' '}
                    slotProps={{
                        htmlInput: { min: 1, max: 99 },
                        formHelperText: { sx: { fontSize: '0.65rem', m: 0, lineHeight: 1, } },
                    }}
                />
            </TableCell>
            <TableCell sx={{ px: 1 }}>
                <TextField
                    variant="standard"
                    fullWidth
                    value={localValue.name}
                    onChange={(e) => { if (e.target.value.length <= 20) handleChange('name', e.target.value); }}
                    onBlur={() => handleBlur('name')}
                    helperText={localValue.name.length > 12 ? `${localValue.name.length}/20` : ' '}
                    slotProps={{
                        htmlInput: { maxLength: 20 },
                        formHelperText: {
                            sx: {
                                fontSize: '0.65rem',
                                textAlign: 'right',
                                m: 0,
                                lineHeight: 1,
                                color: localValue.name.length === 20 ? 'error.main' : 'text.secondary'
                            }
                        }
                    }}
                />
            </TableCell>
            <TableCell align="right" sx={{ px: 1 }} >
                <IconButton onClick={() => onDelete(index)} color="error" size="small">
                    <DeleteOutline />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};

interface TeamPlayerListProps {
  teamId: TeamKey;
  matchDetails: MatchDetails;
  setMatchDetails: React.Dispatch<React.SetStateAction<MatchDetails>>;
}

const TeamPlayerList = ({ teamId, matchDetails, setMatchDetails }: TeamPlayerListProps) => {
    const players = Array.isArray(matchDetails.players[teamId]) ? matchDetails.players[teamId] : [];
    const [newPlayer, setNewPlayer] = useState({ number: '', name: '', roles: [""] });

    // Límite de jugadores
    const isLimitReached = players.length >= 14;

    const handleUpdatePlayer = (index: number, field: string, value: string | number) => {
        setMatchDetails(prev => {
            const updatedPlayers = [...(prev.players[teamId] || [])];
            updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
            return {
                ...prev,
                players: { ...prev.players, [teamId]: updatedPlayers }
            };
        });
    };

    const handleAdd = () => {
        if (isLimitReached) return;

        if (newPlayer.name && newPlayer.number) {
            setMatchDetails(prev => ({
                ...prev,
                players: {
                    ...prev.players,
                    [teamId]: [...(prev.players[teamId] || []), { ...newPlayer, id: Date.now() }]
                }
            }));
            setNewPlayer({ number: '', name: '', roles: [""] });
        }
    };

    const handleDelete = (index: number) => {
        setMatchDetails(prev => {
            const updatedPlayers = prev.players[teamId].filter((_, i) => i !== index);
            return {
                ...prev,
                players: { ...prev.players, [teamId]: updatedPlayers }
            };
        });
    };

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, opacity: isLimitReached ? 0.9 : 1 }}>
            <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                        <TableCell><strong>#</strong></TableCell>
                        <TableCell><strong>Nombre ({players.length}/14)</strong></TableCell>
                        <TableCell align="right"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {players.map((player, index) => (
                        <PlayerRow
                            key={player.id || index}
                            player={player}
                            index={index}
                            onUpdate={handleUpdatePlayer}
                            onDelete={handleDelete}
                        />
                    ))}

                    {/* Fila para añadir nuevo, se deshabilita visualmente al llegar a 14 */}
                    {!isLimitReached && (
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ px: 1 }}>
                                <TextField
                                    label="Numero"
                                    placeholder="#"
                                    type="number"
                                    // variant="standard"
                                    size='small'
                                    value={newPlayer.number}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 99)) {
                                            setNewPlayer({ ...newPlayer, number: val });
                                        }
                                    }}
                                    helperText={' '}
                                    slotProps={{
                                        htmlInput: { maxLength: 3, min: 1, max: 99 },
                                        formHelperText: {
                                            sx: {
                                                fontSize: '0.65rem',
                                                textAlign: 'right',
                                                m: 0,
                                                lineHeight: 1,
                                            }
                                        }
                                    }} />
                            </TableCell>
                            <TableCell sx={{ px: 1 }}>
                                <TextField
                                    label="Nombre"
                                    placeholder="Nuevo jugador..."
                                    // variant="standard"
                                    size='small'
                                    fullWidth
                                    value={newPlayer.name}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 20) setNewPlayer({ ...newPlayer, name: e.target.value });
                                    }}
                                    helperText={`${newPlayer.name.length}/20`}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                                    slotProps={{
                                        htmlInput: { maxLength: 20 },
                                        formHelperText: {
                                            sx: {
                                                fontSize: '0.65rem',
                                                textAlign: 'right',
                                                m: 0,
                                                lineHeight: 1
                                            }
                                        }
                                    }}

                                />
                            </TableCell>
                            <TableCell align="right" sx={{ px: 1 }}>
                                <IconButton
                                    onClick={handleAdd}
                                    color="primary"
                                    disabled={!newPlayer.name || !newPlayer.number}
                                >
                                    <AddCircle />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TeamPlayerList;
