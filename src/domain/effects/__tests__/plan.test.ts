import { describe, it, expect } from 'vitest';
import { planPointEffects, coversScorer } from '../plan';
import { TEXT_EFFECTS } from '../constants';
import type { Celebration, EffectMode, EffectPreferences, EffectTarget } from '../../../types';

const texts = [
    { id: 't1', text: 'Uno', effect: 'pop' as const },
    { id: 't2', text: 'Dos', effect: 'random' as const },
];

const prefs = (text: EffectMode, crowd: EffectMode, over: Partial<EffectPreferences> = {}): EffectPreferences => ({
    target: 'both',
    appendTeamName: false,
    text: { mode: text },
    crowd: { mode: crowd },
    texts,
    ...over,
});

const rngZero = () => 0;
const plan = (p: EffectPreferences, scorer: 'teamA' | 'teamB' = 'teamA') => planPointEffects(p, scorer, 'Alfa', rngZero);

const crowdOnly: Celebration = { team: 'teamA', crowd: true };
const textOnly: Celebration = { team: 'teamA', text: { content: 'Uno', effect: 'pop' }, crowd: false };
const textAndCrowd: Celebration = { ...textOnly, crowd: true };

describe('planPointEffects: mode matrix', () => {
    type Row = [EffectMode, EffectMode, Celebration | null, string | null, Celebration | null];
    // text, crowd, immediate, dialog variant, outcome when the dialog is dismissed
    const rows: Row[] = [
        ['off', 'off', null, null, null],
        ['off', 'every-point', crowdOnly, null, null],
        ['off', 'manual', null, 'crowd-only', null],
        ['every-point', 'off', textOnly, null, null],
        ['every-point', 'every-point', textAndCrowd, null, null],
        ['every-point', 'manual', null, 'confirm-crowd', textOnly],
        ['manual', 'off', null, 'texts', null],
        ['manual', 'every-point', null, 'texts', crowdOnly],
        ['manual', 'manual', null, 'texts', null],
    ];

    it.each(rows)('text %s + crowd %s', (text, crowd, immediate, variant, dismissed) => {
        const result = plan(prefs(text, crowd));
        expect(result.immediate).toEqual(immediate);
        expect(result.dialog?.variant ?? null).toBe(variant);
        if (variant) expect(result.dialog!.onDismiss).toEqual(dismissed);
    });

    it('treats an empty text list as text off', () => {
        expect(plan(prefs('manual', 'manual', { texts: [] })).dialog?.variant).toBe('crowd-only');
        expect(plan(prefs('every-point', 'every-point', { texts: [] })).immediate).toEqual(crowdOnly);
        expect(plan(prefs('manual', 'off', { texts: [] }))).toEqual({ immediate: null, dialog: null });
    });
});

describe('planPointEffects: target', () => {
    it.each<[EffectTarget, 'teamA' | 'teamB', boolean]>([
        ['none', 'teamA', false],
        ['none', 'teamB', false],
        ['teamA', 'teamA', true],
        ['teamA', 'teamB', false],
        ['teamB', 'teamA', false],
        ['teamB', 'teamB', true],
        ['both', 'teamA', true],
        ['both', 'teamB', true],
    ])('target %s, scorer %s -> covered: %s', (target, scorer, covered) => {
        expect(coversScorer(target, scorer)).toBe(covered);
        const result = plan(prefs('every-point', 'every-point', { target }), scorer);
        expect(result.immediate !== null).toBe(covered);
        expect(result.dialog).toBeNull();
    });
});

