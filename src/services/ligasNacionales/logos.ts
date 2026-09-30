import { esvoleyUrl } from '../rfevb/intranetClient';

// The Fontventa JSON API has no competition-logo field anywhere (checked getDatosGrupoCompeticion,
// getCompeticiones, getGruposCompeticion). Every esvoley.es page embeds a sitewide "Competiciones"
// menu grid with each league's own logo though — one HTML fetch (via the esvoley proxy, same as
// RfevbMatchSelector/EsvoleyMatchSelector already use, since esvoley.es pages have no CORS) gets
// logos for every competition at once.
const LOGOS_PAGE_PATH = '/voleibol/competiciones-femeninas';

// Logos are static sponsor assets — essentially never change within a session, cache generously.
const LOGO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let logosCache: { logosByName: Map<string, string>; fetchedAt: number } | null = null;

// Order-independent, accent-insensitive token match — the API's "SUPERLIGA FEMENINA 2" and the
// site's "Superliga 2 Femenina" have the same words in a different order.
function normalize(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip combining diacritics (á -> a, ó -> o, ...)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

async function scrapeLogos(): Promise<Map<string, string>> {
  const response = await fetch(esvoleyUrl(LOGOS_PAGE_PATH));
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const logosByName = new Map<string, string>();
  doc.querySelectorAll<HTMLElement>('.tarjeta').forEach(card => {
    const name = card.querySelector('.texto .nombre')?.textContent?.trim();
    const rawSrc = card.querySelector<HTMLImageElement>('.logotipo img')?.getAttribute('src');
    if (!name || !rawSrc) return;
    const url = rawSrc.startsWith('http') ? rawSrc : `https://esvoley.es${rawSrc}`;
    logosByName.set(normalize(name), url);
  });
  return logosByName;
}

// Returns the full name -> logo URL map from a single page fetch (cached) — look up individual
// competitions with lookupCompetitionLogo rather than calling this once per competition, or
// concurrent calls before the cache is warm will each trigger their own redundant page fetch.
export async function fetchCompetitionLogos(forceRefresh = false): Promise<Map<string, string>> {
  if (!forceRefresh && logosCache && Date.now() - logosCache.fetchedAt < LOGO_CACHE_TTL_MS) {
    return logosCache.logosByName;
  }
  const logosByName = await scrapeLogos();
  logosCache = { logosByName, fetchedAt: Date.now() };
  return logosByName;
}

export function lookupCompetitionLogo(logosByName: Map<string, string>, label: string): string {
  return logosByName.get(normalize(label)) ?? '';
}
