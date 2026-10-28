import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PointEffectsDialog } from '../PointEffectsDialog';
import { planPointEffects } from '../../../domain/effects/plan';
import { DIALOG_TIMEOUT_MS } from '../../../domain/effects/constants';
import type { EffectMode, EffectPreferences } from '../../../types';

const prefs = (text: EffectMode, crowd: EffectMode): EffectPreferences => ({
    target: 'both',
    appendTeamName: false,
    text: { mode: text },
    crowd: { mode: crowd },
    texts: [
        { id: 't1', text: 'PUNTAZO!!!', effect: 'pop' },
        { id: 't2', text: 'Vamos 🔥', effect: 'glitch' },
    ],
});

const open = (text: EffectMode, crowd: EffectMode) => {
    const spec = planPointEffects(prefs(text, crowd), 'teamA', 'Alfa', () => 0).dialog!;
    const onChoose = vi.fn();
    const onDismiss = vi.fn();
    render(<PointEffectsDialog spec={spec} onChoose={onChoose} onDismiss={onDismiss} />);
    return { onChoose, onDismiss };
};

describe('PointEffectsDialog', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    describe('manual text + manual crowd', () => {
        it('shows a button per text, a ticked "Con afición" checkbox and "Solo afición"', () => {
            open('manual', 'manual');
            expect(screen.getByText('Punto para Alfa')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'PUNTAZO!!!' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Vamos 🔥' })).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: 'Con afición' })).toBeChecked();
            expect(screen.getByRole('button', { name: 'Solo afición' })).toBeInTheDocument();
        });

        it('a text button chooses that text with the checkbox state', () => {
            const { onChoose } = open('manual', 'manual');
            fireEvent.click(screen.getByRole('button', { name: 'PUNTAZO!!!' }));
            expect(onChoose).toHaveBeenCalledWith({ kind: 'text', id: 't1', withCrowd: true });
        });

        it('unticking the checkbox chooses the text without the crowd', () => {
            const { onChoose } = open('manual', 'manual');
            fireEvent.click(screen.getByRole('checkbox', { name: 'Con afición' }));
            fireEvent.click(screen.getByRole('button', { name: 'Vamos 🔥' }));
            expect(onChoose).toHaveBeenCalledWith({ kind: 'text', id: 't2', withCrowd: false });
        });

        it('"Solo afición" chooses the crowd alone', () => {
            const { onChoose } = open('manual', 'manual');
            fireEvent.click(screen.getByRole('button', { name: 'Solo afición' }));
            expect(onChoose).toHaveBeenCalledWith({ kind: 'crowd' });
        });
    });

    describe('manual text + automatic crowd', () => {
        it('shows a read-only ticked checkbox and no "Solo afición"', () => {
            open('manual', 'every-point');
            const checkbox = screen.getByRole('checkbox', { name: 'Con afición (automática)' });
            expect(checkbox).toBeChecked();
            expect(checkbox).toBeDisabled();
            expect(screen.queryByRole('button', { name: 'Solo afición' })).toBeNull();
        });
    });

    describe('manual text + crowd off', () => {
        it('shows a read-only unticked checkbox', () => {
            open('manual', 'off');
            const checkbox = screen.getByRole('checkbox', { name: 'Con afición (desactivada)' });
            expect(checkbox).not.toBeChecked();
            expect(checkbox).toBeDisabled();
        });
    });

    describe('every-point text + manual crowd', () => {
        it('is a yes/no question with no text buttons', () => {
            const { onChoose } = open('every-point', 'manual');
            expect(screen.getByText('¿Mostrar afición?')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'PUNTAZO!!!' })).toBeNull();
            fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
            expect(onChoose).toHaveBeenLastCalledWith({ kind: 'confirm', accept: true });
            fireEvent.click(screen.getByRole('button', { name: 'No' }));
            expect(onChoose).toHaveBeenLastCalledWith({ kind: 'confirm', accept: false });
        });
    });

    describe('text off + manual crowd', () => {
        it('shows only "Mostrar afición"', () => {
            const { onChoose } = open('off', 'manual');
            expect(screen.queryByRole('checkbox')).toBeNull();
            fireEvent.click(screen.getByRole('button', { name: 'Mostrar afición' }));
            expect(onChoose).toHaveBeenCalledWith({ kind: 'crowd' });
        });
    });

    describe('modality', () => {
        it('is a modal dialog labelled by its title', () => {
            open('manual', 'manual');
            const dialog = screen.getByRole('dialog', { name: 'Punto para Alfa' });
            expect(dialog).toHaveAttribute('aria-modal', 'true');
        });

        it('Escape dismisses', () => {
            const { onDismiss } = open('manual', 'manual');
            fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
            expect(onDismiss).toHaveBeenCalledTimes(1);
        });

        it('a click on the backdrop does not dismiss', () => {
            const { onDismiss } = open('manual', 'manual');
            fireEvent.click(document.querySelector('.MuiBackdrop-root')!);
            expect(onDismiss).not.toHaveBeenCalled();
        });
    });

    describe('closing', () => {
        it('the X dismisses', () => {
            const { onDismiss } = open('manual', 'manual');
            fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
            expect(onDismiss).toHaveBeenCalledTimes(1);
        });

        it('dismisses by itself after the dialog timeout', () => {
            const { onDismiss } = open('manual', 'manual');
            act(() => { vi.advanceTimersByTime(DIALOG_TIMEOUT_MS - 1); });
            expect(onDismiss).not.toHaveBeenCalled();
            act(() => { vi.advanceTimersByTime(1); });
            expect(onDismiss).toHaveBeenCalledTimes(1);
        });
    });
});
