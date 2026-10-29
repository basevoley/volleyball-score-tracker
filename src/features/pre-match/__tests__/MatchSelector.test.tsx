import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchSelector from '../MatchSelector';

function jsonResponse(content: unknown) {
  return Promise.resolve({ json: () => Promise.resolve({ content }) } as Response);
}

function endpointFromUrl(url: string): string {
  return url.split('/competiciones/')[1]?.split('?')[0] ?? '';
}

const SINGLE_OPTION_FIXTURES: Record<string, unknown> = {
  getTiposCompeticion: [{ id: 1, nombre: 'Tipo Único' }],
  getCompeticiones: [{ id: 2, nombre_comp: 'Categoría Única', categoria_sexo: 'Senior F' }],
  getCompeticionesTemporada: [{ id: 3, nombre: 'División Única' }],
  getFasesCompeticion: [{ id: 4, nombre: 'Fase Única' }],
  getGruposCompeticion: [{ id: 5, nombre: 'Grupo Único' }],
  getJornadaActualGrupo: { id: 10, numero: 3 },
  getJornadasCalendario: [{ id: 10, numero: '3', partidos: [] }],
  getClasificacionGrupo: [
    { nombre: 'Team A', imagen: '', posicion: 1, puntos: 0, jugados: 0, ganados: 0, ganados3: 0, ganados2: 0, perdidos: 0, perdidos1: 0, perdidos0: 0, puntos_a_favor: 0, puntos_en_contra: 0 },
    { nombre: 'Team B', imagen: '', posicion: 2, puntos: 0, jugados: 0, ganados: 0, ganados3: 0, ganados2: 0, perdidos: 0, perdidos1: 0, perdidos0: 0, puntos_a_favor: 0, puntos_en_contra: 0 },
  ],
  getPartidosByJornada: [
    { id: 100, equipo_local: 'Team A', equipo_visitante: 'Team B', pabellon: 'Pabellón Test', fecha: '01/01/2026', hora: '10:00', puntos_local: 0, puntos_visitante: 0, finalizado: false },
  ],
};

describe('MatchSelector auto-advance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      const endpoint = endpointFromUrl(url);
      if (!(endpoint in SINGLE_OPTION_FIXTURES)) throw new Error(`Unexpected fetch: ${url}`);
      return jsonResponse(SINGLE_OPTION_FIXTURES[endpoint]);
    }));
  });

  test('auto-selects through every single-option level and lands on the match list with no user interaction', async () => {
    render(<MatchSelector onSelectMatch={vi.fn()} onClose={vi.fn()} />);

    expect(await screen.findByText('Team A vs Team B')).toBeInTheDocument();
  });
});

describe('MatchSelector group bundle caching', () => {
  // Distinct grupoId/jornadaId from the other describe blocks so this file's shared,
  // module-level cache can't leak a result in from an unrelated test.
  const CACHE_FIXTURES: Record<string, unknown> = {
    ...SINGLE_OPTION_FIXTURES,
    getGruposCompeticion: [{ id: 55, nombre: 'Grupo Caché' }],
    getJornadaActualGrupo: { id: 555, numero: 7 },
    getJornadasCalendario: [{ id: 555, numero: '7', partidos: [] }],
  };
  const BUNDLE_ENDPOINTS = ['getJornadaActualGrupo', 'getJornadasCalendario', 'getClasificacionGrupo', 'getPartidosByJornada'];

  function fetchImpl(url: string) {
    const endpoint = endpointFromUrl(url);
    if (!(endpoint in CACHE_FIXTURES)) throw new Error(`Unexpected fetch: ${url}`);
    return jsonResponse(CACHE_FIXTURES[endpoint]);
  }

  test('a remount for the same group is served from cache, not refetched', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchImpl));
    const { unmount } = render(<MatchSelector onSelectMatch={vi.fn()} onClose={vi.fn()} />);
    await screen.findByText('Team A vs Team B');
    unmount();

    const secondMockFetch = vi.fn((url: string) => {
      const endpoint = endpointFromUrl(url);
      if (BUNDLE_ENDPOINTS.includes(endpoint)) throw new Error(`Should be served from cache: ${url}`);
      return fetchImpl(url);
    });
    vi.stubGlobal('fetch', secondMockFetch);

    render(<MatchSelector onSelectMatch={vi.fn()} onClose={vi.fn()} />);
    expect(await screen.findByText('Team A vs Team B')).toBeInTheDocument();
  });

  test('clicking refresh bypasses the cache and refetches the bundle', async () => {
    const fetchMock = vi.fn(fetchImpl);
    vi.stubGlobal('fetch', fetchMock);

    render(<MatchSelector onSelectMatch={vi.fn()} onClose={vi.fn()} />);
    await screen.findByText('Team A vs Team B');
    const callsBeforeRefresh = fetchMock.mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => {
      const bundleCallsSinceRefresh = fetchMock.mock.calls
        .slice(callsBeforeRefresh)
        .filter(([url]) => BUNDLE_ENDPOINTS.includes(endpointFromUrl(url)));
      expect(bundleCallsSinceRefresh).toHaveLength(BUNDLE_ENDPOINTS.length);
    });
  });
});

