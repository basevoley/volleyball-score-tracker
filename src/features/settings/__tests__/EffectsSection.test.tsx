import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { EffectsSection } from '../EffectsSection';
import { defaultEffectPreferences } from '../../../domain/effects/preferences';
import type { EffectPreferences } from '../../../types';

let current: EffectPreferences;
const setSpy = vi.fn();

vi.mock('../../../contexts/PreferencesContext', () => ({
    usePreferences: () => ({ effectPreferences: current, setEffectPreferences: setSpy }),
}));
vi.mock('../../../contexts/MatchContext', () => ({
    useMatchContext: () => ({ matchDetails: { teams: { teamA: 'Alfa', teamB: 'Beta' } } }),
}));

// Re-render with the latest value so sequential edits build on each other, like the real context does
let rerender: () => void = () => {};
const Harness = () => {
    const [, force] = useState(0);
    useEffect(() => {
        rerender = () => force(n => n + 1);
    }, []);
    return <EffectsSection />;
};

const lastSaved = () => setSpy.mock.calls[setSpy.mock.calls.length - 1][0] as EffectPreferences;

describe('EffectsSection', () => {
    beforeEach(() => {
        // One text keeps the row-level tests simple; the defaults have their own test below
        current = { ...defaultEffectPreferences(), texts: [{ id: 'default-puntazo', text: 'PUNTAZO!!!', effect: 'random' }] };
        setSpy.mockReset();
        setSpy.mockImplementation((next: EffectPreferences) => { current = next; rerender(); });
    });

    it('lists every predefined text with its effect on first use', () => {
        current = defaultEffectPreferences();
        render(<Harness />);
        const texts = screen.getAllByLabelText('Texto').map(el => (el as HTMLInputElement).value);
        const effects = screen.getAllByLabelText('Efecto').map(el => (el as HTMLSelectElement).selectedOptions[0].text);
        expect(texts).toEqual(['PUNTAZO!!!', '¡¡PUNTO DIRECTO!!', '😱ACE!!', '¡¡PIN CHO TEE!!', '¡¡IMPARABLE!!', '¡¡MONSTER BLOCK!!', '¡¡Y OTRO!!']);
        expect(effects).toEqual(['Efecto aleatorio', 'Ola', 'Láser', 'Impacto', 'Disparo', 'Glitch', 'Rápido']);
    });

    it('lists the stored texts', () => {
        render(<Harness />);
        expect(screen.getByLabelText('Texto')).toHaveValue('PUNTAZO!!!');
        expect(screen.getByLabelText('Efecto')).toHaveValue('random');
    });

    it('offers the team names as targets and saves the choice', () => {
        render(<Harness />);
        const target = screen.getByLabelText('Puntos que se celebran');
        expect(Array.from((target as HTMLSelectElement).options).map(o => o.text)).toEqual(['Ninguno (desactivado)', 'Alfa', 'Beta', 'Ambos equipos']);
        fireEvent.change(target, { target: { value: 'teamB' } });
        expect(lastSaved().target).toBe('teamB');
    });

    it('saves the crowd and text modes independently', () => {
        render(<Harness />);
        fireEvent.change(screen.getByLabelText('Afición'), { target: { value: 'every-point' } });
        fireEvent.change(screen.getByLabelText('Texto animado'), { target: { value: 'off' } });
        expect(lastSaved().crowd.mode).toBe('every-point');
        expect(lastSaved().text.mode).toBe('off');
    });

    it('toggles the team name suffix', () => {
        render(<Harness />);
        fireEvent.click(screen.getByRole('switch'));
        expect(lastSaved().appendTeamName).toBe(true);
    });

    it('offers the random option and every effect, jumbotron and slam included', () => {
        render(<Harness />);
        const options = Array.from((screen.getByLabelText('Efecto') as HTMLSelectElement).options).map(o => o.text);
        expect(options[0]).toBe('Efecto aleatorio');
        expect(options).toContain('Jumbotron');
        expect(options).toContain('Impacto');
        expect(options).toContain('Láser');
        expect(options).toContain('Rápido');
        expect(options).toContain('Ola');
    });

    it('saves the jumbotron effect for a text', () => {
        render(<Harness />);
        fireEvent.change(screen.getByLabelText('Efecto'), { target: { value: 'jumbotron' } });
        expect(lastSaved().texts[0].effect).toBe('jumbotron');
    });

    it('edits a text and its effect', () => {
        render(<Harness />);
        fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Vamos 🔥' } });
        fireEvent.change(screen.getByLabelText('Efecto'), { target: { value: 'glitch' } });
        expect(lastSaved().texts).toEqual([{ id: 'default-puntazo', text: 'Vamos 🔥', effect: 'glitch' }]);
    });

    it('adds and removes texts', () => {
        render(<Harness />);
        fireEvent.click(screen.getByRole('button', { name: 'Añadir texto' }));
        expect(lastSaved().texts).toHaveLength(2);
        expect(lastSaved().texts[1]).toMatchObject({ text: '', effect: 'random' });

        fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar texto' })[0]);
        expect(lastSaved().texts).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', { name: 'Eliminar texto' }));
        expect(lastSaved().texts).toEqual([]);
    });

    describe('restoring the default texts', () => {
        const customised = (): EffectPreferences => ({
            ...defaultEffectPreferences(),
            target: 'teamA',
            appendTeamName: true,
            crowd: { mode: 'every-point' },
            text: { mode: 'off' },
            texts: [{ id: 'mine', text: 'Mío', effect: 'pop' }],
        });

        it('is disabled while the texts are the defaults', () => {
            current = defaultEffectPreferences();
            render(<Harness />);
            expect(screen.getByRole('button', { name: 'Restablecer' })).toBeDisabled();
        });

        it('is enabled as soon as the texts differ, even by one edit', () => {
            current = defaultEffectPreferences();
            render(<Harness />);
            fireEvent.change(screen.getAllByLabelText('Texto')[0], { target: { value: 'PUNTAZO' } });
            expect(screen.getByRole('button', { name: 'Restablecer' })).toBeEnabled();
        });

        it('asks before discarding the current texts, and changes nothing yet', () => {
            current = customised();
            render(<Harness />);
            fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
            expect(screen.getByText(/¿Restablecer los textos a los valores por defecto\?/)).toBeInTheDocument();
            expect(setSpy).not.toHaveBeenCalled();
        });

        it('keeps the current texts if the question is declined', () => {
            current = customised();
            render(<Harness />);
            fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
            fireEvent.click(screen.getByRole('button', { name: 'No' }));
            expect(setSpy).not.toHaveBeenCalled();
            expect(screen.getByLabelText('Texto')).toHaveValue('Mío');
        });

        it('brings back the predefined texts when confirmed', () => {
            current = customised();
            render(<Harness />);
            fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
            fireEvent.click(screen.getByRole('button', { name: 'Si' }));
            expect(lastSaved().texts).toEqual(defaultEffectPreferences().texts);
            expect(screen.getAllByLabelText('Texto')).toHaveLength(7);
        });

        it('only touches the texts, not the target, modes or team-name switch', () => {
            current = customised();
            render(<Harness />);
            fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
            fireEvent.click(screen.getByRole('button', { name: 'Si' }));
            expect(lastSaved()).toMatchObject({
                target: 'teamA',
                appendTeamName: true,
                crowd: { mode: 'every-point' },
                text: { mode: 'off' },
            });
        });

        it('also recovers texts that were all deleted', () => {
            current = { ...defaultEffectPreferences(), texts: [] };
            render(<Harness />);
            fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
            fireEvent.click(screen.getByRole('button', { name: 'Si' }));
            expect(lastSaved().texts).toHaveLength(7);
        });
    });

    it('reorders texts', () => {
        current = { ...defaultEffectPreferences(), texts: [{ id: 'a', text: 'A', effect: 'pop' }, { id: 'b', text: 'B', effect: 'pop' }] };
        render(<Harness />);
        fireEvent.click(screen.getAllByRole('button', { name: 'Bajar texto' })[0]);
        expect(lastSaved().texts.map(t => t.id)).toEqual(['b', 'a']);
    });

    it('disables moving the first text up and the last text down', () => {
        current = { ...defaultEffectPreferences(), texts: [{ id: 'a', text: 'A', effect: 'pop' }, { id: 'b', text: 'B', effect: 'pop' }] };
        render(<Harness />);
        expect(screen.getAllByRole('button', { name: 'Subir texto' })[0]).toBeDisabled();
        expect(screen.getAllByRole('button', { name: 'Bajar texto' })[1]).toBeDisabled();
    });
});
