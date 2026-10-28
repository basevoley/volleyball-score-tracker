import { useState } from 'react';
import { Box, Button, Checkbox, Dialog, FormControlLabel, Typography } from '@mui/material';
import { CountdownCloseButton } from '../../shared/components/CountdownCloseButton';
import { DIALOG_TIMEOUT_MS } from '../../domain/effects/constants';
import type { DialogChoice, DialogSpec } from '../../domain/effects/plan';

interface Props {
    spec: DialogSpec;
    onChoose: (choice: DialogChoice) => void;
    onDismiss: () => void;
}

const crowdStatusLabel = (crowd: DialogSpec['crowd']) =>
    crowd === 'every-point' ? 'Con afición (automática)' : 'Con afición (desactivada)';

const TITLE_ID = 'point-effects-dialog-title';

// Modal: the operator answers (or lets the countdown run out) before scoring again. Escape
// dismisses like the X; a click on the backdrop does not, so a stray tap can't drop the celebration.
// Every way of closing it either picks a celebration or dismisses; the owner decides what each plays.
export const PointEffectsDialog = ({ spec, onChoose, onDismiss }: Props) => {
    const [withCrowd, setWithCrowd] = useState(true);
    const { variant, teamName } = spec;

    return (
        <Dialog
            open
            fullWidth
            maxWidth="xs"
            aria-labelledby={TITLE_ID}
            onClose={(_event, reason) => { if (reason === 'escapeKeyDown') onDismiss(); }}
            slotProps={{ paper: { sx: { p: 2, pt: 1.5 } } }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography id={TITLE_ID} variant="subtitle1" fontWeight={700}>
                    {variant === 'confirm-crowd' ? '¿Mostrar afición?' : `Punto para ${teamName}`}
                </Typography>
                <CountdownCloseButton durationMs={DIALOG_TIMEOUT_MS} onClose={onDismiss} />
            </Box>

            {variant === 'confirm-crowd' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button fullWidth variant="contained" onClick={() => onChoose({ kind: 'confirm', accept: true })}>Sí</Button>
                    <Button fullWidth variant="outlined" onClick={() => onChoose({ kind: 'confirm', accept: false })}>No</Button>
                </Box>
            )}

            {variant === 'crowd-only' && (
                <Button fullWidth variant="contained" onClick={() => onChoose({ kind: 'crowd' })}>Mostrar afición</Button>
            )}

            {variant === 'texts' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {spec.options.map(option => (
                        <Button
                            key={option.id}
                            fullWidth
                            variant="contained"
                            onClick={() => onChoose({ kind: 'text', id: option.id, withCrowd })}
                        >
                            {option.label}
                        </Button>
                    ))}
                    {spec.crowd === 'manual' ? (
                        <>
                            <FormControlLabel
                                control={<Checkbox checked={withCrowd} onChange={e => setWithCrowd(e.target.checked)} />}
                                label="Con afición"
                            />
                            <Button fullWidth variant="outlined" onClick={() => onChoose({ kind: 'crowd' })}>Solo afición</Button>
                        </>
                    ) : (
                        <FormControlLabel
                            control={<Checkbox checked={spec.crowd === 'every-point'} disabled />}
                            label={crowdStatusLabel(spec.crowd)}
                        />
                    )}
                </Box>
            )}
        </Dialog>
    );
};
