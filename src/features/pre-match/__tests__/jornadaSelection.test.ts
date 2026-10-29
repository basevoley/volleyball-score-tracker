import { describe, test, expect } from 'vitest';
import { pickInitialJornada, jornadaOptionLabel } from '../jornadaSelection';

describe('pickInitialJornada', () => {
  const keys = ['1', '2', '3', '4', '5'];

  test('defaults to the current jornada', () => {
    expect(pickInitialJornada(keys, '4')).toBe('4');
  });

  test('keeps the previous selection over the current jornada when it still exists', () => {
    expect(pickInitialJornada(keys, '4', '2')).toBe('2');
  });

  test('ignores a previous selection that no longer exists', () => {
    expect(pickInitialJornada(keys, '4', '99')).toBe('4');
  });

  test('ignores an empty previous selection', () => {
    expect(pickInitialJornada(keys, '4', '')).toBe('4');
  });

  test('falls back to the last jornada when the current one is unknown', () => {
    expect(pickInitialJornada(keys, '99')).toBe('5');
    expect(pickInitialJornada(keys)).toBe('5');
  });

  test('returns an empty string when there are no jornadas', () => {
    expect(pickInitialJornada([], '1')).toBe('');
  });
});

describe('jornadaOptionLabel', () => {
  test('marks only the current jornada', () => {
    expect(jornadaOptionLabel(5, true)).toBe('Jornada 5 (actual)');
    expect(jornadaOptionLabel('4', false)).toBe('Jornada 4');
  });
});
