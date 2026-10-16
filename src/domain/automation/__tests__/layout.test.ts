import { describe, it, expect } from 'vitest';
import { filterLayoutChanges, withoutLayoutKeys } from '../layout';
import { ALL_SEQUENCES } from '../sequences';
import type { ConfigChange } from '../../../types';

const changes: ConfigChange[] = [
    { section: 'scoreboard', key: 'enabled', value: true },
    { section: 'scoreboard', key: 'type', value: 'vertical-table' },
    { section: 'scoreboard', key: 'position', value: 'bottom-left' },
    { section: 'scoreboard', key: 'showHistory', value: true },
    { section: 'socialMedia', key: 'position', value: 'top-left' },
    { section: 'socialMedia', key: 'enabled', value: true },
    { section: 'subscribe', key: 'position', value: 'center' },
    { section: 'afterMatch', key: 'showStats', value: true },
];

describe('filterLayoutChanges', () => {
    it('returns all changes in preset mode', () => {
        expect(filterLayoutChanges(changes, 'preset')).toEqual(changes);
    });

    it('removes only layout keys in manual mode', () => {
        expect(filterLayoutChanges(changes, 'manual')).toEqual([
            { section: 'scoreboard', key: 'enabled', value: true },
            { section: 'scoreboard', key: 'showHistory', value: true },
            { section: 'socialMedia', key: 'enabled', value: true },
            { section: 'afterMatch', key: 'showStats', value: true },
        ]);
    });

    it('leaves no position/type change in any shipped sequence in manual mode', () => {
        const remaining = ALL_SEQUENCES
            .flatMap(s => s.steps.flatMap(step => filterLayoutChanges(step.changes, 'manual')))
            .filter(c => c.key === 'position' || c.key === 'type');
        expect(remaining).toEqual([]);
    });
});

describe('withoutLayoutKeys', () => {
    it('drops layout keys of the section and keeps the rest', () => {
        expect(withoutLayoutKeys('scoreboard', { enabled: true, type: 'classic', position: 'top', showHistory: false }))
            .toEqual({ enabled: true, showHistory: false });
    });

    it('keeps everything for sections without layout keys', () => {
        expect(withoutLayoutKeys('sponsors', { enabled: true })).toEqual({ enabled: true });
    });
});
