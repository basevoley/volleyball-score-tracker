import type { AutomationLayoutMode, ConfigChange, RuntimeConfig } from '../../types';

// Config keys that decide *where/how* a panel is drawn, as opposed to *whether* it is shown.
// In 'manual' layout mode automations must leave these untouched.
export const LAYOUT_KEYS: Partial<Record<keyof RuntimeConfig, readonly string[]>> = {
    scoreboard: ['position', 'type'],
    socialMedia: ['position'],
    subscribe: ['position'],
};

const isLayoutKey = (section: keyof RuntimeConfig, key: string): boolean =>
    LAYOUT_KEYS[section]?.includes(key) ?? false;

export const filterLayoutChanges = (changes: ConfigChange[], mode: AutomationLayoutMode): ConfigChange[] =>
    mode === 'manual' ? changes.filter(c => !isLayoutKey(c.section, c.key)) : changes;

// Copy of a section's values without its layout keys (so a snapshot restore keeps the operator's layout).
export const withoutLayoutKeys = <T extends object>(section: keyof RuntimeConfig, values: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(values).filter(([key]) => !isLayoutKey(section, key))
    ) as Partial<T>;
