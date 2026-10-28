import { useEffect, useEffectEvent } from 'react';
import { Box, CircularProgress, IconButton } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

// MUI's determinate circle draws with a 126.92px dash (r = 20.2, viewBox 44)
const CIRCUMFERENCE = 126.92;
const drain = keyframes`
  from { stroke-dashoffset: 0px; }
  to { stroke-dashoffset: ${CIRCUMFERENCE}px; }
`;

interface Props {
    durationMs: number;
    onClose: () => void;
    label?: string;
}

// Close button ringed by a progress circle that empties over `durationMs`, then closes by itself.
// The ring is a CSS animation (no per-frame React state); remount with a new `key` to restart it.
export const CountdownCloseButton = ({ durationMs, onClose, label = 'Cerrar' }: Props) => {
    // Always calls the latest onClose without restarting the timer when the parent re-renders
    const close = useEffectEvent(onClose);

    useEffect(() => {
        const timer = setTimeout(close, durationMs);
        return () => clearTimeout(timer);
    }, [durationMs]);

    return (
        <Box sx={{ position: 'relative', width: 40, height: 40, display: 'inline-flex' }}>
            <CircularProgress
                variant="determinate"
                value={100}
                size={40}
                thickness={3}
                data-testid="countdown-ring"
                sx={{
                    position: 'absolute',
                    inset: 0,
                    '& .MuiCircularProgress-circle': {
                        animation: `${drain} ${durationMs}ms linear forwards`,
                    },
                }}
            />
            <IconButton aria-label={label} onClick={onClose} size="small" sx={{ m: 'auto' }}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    );
};
