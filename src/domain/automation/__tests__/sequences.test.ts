import { describe, it, expect } from 'vitest';
import { ALL_SEQUENCES } from '../sequences';
import type { RuntimeConfig } from '../../../types';

const positionsUsed = (section: keyof RuntimeConfig): Set<unknown> =>
    new Set(
        ALL_SEQUENCES.flatMap(s => s.steps.flatMap(step => step.changes))
            .filter(c => c.section === section && c.key === 'position')
            .map(c => c.value)
    );

describe('preset layout', () => {
    it('places the scoreboard top-left', () => {
        expect([...positionsUsed('scoreboard')]).toEqual(['top-left']);
    });

    it('places the social cycler top-right', () => {
        expect([...positionsUsed('socialMedia')]).toEqual(['top-right']);
    });

    it('never gives the scoreboard and the social cycler the same position', () => {
        const social = positionsUsed('socialMedia');
        expect([...positionsUsed('scoreboard')].filter(p => social.has(p))).toEqual([]);
    });

    // The subscribe logo overflows ~135px above its box and would be cropped by the canvas edge.
    it('never places the subscribe splash at a top position', () => {
        const top = [...positionsUsed('subscribe')].filter(p => String(p).startsWith('top'));
        expect(top).toEqual([]);
    });

    it('never places the subscribe splash in a corner used by the scoreboard or social cycler', () => {
        const taken = new Set([...positionsUsed('scoreboard'), ...positionsUsed('socialMedia')]);
        expect([...positionsUsed('subscribe')].filter(p => taken.has(p))).toEqual([]);
    });
});
