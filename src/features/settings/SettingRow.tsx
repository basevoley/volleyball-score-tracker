import React, { useState } from 'react';
import { Box, Typography, Switch, FormControlLabel, Divider, Tooltip, IconButton, ClickAwayListener } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface SettingRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SettingRow = ({ title, description, checked, onChange }: SettingRowProps) => {
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

export function moveUp<T>(arr: T[], index: number): T[] {
    if (index === 0) return arr;
    const next = [...arr];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    return next;
}

export function moveDown<T>(arr: T[], index: number): T[] {
    if (index === arr.length - 1) return arr;
    const next = [...arr];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    return next;
}
