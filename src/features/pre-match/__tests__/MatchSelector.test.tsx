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
  };
  const BUNDLE_ENDPOINTS = ['getJornadaActualGrupo', 'getClasificacionGrupo', 'getPartidosByJornada'];

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