describe('planPointEffects: celebration content', () => {
    it('uses the first text for every-point', () => {
        expect(plan(prefs('every-point', 'off')).immediate?.text?.content).toBe('Uno');
    });

    it('appends the team name when enabled', () => {
        const result = plan(prefs('every-point', 'off', { appendTeamName: true }));
        expect(result.immediate?.text?.content).toBe('Uno Alfa');
    });

    it('attributes the celebration to the scorer', () => {
        expect(plan(prefs('every-point', 'every-point'), 'teamB').immediate?.team).toBe('teamB');
    });

    it('resolves "random" with the injected rng', () => {
        const p = prefs('every-point', 'off', { texts: [{ id: 'r', text: 'R', effect: 'random' }] });
        const last = TEXT_EFFECTS.length - 1;
        expect(planPointEffects(p, 'teamA', 'Alfa', () => 0).immediate?.text?.effect).toBe(TEXT_EFFECTS[0].id);
        expect(planPointEffects(p, 'teamA', 'Alfa', () => 0.999).immediate?.text?.effect).toBe(TEXT_EFFECTS[last].id);
    });

    it('can pick the jumbotron when randomising and passes an explicit one through', () => {
        const explicit = prefs('every-point', 'off', { texts: [{ id: 'j', text: 'J', effect: 'jumbotron' }] });
        expect(plan(explicit).immediate?.text?.effect).toBe('jumbotron');
        const random = prefs('every-point', 'off', { texts: [{ id: 'r', text: 'R', effect: 'random' }] });
        const picked = new Set(TEXT_EFFECTS.map((_, i) => planPointEffects(random, 'teamA', 'Alfa', () => i / TEXT_EFFECTS.length).immediate?.text?.effect));
        expect(picked).toEqual(new Set(TEXT_EFFECTS.map(e => e.id)));
    });

    it('keeps emojis and long text untouched', () => {
        const long = 'x'.repeat(200) + ' 🏐🔥';
        const p = prefs('every-point', 'off', { texts: [{ id: 'e', text: long, effect: 'pop' }] });
        expect(plan(p).immediate?.text?.content).toBe(long);
    });
});

describe('planPointEffects: dialog choices', () => {
    it('lists one option per text', () => {
        const dialog = plan(prefs('manual', 'manual')).dialog!;
        expect(dialog.options).toEqual([{ id: 't1', label: 'Uno' }, { id: 't2', label: 'Dos' }]);
        expect(dialog.teamName).toBe('Alfa');
        expect(dialog.crowd).toBe('manual');
    });

    describe('manual text + manual crowd', () => {
        const dialog = () => plan(prefs('manual', 'manual')).dialog!;
        it('a text without crowd', () => {
            expect(dialog().resolve({ kind: 'text', id: 't1', withCrowd: false })).toEqual(textOnly);
        });
        it('a text with crowd', () => {
            expect(dialog().resolve({ kind: 'text', id: 't1', withCrowd: true })).toEqual(textAndCrowd);
        });
        it('crowd only', () => {
            expect(dialog().resolve({ kind: 'crowd' })).toEqual(crowdOnly);
        });
        it('an unknown text id plays nothing', () => {
            expect(dialog().resolve({ kind: 'text', id: 'nope', withCrowd: true })).toBeNull();
        });
    });

    it('manual text + every-point crowd: a text always carries the crowd, whatever the checkbox says', () => {
        const dialog = plan(prefs('manual', 'every-point')).dialog!;
        expect(dialog.resolve({ kind: 'text', id: 't1', withCrowd: false })).toEqual(textAndCrowd);
    });

    it('manual text + crowd off: a text never carries the crowd', () => {
        const dialog = plan(prefs('manual', 'off')).dialog!;
        expect(dialog.resolve({ kind: 'text', id: 't1', withCrowd: true })).toEqual(textOnly);
    });

    it('every-point text + manual crowd: yes adds the crowd, no keeps the text alone', () => {
        const dialog = plan(prefs('every-point', 'manual')).dialog!;
        expect(dialog.resolve({ kind: 'confirm', accept: true })).toEqual(textAndCrowd);
        expect(dialog.resolve({ kind: 'confirm', accept: false })).toEqual(textOnly);
    });

    it('crowd-only dialog: the button shows the crowd', () => {
        const dialog = plan(prefs('off', 'manual')).dialog!;
        expect(dialog.resolve({ kind: 'crowd' })).toEqual(crowdOnly);
    });
});
