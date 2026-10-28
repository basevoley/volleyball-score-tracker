import type { CelebrationTextEntry, EffectMode, EffectPreferences, TextEffectChoice } from '../../types';
import { TEXT_EFFECTS } from './constants';

export const EFFECT_PREFERENCES_KEY = 'vb_effect_preferences';

const MODES: EffectMode[] = ['off', 'every-point', 'manual'];
const EFFECT_CHOICES: TextEffectChoice[] = ['random', ...TEXT_EFFECTS.map(e => e.id)];

// Texts offered out of the box. The first one is also what an `every-point` text uses, so it stays
// the generic one on a random effect; the rest are ready-made celebrations with their own effect.
export const DEFAULT_TEXT_ENTRIES: readonly CelebrationTextEntry[] = [
    { id: 'default-puntazo', text: 'PUNTAZO!!!', effect: 'random' },
    { id: 'default-punto-directo', text: '¡¡PUNTO DIRECTO!!', effect: 'wave' },
    { id: 'default-ace', text: '😱ACE!!', effect: 'laser' },
    { id: 'default-pin-cho-tee', text: '¡¡PIN CHO TEE!!', effect: 'slam' },
    { id: 'default-imparable', text: '¡¡IMPARABLE!!', effect: 'shooting' },
    { id: 'default-monster-block', text: '¡¡MONSTER BLOCK!!', effect: 'glitch' },
    { id: 'default-y-otro', text: '¡¡Y OTRO!!', effect: 'sonic' },
];

// Off until the operator opts in, so existing users never get an unexpected dialog on every point
export const defaultEffectPreferences = (): EffectPreferences => ({
    target: 'none',
    appendTeamName: false,
    crowd: { mode: 'manual' },
    text: { mode: 'manual' },
    texts: DEFAULT_TEXT_ENTRIES.map(entry => ({ ...entry })),
});

const pick = <T,>(value: unknown, allowed: T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;

const parseEntry = (raw: unknown): CelebrationTextEntry | null => {
    if (typeof raw !== 'object' || raw === null) return null;
    const { id, text, effect } = raw as Record<string, unknown>;
    if (typeof id !== 'string' || typeof text !== 'string') return null;
    return { id, text, effect: pick(effect, EFFECT_CHOICES, 'random') };
};

// Field-by-field so one bad value never discards the rest; a missing list is seeded, an empty one stays empty.
// The target is never read back: which team to celebrate belongs to one match, and restoring it
// could cheer for the wrong team in the next one (see PreferencesContext for when it resets).
export const parseEffectPreferences = (raw: unknown): EffectPreferences => {
    const defaults = defaultEffectPreferences();
    if (typeof raw !== 'object' || raw === null) return defaults;
    const r = raw as Record<string, unknown>;
    const modeOf = (part: unknown, fallback: EffectMode) =>
        pick((part as { mode?: unknown } | null)?.mode, MODES, fallback);
    return {
        target: defaults.target,
        appendTeamName: typeof r.appendTeamName === 'boolean' ? r.appendTeamName : defaults.appendTeamName,
        crowd: { mode: modeOf(r.crowd, defaults.crowd.mode) },
        text: { mode: modeOf(r.text, defaults.text.mode) },
        texts: Array.isArray(r.texts)
            ? r.texts.map(parseEntry).filter((e): e is CelebrationTextEntry => e !== null)
            : defaults.texts,
    };
};

export const loadEffectPreferences = (): EffectPreferences => {
    try {
        const stored = localStorage.getItem(EFFECT_PREFERENCES_KEY);
        return stored ? parseEffectPreferences(JSON.parse(stored)) : defaultEffectPreferences();
    } catch {
        return defaultEffectPreferences();
    }
};

export const saveEffectPreferences = (prefs: EffectPreferences): void => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { target: _target, ...persistent } = prefs;
        localStorage.setItem(EFFECT_PREFERENCES_KEY, JSON.stringify(persistent));
    } catch {
        // Storage full or unavailable: preferences stay in memory for this session
    }
};
