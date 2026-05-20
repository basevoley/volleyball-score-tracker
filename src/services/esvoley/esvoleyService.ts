import type { RfevbCompetitionData } from '../rfevb/types';
import { CACHE_TTL_MS, esvoleyUrl, fetchCompetitionById } from '../rfevb/intranetClient';

const ESVOLEY_BASE = 'https://esvoley.es';
const LIGA_PATH = '/voleibol/competiciones-femeninas/primera-division-femenina/liga-nacional-segunda-division';

const groupCache = new Map<string, { data: EsvoleyGroupData; fetchedAt: number }>();
let cachedGroups: EsvoleyGroup[] | null = null;

export interface EsvoleyGroup {
  name: string;
  path: string;
  competitionId: string;
  logoUrl: string;
  // Phases with no numeric id are display-only (Semifinales/Finales before their data is published)
  phases: Array<{ id: string; name: string }>;
}

export interface EsvoleyGroupData extends RfevbCompetitionData {
  groupName: string;
}

export async function discoverGroups(forceRefresh = false): Promise<EsvoleyGroup[]> {
  if (!forceRefresh && cachedGroups) return cachedGroups;

  const resp = await fetch(esvoleyUrl(LIGA_PATH));
  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Anchors are plain <a> with no class; group name is in the nested img alt attribute
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href*="fase-ascenso"]'));
  const groups: EsvoleyGroup[] = [];

  for (const link of links) {
    const href = link.getAttribute('href') ?? '';
    if (!href) continue;

    const imgAlt = link.querySelector('img')?.getAttribute('alt')?.trim() ?? '';
    const title = imgAlt || (href.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ?? href);

    // Logo lives in the .logo div inside the .tarjeta card that wraps this anchor
    const card = link.closest<HTMLElement>('.tarjeta');
    const rawLogoSrc = card?.querySelector<HTMLImageElement>('.logo img')?.getAttribute('src') ?? '';
    const logoUrl = rawLogoSrc
      ? (rawLogoSrc.startsWith('http') ? rawLogoSrc : `${ESVOLEY_BASE}${rawLogoSrc}`)
      : '';

    // Fetch the group's /competicion/ page to get competitionId and phase IDs
    const groupPagePath = href.endsWith('/') ? `${href}competicion/` : `${href}/competicion/`;
    let competitionId = '';
    let phases: Array<{ id: string; name: string }> = [];
    try {
      const groupResp = await fetch(esvoleyUrl(groupPagePath));
      const groupHtml = await groupResp.text();
      const groupDoc = new DOMParser().parseFromString(groupHtml, 'text/html');

      // competitionId from href="#tab-equipos-{id}"
      const equiposAnchor = groupDoc.querySelector<HTMLAnchorElement>('a[href^="#tab-equipos-"]');
      competitionId = equiposAnchor?.getAttribute('href')?.replace('#tab-equipos-', '') ?? '';

      // Bug fix 1: keep ALL named phases, not just those with numeric IDs.
      // Phases with no numeric suffix (Semifinales/Finales) are included with id=""
      // so they appear in the UI selector; fetchCompetitionById skips them when
      // building API requests (handled there by filtering on /^\d+$/).
      phases = Array.from(groupDoc.querySelectorAll<HTMLAnchorElement>('a[href^="#tab-fase"]'))
        .map(a => {
          const raw = a.getAttribute('href') ?? '';
          const id = raw.replace('#tab-fase', '');
          return { id, name: a.textContent?.trim() ?? '' };
        })
        .filter(p => p.name);
    } catch {
      // skip group if page not reachable
    }

    if (!competitionId) continue;

    groups.push({ name: title, path: href, competitionId, logoUrl, phases });
  }

  cachedGroups = groups;
  return groups;
}

export async function fetchGroupData(group: EsvoleyGroup, forceRefresh = false): Promise<EsvoleyGroupData> {
  const cacheKey = group.competitionId;
  if (!forceRefresh) {
    const cached = groupCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // groupKeyStrategy: Liga Nacional has no group-key column; use sequential numbering.
  // Bug fix 2: parseMatchesHtml in intranetClient uses parseParticipantRef by default,
  // correctly handling bracket refs (Ganador N, Perdedor N, etc.).
  const { teams, matches, standings } = await fetchCompetitionById(
    group.competitionId,
    group.phases,
    { groupKeyStrategy: (_cells, alreadyParsed) => String(alreadyParsed.length + 1) },
  );

  // Name-normalisation post-pass: canonicalise any { type: 'name' } refs whose raw
  // text differs in casing from the team name as parsed from the equipos table.
  const nameMap = new Map(teams.map(t => [t.name.trim().toLowerCase(), t.name]));
  for (const m of matches) {
    for (const side of ['homeRef', 'awayRef'] as const) {
      const ref = m[side];
      if (ref.type === 'name') {
        const canonical = nameMap.get(ref.name.trim().toLowerCase());
        if (canonical) m[side] = { type: 'name', name: canonical };
      }
    }
  }

  const data: EsvoleyGroupData = {
    competitionId: group.competitionId,
    name: group.name,
    logoUrl: group.logoUrl,
    teams,
    matches,
    standings,
    groupName: group.name,
  };

  groupCache.set(cacheKey, { data, fetchedAt: Date.now() });
  return data;
}
