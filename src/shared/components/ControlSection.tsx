import React from 'react';
import { Box, Divider, FormControlLabel, Switch, Typography } from '@mui/material';

interface ControlSectionProps {
    title: string;
    disabled?: boolean;
    checked: boolean;
    checkedLabel?: string;
    unCheckedLabel?: string;
    onToggle: () => void;
    children?: React.ReactNode;
}

const ControlSection = ({
    title,
    disabled = false,
    checked,
    checkedLabel = 'Mostrar',
    unCheckedLabel = 'Ocultar',
    onToggle,
    children,
}: ControlSectionProps) => (
    <Box sx={{ paddingY: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2">
                {title}
            </Typography>
            <FormControlLabel
                control={
                    <Switch
                        checked={checked}
                        disabled={disabled}
                        onChange={onToggle}
                    />
                }
                label={<Typography variant="caption">{checked ? checkedLabel : unCheckedLabel}</Typography>}
            />
        </Box>
        {children}
        <Divider sx={{ mt: 1 }} />
    </Box>
);

export default ControlSection;
