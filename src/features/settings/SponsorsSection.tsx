import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useConfig } from '../../contexts/ConfigContext';
import { moveUp, moveDown } from './SettingRow';

export const SponsorsSection = () => {
    const { overlaySetup, setOverlaySetup } = useConfig();
    const [draftUrls, setDraftUrls] = useState<string[]>(overlaySetup.sponsors.imageUrls);
    const [draftDisplayTime, setDraftDisplayTime] = useState(overlaySetup.sponsors.displayTime);

    useEffect(() => {
        setDraftUrls(overlaySetup.sponsors.imageUrls);
        setDraftDisplayTime(overlaySetup.sponsors.displayTime);
    }, [overlaySetup.sponsors.imageUrls, overlaySetup.sponsors.displayTime]);

    const isDirty =
        JSON.stringify(draftUrls) !== JSON.stringify(overlaySetup.sponsors.imageUrls) ||
        draftDisplayTime !== overlaySetup.sponsors.displayTime;

    const handleSave = () => {
        setOverlaySetup(prev => ({
            ...prev,
            sponsors: { imageUrls: draftUrls, displayTime: draftDisplayTime },
        }));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {draftUrls.map((url, index) => (
                <Box
                    key={index}
                    sx={{
                        display: 'flex',
                        alignItems: 'stretch',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        px: 0.5,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                    }}>
                        <IconButton size="small" onClick={() => setDraftUrls(prev => moveUp(prev, index))} disabled={index === 0}>
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDraftUrls(prev => moveDown(prev, index))} disabled={index === draftUrls.length - 1}>
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ flex: 1, p: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            size="small"
                            fullWidth
                            label={`Patrocinador ${index + 1}`}
                            value={url}
                            onChange={e => setDraftUrls(prev => prev.map((u, i) => i === index ? e.target.value : u))}
                        />
                        <Box
                            component="img"
                            src={url}
                            alt={`Sponsor ${index + 1}`}
                            sx={{ width: 60, height: 36, objectFit: 'contain', flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.25 }}
                        />
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 0.5,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                    }}>
                        <IconButton size="small" color="error" onClick={() => setDraftUrls(prev => prev.filter((_, i) => i !== index))}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setDraftUrls(prev => [...prev, ''])}
                >
                    Añadir patrocinador
                </Button>
                <TextField
                    size="small"
                    label="Tiempo de rotación (ms)"
                    type="number"
                    value={draftDisplayTime}
                    onChange={e => setDraftDisplayTime(Math.max(500, Number(e.target.value)))}
                    sx={{ width: 190 }}
                    slotProps={{ htmlInput: { min: 500, step: 500 } }}
                />
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={handleSave}
                    disabled={!isDirty}
                    sx={{ color: 'white' }}
                >
                    Guardar
                </Button>
            </Box>
        </Box>
    );
};
