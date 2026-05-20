import type { RfevbCompetitionData, Sex } from './types';
import { CACHE_TTL_MS, esvoleyUrl, fetchCompetitionById } from './intranetClient';

const competitionCache = new Map<string, { data: RfevbCompetitionData; fetchedAt: number }>();

export async function discoverCompetitionUrl(categorySlug: string, sex: Sex, year: number): Promise<{ path: string; logoUrl: string } | null> {
  const resp = await fetch(esvoleyUrl(`/voleibol/competiciones-de-menores/campeonatos-de-espana-clubes/${categorySlug}`));
  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a.coverLink'));

  for (const link of links) {
    const href = link.getAttribute('href') ?? '';
    const card = link.closest('.tarjeta');
    const title = card?.querySelector('.h5')?.textContent ?? '';
    if (href.includes(String(year)) && title.toLowerCase().includes(sex.toLowerCase())) {
      const imgEl = card?.querySelector<HTMLImageElement>('.logo img');
      const rawSrc = imgEl?.getAttribute('src') ?? '';
      const logoUrl = rawSrc ? (rawSrc.startsWith('http') ? rawSrc : `https://esvoley.es${rawSrc}`) : '';
      const path = href.endsWith('/') ? `${href}encuentros` : `${href}/encuentros`;
      return { path, logoUrl };
    }
  }

  return null;
}

async function discoverCompetitionIds(competitionPagePath: string): Promise<{ competitionId: string; phases: Array<{ id: string; name: string }> }> {
  const resp = await fetch(esvoleyUrl(competitionPagePath));
  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const competitionIdEl = doc.getElementById('auxIdCompeticion') as HTMLInputElement | null;
  const competitionId = competitionIdEl?.value ?? '';

  const phases = Array.from(doc.querySelectorAll<HTMLElement>('[data-action="fase"]'))
    .map(el => ({ id: el.getAttribute('data-id') ?? '', name: el.textContent?.trim() ?? '' }))
    .filter(p => p.id);

  return { competitionId, phases };
}

export async function fetchCompetitionData(categorySlug: string, sex: Sex, year: number, forceRefresh = false): Promise<RfevbCompetitionData> {
  const cacheKey = `${categorySlug}:${sex}:${year}`;
  if (!forceRefresh) {
    const cached = competitionCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const discovered = await discoverCompetitionUrl(categorySlug, sex, year);
  if (!discovered) {
    throw new Error(`No se encontró la competición ${sex} de ${categorySlug} para ${year}`);
  }
  const { path: competitionPagePath, logoUrl } = discovered;

  const [{ competitionId, phases }, pageHtml] = await Promise.all([
    discoverCompetitionIds(competitionPagePath),
    fetch(esvoleyUrl(competitionPagePath)).then(r => r.text()),
  ]);

  const { teams, matches, standings } = await fetchCompetitionById(competitionId, phases);

  const pageDoc = new DOMParser().parseFromString(pageHtml, 'text/html');
  const name = pageDoc.querySelector('.h5')?.textContent?.trim()
    ?? `Campeonato de España ${sex} ${year}`;

  const horizontalRfevbLogoUrl = "https://madridbeachvolley.com/media/a1we2l4c/esvoley-horizontal_rgb_recorte.png";
  const result: RfevbCompetitionData = { competitionId, name, logoUrl: horizontalRfevbLogoUrl /*logoUrl*/, teams, matches, standings };
  competitionCache.set(cacheKey, { data: result, fetchedAt: Date.now() });
  return result;
}
