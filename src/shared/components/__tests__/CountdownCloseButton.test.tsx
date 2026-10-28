import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CountdownCloseButton } from '../CountdownCloseButton';

describe('CountdownCloseButton', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('closes by itself once the duration has elapsed', () => {
        const onClose = vi.fn();
        render(<CountdownCloseButton durationMs={10000} onClose={onClose} />);
        act(() => { vi.advanceTimersByTime(9999); });
        expect(onClose).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on click', () => {
        const onClose = vi.fn();
        render(<CountdownCloseButton durationMs={10000} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not fire after unmounting', () => {
        const onClose = vi.fn();
        const { unmount } = render(<CountdownCloseButton durationMs={10000} onClose={onClose} />);
        unmount();
        act(() => { vi.advanceTimersByTime(20000); });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('restarts the countdown when remounted with a new key', () => {
        const onClose = vi.fn();
        const { rerender } = render(<CountdownCloseButton key="a" durationMs={10000} onClose={onClose} />);
        act(() => { vi.advanceTimersByTime(8000); });
        rerender(<CountdownCloseButton key="b" durationMs={10000} onClose={onClose} />);
        act(() => { vi.advanceTimersByTime(8000); });
        expect(onClose).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(2000); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('drains the ring over the given duration', () => {
        render(<CountdownCloseButton durationMs={7300} onClose={vi.fn()} />);
        // jsdom does not compute animations, so read the generated rule instead
        const css = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('');
        expect(css).toMatch(/animation:[^;]*7300ms linear forwards/);
        expect(screen.getByTestId('countdown-ring')).toBeInTheDocument();
    });
});
