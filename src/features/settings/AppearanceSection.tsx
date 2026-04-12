import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Select, MenuItem, Divider } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useConfig } from '../../contexts/ConfigContext';
import type { ThemeColors } from '../../types';

const DEFAULT_COLORS: Required<ThemeColors> = {
    background: '#34495e',
    text:       '#ecf0f1',
    secondary:  '#bdc3c7',
    primary:    '#3498db',
    accent:     '#f1c40f',
    serving:    '#2ecc71',
};

const COLOR_LABELS: Record<keyof Required<ThemeColors>, string> = {
    background: 'Fondo de paneles',
    text:       'Texto principal',
    secondary:  'Texto secundario',
    primary:    'Acento principal',
    accent:     'Realce (nombres, sets)',
    serving:    'Indicador de saque',
};

const DEFAULT_FONT = 'Arial, sans-serif';

const AVAILABLE_FONTS: { label: string; value: string }[] = [
    { label: 'Arial',           value: 'Arial, sans-serif' },
    { label: 'Helvetica',       value: 'Helvetica, sans-serif' },
    { label: 'Verdana',         value: 'Verdana, sans-serif' },
    { label: 'Trebuchet MS',    value: "'Trebuchet MS', sans-serif" },
    { label: 'Impact',          value: 'Impact, sans-serif' },
    { label: 'Georgia',         value: 'Georgia, serif' },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Courier New',     value: "'Courier New', monospace" },
];

function resolvedColors(theme: { colors?: ThemeColors }): Required<ThemeColors> {
    const c = theme.colors ?? {};
    return {
        background: c.background ?? DEFAULT_COLORS.background,
        text:       c.text       ?? DEFAULT_COLORS.text,
        secondary:  c.secondary  ?? DEFAULT_COLORS.secondary,
        primary:    c.primary    ?? DEFAULT_COLORS.primary,
        accent:     c.accent     ?? DEFAULT_COLORS.accent,
        serving:    c.serving    ?? DEFAULT_COLORS.serving,
    };
}

export const AppearanceSection = () => {
    const { overlaySetup, setOverlaySetup } = useConfig();

    const [draft, setDraft] = useState<Required<ThemeColors>>(() => resolvedColors(overlaySetup.theme));
    const [draftFont, setDraftFont] = useState(overlaySetup.theme.font ?? DEFAULT_FONT);

    useEffect(() => {
        setDraft(resolvedColors(overlaySetup.theme));
        setDraftFont(overlaySetup.theme.font ?? DEFAULT_FONT);
    }, [overlaySetup.theme]);

    const saved = resolvedColors(overlaySetup.theme);
    const savedFont = overlaySetup.theme.font ?? DEFAULT_FONT;
    const isDirty = JSON.stringify(draft) !== JSON.stringify(saved) || draftFont !== savedFont;

    const handleSave = () => {
        setOverlaySetup(prev => ({
            ...prev,
            theme: { ...prev.theme, colors: draft, font: draftFont },
        }));
    };

    const handleReset = () => {
        setDraft({ ...DEFAULT_COLORS });
        setDraftFont(DEFAULT_FONT);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {(Object.keys(DEFAULT_COLORS) as (keyof Required<ThemeColors>)[]).map(key => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 160 }}>
                        {COLOR_LABELS[key]}
                    </Typography>
                    <Box
                        component="input"
                        type="color"
                        value={draft[key]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDraft(prev => ({ ...prev, [key]: e.target.value }))
                        }
                        sx={{
                            width: 40, height: 36, p: 0.25,
                            border: '1px solid', borderColor: 'divider', borderRadius: 1,
                            cursor: 'pointer', flexShrink: 0,
                        }}
                    />
                    <TextField
                        size="small"
                        value={draft[key]}
                        onChange={e => {
                            const v = e.target.value;
                            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                                setDraft(prev => ({ ...prev, [key]: v }));
                            }
                        }}
                        sx={{ width: 110 }}
                        slotProps={{ htmlInput: { maxLength: 7 } }}
                    />
                </Box>
            ))}

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ flex: 1, minWidth: 160 }}>Tipografía</Typography>
                <Select
                    size="small"
                    value={draftFont}
                    onChange={e => setDraftFont(e.target.value)}
                    sx={{ flex: 1 }}
                >
                    {AVAILABLE_FONTS.map(f => (
                        <MenuItem key={f.value} value={f.value} sx={{ fontFamily: f.value }}>
                            {f.label}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
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
                <Button size="small" variant="outlined" onClick={handleReset}>
                    Restablecer
                </Button>
            </Box>
        </Box>
    );
};
