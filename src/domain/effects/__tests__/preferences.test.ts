import { describe, it, expect, beforeEach } from 'vitest';
import { TEXT_EFFECTS } from '../constants';
import {
    EFFECT_PREFERENCES_KEY,
    defaultEffectPreferences,
    loadEffectPreferences,
    parseEffectPreferences,
    saveEffectPreferences,
} from '../preferences';

describe('effect preferences', () => {
    beforeEach(() => localStorage.clear());

    it('starts switched off', () => {
        expect(defaultEffectPreferences().target).toBe('none');
    });

    it('offers the generic "PUNTAZO!!!" first, then the ready-made celebrations with their effects', () => {
        expect(defaultEffectPreferences().texts.map(t => [t.text, t.effect])).toEqual([
            ['PUNTAZO!!!', 'random'],
            ['¡¡PUNTO DIRECTO!!', 'wave'],
            ['😱ACE!!', 'laser'],
            ['¡¡PIN CHO TEE!!', 'slam'],
            ['¡¡IMPARABLE!!', 'shooting'],
            ['¡¡MONSTER BLOCK!!', 'glitch'],
            ['¡¡Y OTRO!!', 'sonic'],
        ]);
    });

    it('gives every default text a unique id and only known effects', () => {
        const { texts } = defaultEffectPreferences();
        expect(new Set(texts.map(t => t.id)).size).toBe(texts.length);
        const known = new Set(['random', ...TEXT_EFFECTS.map(e => e.id)]);
        texts.forEach(t => expect(known.has(t.effect)).toBe(true));
    });

    it('hands out a fresh copy of the defaults each time, so edits never leak into them', () => {
        const first = defaultEffectPreferences();
        first.texts[0].text = 'changed';
        first.texts.pop();
        expect(defaultEffectPreferences().texts[0].text).toBe('PUNTAZO!!!');
        expect(defaultEffectPreferences().texts).toHaveLength(7);
    });

    it('round-trips everything except the target through localStorage', () => {
        const prefs = {
            target: 'none' as const,
            appendTeamName: true,
            crowd: { mode: 'every-point' as const },
            text: { mode: 'off' as const },
            texts: [{ id: 'a', text: 'Vamos 🔥', effect: 'glitch' as const }],
        };
        saveEffectPreferences({ ...prefs, target: 'teamB' });
        expect(loadEffectPreferences()).toEqual(prefs);
    });

    it('never writes the celebrated team to storage', () => {
        saveEffectPreferences({ ...defaultEffectPreferences(), target: 'both' });
        expect(JSON.parse(localStorage.getItem(EFFECT_PREFERENCES_KEY)!)).not.toHaveProperty('target');
    });

    it('ignores a target stored by an earlier version', () => {
        localStorage.setItem(EFFECT_PREFERENCES_KEY, JSON.stringify({ ...defaultEffectPreferences(), target: 'teamA', appendTeamName: true }));
        const loaded = loadEffectPreferences();
        expect(loaded.target).toBe('none');
        expect(loaded.appendTeamName).toBe(true);
    });

    it('falls back to defaults when nothing is stored', () => {
        expect(loadEffectPreferences()).toEqual(defaultEffectPreferences());
    });

    it('falls back to defaults on corrupt JSON', () => {
        localStorage.setItem(EFFECT_PREFERENCES_KEY, '{not json');
        expect(loadEffectPreferences()).toEqual(defaultEffectPreferences());
    });

    it('falls back field by field on unknown values, keeping the valid ones', () => {
        const prefs = parseEffectPreferences({
            target: 'everyone',
            appendTeamName: 'yes',
            crowd: { mode: 'manual' },
            text: { mode: 'sometimes' },
            texts: [{ id: 'a', text: 'Hola', effect: 'nope' }],
        });
        expect(prefs.target).toBe('none');
        expect(prefs.appendTeamName).toBe(false);
        expect(prefs.crowd.mode).toBe('manual');
        expect(prefs.text.mode).toBe(defaultEffectPreferences().text.mode);
        expect(prefs.texts).toEqual([{ id: 'a', text: 'Hola', effect: 'random' }]);
    });

    it('keeps every known text effect, including jumbotron, slam, laser, sonic and wave', () => {
        const effects = TEXT_EFFECTS.map(e => e.id);
        expect(effects).toEqual(expect.arrayContaining(['jumbotron', 'slam', 'laser', 'sonic', 'wave']));
        const prefs = parseEffectPreferences({ texts: effects.map((effect, i) => ({ id: `t${i}`, text: 'x', effect })) });
        expect(prefs.texts.map(t => t.effect)).toEqual(effects);
    });

    it('drops malformed text entries', () => {
        const prefs = parseEffectPreferences({ texts: [null, { id: 1, text: 'x' }, { id: 'ok', text: 'ok', effect: 'pop' }] });
        expect(prefs.texts).toEqual([{ id: 'ok', text: 'ok', effect: 'pop' }]);
    });

    it('seeds the text list when it is missing but keeps an empty list empty', () => {
        expect(parseEffectPreferences({}).texts).toEqual(defaultEffectPreferences().texts);
        expect(parseEffectPreferences({ texts: [] }).texts).toEqual([]);
    });

    it('accepts non-object input', () => {
        expect(parseEffectPreferences(null)).toEqual(defaultEffectPreferences());
        expect(parseEffectPreferences('x')).toEqual(defaultEffectPreferences());
    });
});
