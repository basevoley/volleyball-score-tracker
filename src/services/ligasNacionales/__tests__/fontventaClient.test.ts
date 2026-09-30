import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchCompeticiones, resolveFases, resolveGrupos, fetchGroupData } from '../fontventaClient';

function jsonResponse(content: unknown) {
  return Promise.resolve({ json: () => Promise.resolve({ content }) } as Response);
}

function textResponse(text: string) {
  return Promise.resolve({ text: () => Promise.resolve(text) } as Response);
}

// The logo lookup (a separate esvoley.es HTML page fetch) runs concurrently with the
// getTiposCompeticion/getCompeticiones cascade — dispatch by URL instead of assuming call order.
function tarjeta(name: string, src: string): string {
  return `<div class="tarjeta"><div class="logotipo"><img src="${src}" /></div><div class="texto"><div class="nombre">${name}</div></div></div>`;
}

describe('fetchCompeticiones', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('resolves the "Competiciones Nacionales" tipo by name, merges in logos, and returns competitions with live names', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('getTiposCompeticion')) {
        return jsonResponse([
          { id: '3', nombre: 'Competiciones Nacionales' },
          { id: '7', nombre: 'Campeonatos de España Clubes' },
        ]);
      }
      if (url.includes('getCompeticiones?')) {
        return jsonResponse([
          { id: '19', nombre_comp: 'PRIMERA DIVISION FEMENINA ' },
          { id: '3', nombre_comp: 'LIGA IBERDROLA' },
        ]);
      }
      if (url.includes('proxy/esvoley')) {
        return textResponse(`<html><body>${tarjeta('Primera División Femenina', '/media/x/pdf.svg')}${tarjeta('Liga Iberdrola', '/media/y/li.svg')}</body></html>`);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const competiciones = await fetchCompeticiones();

    expect(competiciones).toEqual([
      { competicionId: 19, label: 'PRIMERA DIVISION FEMENINA', logo: 'https://esvoley.es/media/x/pdf.svg' },
      { competicionId: 3, label: 'LIGA IBERDROLA', logo: 'https://esvoley.es/media/y/li.svg' },
    ]);
  });

  test('falls back to an empty logo when the logo page has no matching card', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('getTiposCompeticion')) return jsonResponse([{ id: '3', nombre: 'Competiciones Nacionales' }]);
      if (url.includes('getCompeticiones?')) return jsonResponse([{ id: '19', nombre_comp: 'PRIMERA DIVISION FEMENINA' }]);
      if (url.includes('proxy/esvoley')) return textResponse('<html><body></body></html>');
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const competiciones = await fetchCompeticiones(true); // forceRefresh — avoid the previous test's cache
    expect(competiciones).toEqual([{ competicionId: 19, label: 'PRIMERA DIVISION FEMENINA', logo: '' }]);
  });

  test('throws if "Competiciones Nacionales" is missing from getTiposCompeticion', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([{ id: '7', nombre: 'Otra cosa' }]));
    vi.stubGlobal('fetch', fetchMock);

    // forceRefresh: true — otherwise this would hit the previous test's cached success
    await expect(fetchCompeticiones(true)).rejects.toThrow();
  });
});

describe('resolveFases', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('walks the temporada -> fase cascade and returns every fase found', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([{ id: '21', nombre: 'ÚNICA' }]))
      .mockResolvedValueOnce(jsonResponse([
        { id: '108', nombre: 'Liga Regular' },
        { id: '109', nombre: 'Playoff Ascenso' },
      ]));
    vi.stubGlobal('fetch', fetchMock);

    const fases = await resolveFases(19);

    expect(fases).toEqual([
      { id: '108', nombre: 'Liga Regular' },
      { id: '109', nombre: 'Playoff Ascenso' },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('getCompeticionesTemporada?competicionId=19');
    expect(fetchMock.mock.calls[1][0]).toContain('getFasesCompeticion?competicionTemporadaId=21');
  });

  test('returns an empty list when a competition has no current temporada', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const fases = await resolveFases(999);

    expect(fases).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('resolveGrupos', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('fetches the groups for a given faseId', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([
      { id: '234', nombre: 'GRUPO A' },
      { id: '235', nombre: 'GRUPO B' },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const grupos = await resolveGrupos('108');

    expect(grupos).toEqual([
      { id: '234', nombre: 'GRUPO A' },
      { id: '235', nombre: 'GRUPO B' },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain('getGruposCompeticion?faseId=108');
  });
});

describe('fetchGroupData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('flattens jornadas into matches, carries the fase through, and converts standings fields to numbers', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([
        {
          numero: '1',
          partidos: [{
            id: 2138, fecha: '03/10/2026', hora: '16:00', pabellon: 'FADURA',
            equipo_local: 'Getxoko Aixerrota BKT', equipo_visitante: 'CAEP Soria',
            img_local: 'https://example.com/local.png', img_visitante: 'https://example.com/visit.png',
          }],
        },
      ]))
      .mockResolvedValueOnce(jsonResponse([
        {
          nombre: 'ARENAL  EMEVÉ', imagen: 'https://example.com/logo.png',
          posicion: '1', puntos: '15', jugados: '5', ganados: '5', ganados3: '5', ganados2: '0',
          perdidos: '0', perdidos1: '0', perdidos0: '0', puntos_a_favor: '379', puntos_en_contra: '264',
        },
      ]));
    vi.stubGlobal('fetch', fetchMock);

    const fase = { id: '108', nombre: 'Liga Regular' };
    const data = await fetchGroupData({ id: '234', nombre: 'GRUPO A' }, fase);

    expect(data.fase).toEqual(fase);
    expect(data.matches).toEqual([{
      id: 2138,
      homeTeam: 'Getxoko Aixerrota BKT',
      awayTeam: 'CAEP Soria',
      homeLogo: 'https://example.com/local.png',
      awayLogo: 'https://example.com/visit.png',
      date: '03/10/2026',
      time: '16:00',
      venue: 'FADURA',
      jornadaNumero: '1',
    }]);

    const standing = data.standings['arenal  emevé'];
    expect(standing).toBeDefined();
    expect(standing.stats).toEqual({
      ranking: 1, competitionPoints: 15, matchesPlayed: 5, totalMatchesWon: 5, won3Points: 5,
      won2Points: 0, totalMatchesLost: 0, lost1Point: 0, lost0Points: 0, totalPointsScored: 379, totalPointsReceived: 264,
    });
  });

  test('serves a second call for the same grupo from cache instead of refetching', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const grupo = { id: 'cache-test-1', nombre: 'GRUPO A' };
    const fase = { id: '108', nombre: 'Liga Regular' };

    const first = await fetchGroupData(grupo, fase);
    const second = await fetchGroupData(grupo, fase);

    expect(second).toBe(first); // same cached object, not just equal
    expect(fetchMock).toHaveBeenCalledTimes(2); // one round-trip (jornadas + clasificacion), not two
  });

  test('bypasses the cache when forceRefresh is true', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const grupo = { id: 'cache-test-2', nombre: 'GRUPO A' };
    const fase = { id: '108', nombre: 'Liga Regular' };

    await fetchGroupData(grupo, fase);
    await fetchGroupData(grupo, fase, true);

    expect(fetchMock).toHaveBeenCalledTimes(4); // two full round-trips
  });
});
