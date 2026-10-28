import { useState } from 'react';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { v4 as uuid } from 'uuid';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useMatchContext } from '../../contexts/MatchContext';
import { TEXT_EFFECTS } from '../../domain/effects/constants';
import { defaultEffectPreferences } from '../../domain/effects/preferences';
import ConfirmationDialog from '../../shared/components/ConfirmationDialog';
import { SettingRow, moveDown, moveUp } from './SettingRow';
import type { CelebrationTextEntry, EffectMode, EffectTarget, TextEffectChoice } from '../../types';

const MODE_OPTIONS: { value: EffectMode; label: string }[] = [
    { value: 'off', label: 'Desactivado' },
    { value: 'every-point', label: 'Todos los puntos' },
    { value: 'manual', label: 'Manual (se elige en cada punto)' },
];

const nativeSelect = { select: { native: true } } as const;

export const EffectsSection = () => {
    const { effectPreferences: prefs, setEffectPreferences } = usePreferences();
    const { matchDetails } = useMatchContext();
    const [confirmResetOpen, setConfirmResetOpen] = useState(false);

    const setTexts = (texts: CelebrationTextEntry[]) => setEffectPreferences({ ...prefs, texts });
    // Texts only: the target, modes and team-name switch are left as they are
    const defaultTexts = defaultEffectPreferences().texts;
    const isUsingDefaultTexts = JSON.stringify(prefs.texts) === JSON.stringify(defaultTexts);
    const resetTexts = () => {
        setTexts(defaultTexts);
        setConfirmResetOpen(false);
    };
    const updateText = (id: string, patch: Partial<CelebrationTextEntry>) =>
        setTexts(prefs.texts.map(t => (t.id === id ? { ...t, ...patch } : t)));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                select
                size="small"
                fullWidth
                label="Puntos que se celebran"
                value={prefs.target}
                onChange={e => setEffectPreferences({ ...prefs, target: e.target.value as EffectTarget })}
                helperText="Se restablece a «Ninguno» en cada partido nuevo para no celebrar por error los puntos de otro equipo."
                slotProps={nativeSelect}
            >
                <option value="none">Ninguno (desactivado)</option>
                <option value="teamA">{matchDetails.teams.teamA}</option>
                <option value="teamB">{matchDetails.teams.teamB}</option>
                <option value="both">Ambos equipos</option>
            </TextField>

            <TextField
                select
                size="small"
                fullWidth
                label="Afición"
                value={prefs.crowd.mode}
                onChange={e => setEffectPreferences({ ...prefs, crowd: { mode: e.target.value as EffectMode } })}
                helperText="Todos los puntos: la afición se muestra siempre, aunque se cierre el diálogo."
                slotProps={nativeSelect}
            >
                {MODE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </TextField>

            <TextField
                select
                size="small"
                fullWidth
                label="Texto animado"
                value={prefs.text.mode}
                onChange={e => setEffectPreferences({ ...prefs, text: { mode: e.target.value as EffectMode } })}
                helperText="Todos los puntos: se usa siempre el primer texto de la lista."
                slotProps={nativeSelect}
            >
                {MODE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </TextField>

            <SettingRow
                title="Añadir el nombre del equipo al texto"
                checked={prefs.appendTeamName}
                onChange={appendTeamName => setEffectPreferences({ ...prefs, appendTeamName })}
            />

            <Typography variant="subtitle2">Textos</Typography>
            {prefs.texts.map((entry, index) => (
                // Same card layout as the sponsors list: reorder column, fields, delete column
                <Box
                    key={entry.id}
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
                        <IconButton size="small" aria-label="Subir texto" disabled={index === 0} onClick={() => setTexts(moveUp(prefs.texts, index))}>
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" aria-label="Bajar texto" disabled={index === prefs.texts.length - 1} onClick={() => setTexts(moveDown(prefs.texts, index))}>
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ flex: 1, p: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            label="Texto"
                            value={entry.text}
                            onChange={e => updateText(entry.id, { text: e.target.value })}
                            sx={{ flex: '1 1 180px' }}
                        />
                        <TextField
                            select
                            size="small"
                            label="Efecto"
                            value={entry.effect}
                            onChange={e => updateText(entry.id, { effect: e.target.value as TextEffectChoice })}
                            slotProps={nativeSelect}
                            sx={{ flex: '0 1 190px' }}
                        >
                            <option value="random">Efecto aleatorio</option>
                            {TEXT_EFFECTS.map(effect => <option key={effect.id} value={effect.id}>{effect.label}</option>)}
                        </TextField>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 0.5,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                    }}>
                        <IconButton size="small" color="error" aria-label="Eliminar texto" onClick={() => setTexts(prefs.texts.filter(t => t.id !== entry.id))}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setTexts([...prefs.texts, { id: uuid(), text: '', effect: 'random' }])}
                >
                    Añadir texto
                </Button>
                <Button size="small" variant="outlined" disabled={isUsingDefaultTexts} onClick={() => setConfirmResetOpen(true)}>
                    Restablecer
                </Button>
            </Box>

            <ConfirmationDialog
                open={confirmResetOpen}
                message={<Typography align="center">¿Restablecer los textos a los valores por defecto?<br />Se perderán los textos actuales.</Typography>}
                onConfirm={resetTexts}
                onCancel={() => setConfirmResetOpen(false)}
            />
        </Box>
    );
};
