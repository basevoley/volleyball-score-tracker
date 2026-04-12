import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useConfig } from '../../contexts/ConfigContext';

export const SubscribeSection = () => {
    const { overlaySetup, setOverlaySetup } = useConfig();
    const saved = overlaySetup.subscribe;

    const [logoUrl, setLogoUrl] = useState(saved.logoUrl);
    const [callToActionText, setCallToActionText] = useState(saved.callToActionText);
    const [buttonColor, setButtonColor] = useState(saved.buttonColor);

    useEffect(() => {
        setLogoUrl(saved.logoUrl);
        setCallToActionText(saved.callToActionText);
        setButtonColor(saved.buttonColor);
    }, [saved.logoUrl, saved.callToActionText, saved.buttonColor]);

    const isDirty =
        logoUrl !== saved.logoUrl ||
        callToActionText !== saved.callToActionText ||
        buttonColor !== saved.buttonColor;

    const handleSave = () => {
        setOverlaySetup(prev => ({
            ...prev,
            subscribe: { logoUrl, callToActionText, buttonColor },
        }));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                    size="small"
                    fullWidth
                    label="URL del logo del canal"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                />
                <Box
                    component="img"
                    src={logoUrl}
                    alt="Channel logo preview"
                    sx={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.25 }}
                />
            </Box>

            <TextField
                size="small"
                fullWidth
                label="Texto del botón"
                value={callToActionText}
                onChange={e => setCallToActionText(e.target.value)}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ flex: 1, minWidth: 120 }}>Color del botón</Typography>
                <Box
                    component="input"
                    type="color"
                    value={buttonColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setButtonColor(e.target.value)}
                    sx={{
                        width: 40, height: 36, p: 0.25,
                        border: '1px solid', borderColor: 'divider', borderRadius: 1,
                        cursor: 'pointer', flexShrink: 0,
                    }}
                />
                <TextField
                    size="small"
                    value={buttonColor}
                    onChange={e => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setButtonColor(v);
                    }}
                    sx={{ width: 110 }}
                    slotProps={{ htmlInput: { maxLength: 7 } }}
                />
            </Box>

            <Box sx={{ mt: 0.5 }}>
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
