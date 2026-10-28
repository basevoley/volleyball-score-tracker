import type { Celebration, CelebrationTextEntry, EffectMode, EffectPreferences, TeamKey, TextEffectId } from '../../types';
import { TEXT_EFFECTS } from './constants';

export interface TextOption { id: string; label: string }

export type DialogChoice =
    | { kind: 'text'; id: string; withCrowd: boolean }
    | { kind: 'crowd' }
    | { kind: 'confirm'; accept: boolean };

// 'texts': one button per text (+ crowd checkbox / "Solo afición"); 'confirm-crowd': yes/no; 'crowd-only': a single button
export type DialogVariant = 'texts' | 'confirm-crowd' | 'crowd-only';

export interface DialogSpec {
    variant: DialogVariant;
    team: TeamKey;
    teamName: string;
    options: TextOption[];
    // How the crowd is decided: by the operator, always on, or never
    crowd: EffectMode;
    resolve: (choice: DialogChoice) => Celebration | null;
    // What still plays when the dialog is dismissed: the every-point parts only
    onDismiss: Celebration | null;
}

export interface PointEffectsPlan {
    immediate: Celebration | null;
    dialog: DialogSpec | null;
}

export const coversScorer = (target: EffectPreferences['target'], scorer: TeamKey): boolean =>
    target === 'both' || target === scorer;

const optionLabel = (entry: CelebrationTextEntry): string => entry.text.trim() || '…';

export const planPointEffects = (
    prefs: EffectPreferences,
    scorer: TeamKey,
    teamName: string,
    rng: () => number = Math.random,
): PointEffectsPlan => {
    if (!coversScorer(prefs.target, scorer)) return { immediate: null, dialog: null };

    const hasTexts = prefs.texts.length > 0;
    // An empty list means there is nothing to show, whatever the mode says
    const textMode: EffectMode = hasTexts ? prefs.text.mode : 'off';
    const crowdMode = prefs.crowd.mode;

    const resolveEffect = (choice: CelebrationTextEntry['effect']): TextEffectId =>
        choice === 'random' ? TEXT_EFFECTS[Math.floor(rng() * TEXT_EFFECTS.length)].id : choice;

    const textPart = (entry: CelebrationTextEntry): Celebration['text'] => ({
        content: prefs.appendTeamName ? `${entry.text} ${teamName}` : entry.text,
        effect: resolveEffect(entry.effect),
    });

    const celebration = (text: CelebrationTextEntry | null, crowd: boolean): Celebration | null =>
        text || crowd ? { team: scorer, ...(text && { text: textPart(text) }), crowd } : null;

    const autoCrowd = crowdMode === 'every-point';

    if (textMode !== 'manual' && crowdMode !== 'manual') {
        return { immediate: celebration(textMode === 'every-point' ? prefs.texts[0] : null, autoCrowd), dialog: null };
    }

    const base = { team: scorer, teamName, crowd: crowdMode };

    if (textMode === 'manual') {
        const dialog: DialogSpec = {
            ...base,
            variant: 'texts',
            options: prefs.texts.map(e => ({ id: e.id, label: optionLabel(e) })),
            resolve: choice => {
                if (choice.kind === 'crowd') return celebration(null, true);
                if (choice.kind !== 'text') return null;
                const entry = prefs.texts.find(e => e.id === choice.id);
                if (!entry) return null;
                return celebration(entry, autoCrowd || (crowdMode === 'manual' && choice.withCrowd));
            },
            onDismiss: celebration(null, autoCrowd),
        };
        return { immediate: null, dialog };
    }

    // Crowd is manual and text is off or every-point
    const firstText = textMode === 'every-point' ? prefs.texts[0] : null;
    const dialog: DialogSpec = {
        ...base,
        variant: firstText ? 'confirm-crowd' : 'crowd-only',
        options: [],
        resolve: choice => {
            if (choice.kind === 'crowd' || (choice.kind === 'confirm' && choice.accept)) return celebration(firstText, true);
            return celebration(firstText, false);
        },
        onDismiss: celebration(firstText, false),
    };
    return { immediate: null, dialog };
};
