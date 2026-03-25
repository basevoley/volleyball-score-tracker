import React, { useState } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    Divider,
    Tooltip,
    IconButton,
    ClickAwayListener,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface SettingRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SettingRow = ({ title, description, checked, onChange }: SettingRowProps) => {
    const [descOpen, setDescOpen] = useState(false);

    return (
        <Box sx={{ paddingY: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">{title}</Typography>
                    {description && (
                        <ClickAwayListener onClickAway={() => setDescOpen(false)}>
                            <Tooltip
                                title={description}
                                arrow
                                placement="bottom-start"
                                open={descOpen}
                                disableFocusListener
                                disableHoverListener
                                disableTouchListener
                                slotProps={{
                                    popper: {
                                        modifiers: [
                                            { name: 'preventOverflow', options: { boundary: 'window', padding: 8 } },
                                            { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom', 'top'] } },
                                        ],
                                    },
                                    tooltip: { sx: { maxWidth: 220 } },
                                }}
                            >
                                <IconButton size="small" onClick={() => setDescOpen(v => !v)} sx={{ p: 0.25 }}>
                                    <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                </IconButton>
                            </Tooltip>
                        </ClickAwayListener>
                    )}
                </Box>
                <FormControlLabel
                    control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
                    label={<Typography variant="caption">{checked ? 'Activado' : 'Desactivado'}</Typography>}
                />
            </Box>
            <Divider sx={{ mt: 1.5 }} />
        </Box>
    );
};

const Settings = () => {
  const { noStats, setNoStats } = usePreferences();
    return (
        <Box sx={{ width: '100%', p: { xs: 1, sm: 2 }, boxSizing: 'border-box' }}>
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    maxWidth: '800px',
                    margin: '0 auto',
                    p: { xs: 2, sm: 4 },
                    boxSizing: 'border-box',
                    borderRadius: 2,
                }}
            >
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Seguimiento del Partido
                </Typography>

                <SettingRow
                    title="Modo sin estadísticas"
                    description="Oculta los controles de rally durante el partido y deshabilita la tabla de estadísticas en el panel de resultados del overlay."
                    checked={noStats}
                    onChange={setNoStats}
                />
            </Paper>
        </Box>
    );
};

export default Settings;
