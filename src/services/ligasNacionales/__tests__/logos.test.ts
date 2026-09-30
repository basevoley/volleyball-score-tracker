import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchCompetitionLogos, lookupCompetitionLogo } from '../logos';

function textResponse(text: string) {
  return Promise.resolve({ text: () => Promise.resolve(text) } as Response);
}

function tarjeta(name: string, src: string): string {
  return `<div class="tarjeta"><div class="logotipo"><img src="${src}" /></div><div class="texto"><div class="nombre">${name}</div></div></div>`;
}

const PAGE_HTML = `<html><body>
  ${tarjeta('Liga Iberdrola', '/media/x/liga-iberdrola.svg')}
  ${tarjeta('Superliga 2 Femenina', '/media/y/superliga-2-femenina.svg')}
  ${tarjeta('Primera División Femenina', '/media/z/primera-division-femenina.svg')}
  ${tarjeta('Sin logo', '')}
</body></html>`;

describe('fetchCompetitionLogos / lookupCompetitionLogo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('parses every .tarjeta card into an absolute logo URL', async () => {
    vi.stubGlobal('fetch', vi.fn(() => textResponse(PAGE_HTML)));

    const logos = await fetchCompetitionLogos(true);

    expect(lookupCompetitionLogo(logos, 'LIGA IBERDROLA')).toBe('https://esvoley.es/media/x/liga-iberdrola.svg');
  });

  test('matches names regardless of accents', async () => {
    vi.stubGlobal('fetch', vi.fn(() => textResponse(PAGE_HTML)));

    const logos = await fetchCompetitionLogos(true);

    // API sends unaccented "DIVISION"; the page has accented "División".
    expect(lookupCompetitionLogo(logos, 'PRIMERA DIVISION FEMENINA')).toBe('https://esvoley.es/media/z/primera-division-femenina.svg');
  });

  test('matches names regardless of word order', async () => {
    vi.stubGlobal('fetch', vi.fn(() => textResponse(PAGE_HTML)));

    const logos = await fetchCompetitionLogos(true);

    // API says "SUPERLIGA FEMENINA 2"; the page's card says "Superliga 2 Femenina".
    expect(lookupCompetitionLogo(logos, 'SUPERLIGA FEMENINA 2')).toBe('https://esvoley.es/media/y/superliga-2-femenina.svg');
  });

  test('returns an empty string for a competition with no matching card', async () => {
    vi.stubGlobal('fetch', vi.fn(() => textResponse(PAGE_HTML)));

    const logos = await fetchCompetitionLogos(true);

    expect(lookupCompetitionLogo(logos, 'SUPERLIGA MASCULINA')).toBe('');
  });

  test('serves a second call from cache instead of refetching', async () => {
    const fetchMock = vi.fn(() => textResponse(PAGE_HTML));
    vi.stubGlobal('fetch', fetchMock);

    await fetchCompetitionLogos(true); // seed with a forced fetch
    await fetchCompetitionLogos(); // should hit the cache

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