describe('MatchSelector jornada selection', () => {
  // Distinct ids again (group 66, jornadas 701-703) to stay clear of the module-level caches.
  const MATCHES_BY_JORNADA: Record<string, unknown> = {
    '701': [{ id: 1, equipo_local: 'Team B', equipo_visitante: 'Team A', pabellon: 'Pabellón Viejo', fecha: '01/10/2026', hora: '10:00', puntos_local: 0, puntos_visitante: 0, finalizado: false }],
    '702': [],
    '703': [{ id: 3, equipo_local: 'Team A', equipo_visitante: 'Team B', pabellon: 'Pabellón Actual', fecha: '15/10/2026', hora: '10:00', puntos_local: 0, puntos_visitante: 0, finalizado: false }],
  };
  const FIXTURES: Record<string, unknown> = {
    ...SINGLE_OPTION_FIXTURES,
    getGruposCompeticion: [{ id: 66, nombre: 'Grupo Jornadas' }],
    getJornadaActualGrupo: { id: 703, numero: 3 },
    getJornadasCalendario: [
      { id: 701, numero: '1', partidos: [] },
      { id: 702, numero: '2', partidos: [] },
      { id: 703, numero: '3', partidos: [] },
    ],
  };

  function fetchImpl(url: string) {
    const endpoint = endpointFromUrl(url);
    if (endpoint === 'getPartidosByJornada') {
      return jsonResponse(MATCHES_BY_JORNADA[new URL(url).searchParams.get('jornadaId') ?? '']);
    }
    if (!(endpoint in FIXTURES)) throw new Error(`Unexpected fetch: ${url}`);
    return jsonResponse(FIXTURES[endpoint]);
  }

  async function openJornadaSelect() {
    await userEvent.click(screen.getByRole('combobox', { name: 'Jornada' }));
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(fetchImpl));
  });

  test('opens on the current jornada and marks it in the dropdown', async () => {
    render(<MatchSelector onSelectMatch={vi.fn()} onClose={vi.fn()} />);

    expect(await screen.findByText('Team A vs Team B')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Jornada' })).toHaveTextContent('Jornada 3 (actual)');
    await openJornadaSelect();
    expect(screen.getByRole('option', { name: 'Jornada 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Jornada 3 (actual)' })).toBeInTheDocument();
  });

  test('an earlier jornada can be opened and its unplayed match imported with that jornada number', async () => {
    const onSelectMatch = vi.fn();
    render(<MatchSelector onSelectMatch={onSelectMatch} onClose={vi.fn()} />);
    await screen.findByText('Team A vs Team B');

    await openJornadaSelect();
    await userEvent.click(screen.getByRole('option', { name: 'Jornada 1' }));

    await userEvent.click(await screen.findByText('Team B vs Team A'));
    expect(onSelectMatch).toHaveBeenCalledWith(expect.objectContaining({
      teamA: 'Team B',
      stadium: 'Pabellón Pabellón Viejo', // the component prefixes "Pabellón " to the API value
      extendedInfo: 'Fase Fase Única - Jornada 1',
    }));
  });

  test('refresh keeps the jornada the operator was browsing', async () => {
    render(<MatchSelector onSelectMatch={vi.fn()} onClose={vi.fn()} />);
    await screen.findByText('Team A vs Team B');
    await openJornadaSelect();
    await userEvent.click(screen.getByRole('option', { name: 'Jornada 1' }));
    await screen.findByText('Team B vs Team A');

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Jornada' })).toHaveTextContent('Jornada 1'));
    expect(await screen.findByText('Team B vs Team A')).toBeInTheDocument();
  });
});

describe('MatchSelector without auto-advance', () => {
  test('does not cascade past a level with more than one option', async () => {
    const fetchMock = vi.fn((url: string) => {
      const endpoint = endpointFromUrl(url);
      if (endpoint === 'getTiposCompeticion') {
        return jsonResponse([{ id: 1, nombre: 'Tipo A' }, { id: 2, nombre: 'Tipo B' }]);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<MatchSelector onSelectMatch={vi.fn()} onClose={vi.fn()} />);

    // Only the first level's fetch should ever fire — no cascade into getCompeticiones.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
