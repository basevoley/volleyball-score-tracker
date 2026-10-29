import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LigasNacionalesMatchSelector from '../LigasNacionalesMatchSelector';
import type { LigaGroupData, LigaMatch, LigaMatchResult } from '../../../services/ligasNacionales/types';

vi.mock('../../../services/ligasNacionales/fontventaClient', () => ({
  fetchCompeticiones: vi.fn(),
  resolveFases: vi.fn(),
  resolveGrupos: vi.fn(),
  fetchGroupData: vi.fn(),
  fetchJornadaResults: vi.fn(),
}));

import { fetchCompeticiones, resolveFases, resolveGrupos, fetchGroupData, fetchJornadaResults } from '../../../services/ligasNacionales/fontventaClient';

const FASE = { id: 'f1', nombre: 'Liga Regular' };
const GRUPO = { id: 'g1', nombre: 'Grupo A' };

function match(id: number, jornadaNumero: string, homeTeam: string): LigaMatch {
  return { id, homeTeam, awayTeam: 'Rival', homeLogo: '', awayLogo: '', date: '01/01/2026', time: '10:00', venue: 'Pab', jornadaNumero };
}

const GROUP_DATA: LigaGroupData = {
  grupo: GRUPO,
  fase: FASE,
  currentJornada: '3',
  jornadaIds: { '1': 701, '2': 702, '3': 703 },
  standings: {},
  matches: [match(1, '1', 'Aplazado FC'), match(2, '2', 'Segundo FC'), match(3, '3', 'Actual FC')],
};

async function openJornadaSelect() {
  await userEvent.click(screen.getAllByRole('combobox').find(c => /Jornada/.test(c.textContent ?? ''))!);
}

async function loadGroup() {
  render(<LigasNacionalesMatchSelector onSelectMatch={vi.fn()} onClose={vi.fn()} />);
  await userEvent.click((await screen.findAllByRole('combobox'))[0]);
  await userEvent.click(await screen.findByRole('option', { name: 'Liga X' }));
}

describe('LigasNacionalesMatchSelector jornada selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCompeticiones).mockResolvedValue([{ competicionId: 1, label: 'Liga X', logo: '' }]);
    vi.mocked(resolveFases).mockResolvedValue([FASE]);
    vi.mocked(resolveGrupos).mockResolvedValue([GRUPO]);
    vi.mocked(fetchGroupData).mockResolvedValue(GROUP_DATA);
    vi.mocked(fetchJornadaResults).mockResolvedValue({});
  });

  test('opens on the current jornada, not the first one, and marks it in the dropdown', async () => {
    await loadGroup();

    expect(await screen.findByText('Actual FC vs Rival')).toBeInTheDocument();
    expect(screen.queryByText('Aplazado FC vs Rival')).not.toBeInTheDocument();
    await openJornadaSelect();
    expect(screen.getByRole('option', { name: 'Jornada 3 (actual)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Jornada 1' })).toBeInTheDocument();
  });

  test('shows the displayed jornada next to the last-updated caption', async () => {
    await loadGroup();
    await screen.findByText('Actual FC vs Rival');

    expect(screen.getByText(/Actualizado: .* · Jornada 3/)).toBeInTheDocument();
  });

  test('falls back to the last jornada when the current one is unknown', async () => {
    vi.mocked(fetchGroupData).mockResolvedValue({ ...GROUP_DATA, currentJornada: '' });
    await loadGroup();

    expect(await screen.findByText('Actual FC vs Rival')).toBeInTheDocument();
  });

  test('refresh keeps the jornada the operator was browsing', async () => {
    await loadGroup();
    await screen.findByText('Actual FC vs Rival');
    await openJornadaSelect();
    await userEvent.click(screen.getByRole('option', { name: 'Jornada 1' }));
    await screen.findByText('Aplazado FC vs Rival');

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => expect(fetchGroupData).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Aplazado FC vs Rival')).toBeInTheDocument();
    expect(screen.queryByText('Actual FC vs Rival')).not.toBeInTheDocument();
  });

  test('greys out and disables finished matches, showing their result', async () => {
    vi.mocked(fetchJornadaResults).mockImplementation(async (id): Promise<Record<number, LigaMatchResult>> =>
      id === 701 ? { 1: { finished: true, homeScore: 3, awayScore: 1 } } : {});
    const onSelectMatch = vi.fn();
    render(<LigasNacionalesMatchSelector onSelectMatch={onSelectMatch} onClose={vi.fn()} />);
    await userEvent.click((await screen.findAllByRole('combobox'))[0]);
    await userEvent.click(await screen.findByRole('option', { name: 'Liga X' }));
    await screen.findByText('Actual FC vs Rival');

    await openJornadaSelect();
    await userEvent.click(screen.getByRole('option', { name: 'Jornada 1' }));

    expect(await screen.findByText('FINALIZADO: 3-1')).toBeInTheDocument();
    const row = screen.getByText('Aplazado FC vs Rival').closest('[role="button"]');
    expect(row).toHaveAttribute('aria-disabled', 'true');
  });

  test('leaves unplayed matches selectable', async () => {
    vi.mocked(fetchJornadaResults).mockResolvedValue({ 3: { finished: false, homeScore: 0, awayScore: 0 } });
    await loadGroup();

    const row = (await screen.findByText('Actual FC vs Rival')).closest('[role="button"]');
    expect(row).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByText(/FINALIZADO/)).not.toBeInTheDocument();
  });

  test('keeps every match selectable when the results request fails', async () => {
    vi.mocked(fetchJornadaResults).mockRejectedValue(new Error('boom'));
    await loadGroup();

    const row = (await screen.findByText('Actual FC vs Rival')).closest('[role="button"]');
    await waitFor(() => expect(fetchJornadaResults).toHaveBeenCalled());
    expect(row).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('requests the results of the selected jornada and forces a refetch on refresh', async () => {
    // A forced fetchGroupData returns a fresh object, as the real client does.
    vi.mocked(fetchGroupData).mockImplementation(async () => ({ ...GROUP_DATA }));
    await loadGroup();
    await screen.findByText('Actual FC vs Rival');
    await waitFor(() => expect(fetchJornadaResults).toHaveBeenCalledWith(703, false));

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => expect(fetchJornadaResults).toHaveBeenCalledWith(703, true));
  });
});
