import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useConfig } from '../../contexts/ConfigContext';
import type { SocialChannel } from '../../types';
import { moveUp, moveDown } from './SettingRow';

export const SocialNetworksSection = () => {
    const { overlaySetup, setOverlaySetup } = useConfig();
    const [draft, setDraft] = useState<SocialChannel[]>(overlaySetup.socialMedia.channels);

    useEffect(() => {
        setDraft(overlaySetup.socialMedia.channels);
    }, [overlaySetup.socialMedia.channels]);

    const isDirty = JSON.stringify(draft) !== JSON.stringify(overlaySetup.socialMedia.channels);

    const updateField = (index: number, field: keyof SocialChannel, value: string) => {
        setDraft(prev => prev.map((ch, i) => i === index ? { ...ch, [field]: value } : ch));
    };

    const handleSave = () => {
        setOverlaySetup(prev => ({ ...prev, socialMedia: { channels: draft } }));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {draft.map((channel, index) => (
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
                        <IconButton size="small" onClick={() => setDraft(prev => moveUp(prev, index))} disabled={index === 0}>
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDraft(prev => moveDown(prev, index))} disabled={index === draft.length - 1}>
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ flex: 1, p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Red social"
                            value={channel.network}
                            onChange={e => updateField(index, 'network', e.target.value)}
                        />
                        <TextField
                            size="small"
                            fullWidth
                            label="Handle"
                            value={channel.handle}
                            onChange={e => updateField(index, 'handle', e.target.value)}
                        />
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="URL del icono"
                                value={channel.icon}
                                onChange={e => updateField(index, 'icon', e.target.value)}
                            />
                            <Box
                                component="img"
                                src={channel.icon}
                                alt={channel.network}
                                sx={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.25 }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 0.5,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                    }}>
                        <IconButton size="small" color="error" onClick={() => setDraft(prev => prev.filter((_, i) => i !== index))}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setDraft(prev => [...prev, { network: '', handle: '', icon: '' }])}
                >
                    Añadir red social
                </Button>
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
