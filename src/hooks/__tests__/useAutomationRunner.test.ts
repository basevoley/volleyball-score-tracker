import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import useAutomationRunner from '../useAutomationRunner';
import { initialConfig } from '../../domain/match/defaults';
import type { AutomationLayoutMode, Sequence } from '../../types';

const sequence: Sequence = {
    id: 'TEST',
    label: 'test',
    description: '',
    trigger: { type: 'manual' },
    snapshotSections: ['scoreboard'],
    steps: [
        {
            label: 'show',
            changes: [
                { section: 'scoreboard', key: 'enabled', value: true },
                { section: 'scoreboard', key: 'position', value: 'bottom-left' },
                { section: 'scoreboard', key: 'type', value: 'vertical-table' },
            ],
            duration: 1000,
        },
    ],
};

const setup = (layoutMode: AutomationLayoutMode, operatorPosition = 'top-right') => {
    const start = { ...initialConfig, scoreboard: { ...initialConfig.scoreboard, position: operatorPosition } };
    return renderHook(
        ({ mode }) => {
            const [config, setConfig] = useState(start);
            return { config, runner: useAutomationRunner({ config, setConfig, layoutMode: mode }) };
        },
        { initialProps: { mode: layoutMode } }
    );
};

describe('useAutomationRunner layout mode', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('preset: sequence sets position and type', () => {
        const { result } = setup('preset');
        act(() => result.current.runner.run(sequence));
        expect(result.current.config.scoreboard).toMatchObject({ enabled: true, position: 'bottom-left', type: 'vertical-table' });
    });

    it('manual: sequence only shows/hides and keeps the operator layout', () => {
        const { result } = setup('manual');
        act(() => result.current.runner.run(sequence));
        expect(result.current.config.scoreboard).toMatchObject({
            enabled: true,
            position: 'top-right',
            type: initialConfig.scoreboard.type,
        });
    });

    it('manual: snapshot restore reverts visibility and keeps the operator layout', () => {
        const { result } = setup('manual');
        act(() => result.current.runner.run(sequence));
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(result.current.runner.isRunning).toBe(false);
        expect(result.current.config.scoreboard.enabled).toBe(initialConfig.scoreboard.enabled);
        expect(result.current.config.scoreboard.position).toBe('top-right');
    });

    it('preset: snapshot restore also restores position', () => {
        const { result } = setup('preset');
        act(() => result.current.runner.run(sequence));
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(result.current.config.scoreboard.position).toBe('top-right');
        expect(result.current.config.scoreboard.enabled).toBe(initialConfig.scoreboard.enabled);
    });
});
