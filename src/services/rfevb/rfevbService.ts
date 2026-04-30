import type { RfevbTeam, RfevbMatch, RfevbCompetitionData, RfevbTeamStats, ParticipantRef, Sex } from './types';
import { SOCKET_SERVER_URL } from '../../config';

const RFEVB_BASE = 'https://intranet.rfevb.com/rfevbcom/includes-html/competiciones';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const competitionCache = new Map<string, { data: RfevbCompetitionData; fetchedAt: number }>();

// esvoley.es does not send CORS headers, so we route those fetches through
// the socket server proxy which adds the appropriate headers.
function esvoleyUrl(path: string): string {
    return `${SOCKET_SERVER_URL}/proxy/esvoley?path=${encodeURIComponent(path)}`;
}

function parseParticipantRef(raw: string): ParticipantRef {
  // "# Ganador 49"  →  winner of match 49
  const winnerMatch = raw.match(/ganador\s+(\d+)/i);
  if (winnerMatch) return { type: 'winner', matchId: parseInt(winnerMatch[1], 10) };

  // "# Perdedor 49"  →  loser of match 49
  const loserMatch = raw.match(/perdedor\s+(\d+)/i);
  if (loserMatch) return { type: 'loser', matchId: parseInt(loserMatch[1], 10) };

  // "#= 1 Grupo A"  →  1st place of group A
  const groupPosMatch = raw.match(/#[=\s]*(\d+)\s+grupo\s+([A-H])/i);
  if (groupPosMatch) return { type: 'groupPosition', position: parseInt(groupPosMatch[1], 10), group: groupPosMatch[2].toUpperCase() };

  // "A1", "B3", etc.  →  direct team key (from equipos table, td with group key)
  const teamKeyMatch = raw.match(/^([A-H][1-4])$/i);
  if (teamKeyMatch) return { type: 'team', groupKey: raw.toUpperCase() };

  // Anything unrecognised is treated as a literal team name (primera fase encounters)
  if (raw) return { type: 'name', name: raw };
  return { type: 'unknown', raw };
}

function parseTeamsHtml(html: string): RfevbTeam[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('tbody tr');
  const teams: RfevbTeam[] = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 4) return;

    const imgEl = cells[1].querySelector('img');
    const rawLogoUrl = imgEl?.getAttribute('src') ?? '';
    const logoUrl = rawLogoUrl.replace(/^http:\/\//i, 'https://');

    const name = (cells[2].textContent?.trim() ?? '').replace(/\s*\([^)]*\)\s*$/, '');
    const groupKey = cells[3].textContent?.trim() ?? '';

    if (name && groupKey) {
      teams.push({ groupKey, name, logoUrl });
    }
  });

  return teams;
}

function parseMatchesHtml(html: string): RfevbMatch[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('tbody tr');
  const matches: RfevbMatch[] = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 5) return;

    const id = parseInt(cells[0].textContent?.trim() ?? '0', 10);
    if (!id) return;

    // Participants: two lines in cells[1] separated by <br>
    const participantHtml = cells[1].innerHTML;
    const parts = participantHtml.split(/<br\s*\/?>/i).map(p => {
      const tmp = document.createElement('div');
      tmp.innerHTML = p.replace(/&num;/g, '#').replace(/&equals;/g, '=').replace(/&period;/g, '.').replace(/&amp;/g, '&');
      return tmp.textContent?.trim() ?? '';
    }).filter(Boolean);

    const homeRef = parseParticipantRef(parts[0] ?? '');
    const awayRef = parseParticipantRef(parts[1] ?? '');

    const venue = cells[2].textContent?.trim().replace(/Pol\.\s*/g, 'Polideportivo ') ?? '';

    const dateTimeParts = cells[3].innerHTML.split(/<br\s*\/?>/i).map(p => p.trim()).filter(Boolean);
    const date = dateTimeParts[0] ?? '';
    const time = dateTimeParts[1] ?? '';

    const scoreParts = cells[4].innerHTML.split(/<br\s*\/?>/i).map(p => {
      const tmp = document.createElement('div');
      tmp.innerHTML = p;
      return tmp.textContent?.trim() ?? '';
    }).filter(Boolean);
    const homeScore = parseInt(scoreParts[0] ?? '0', 10);
    const awayScore = parseInt(scoreParts[1] ?? '0', 10);

    matches.push({ id, homeRef, awayRef, venue, date, time, phaseLabel: '', homeScore, awayScore });
  });

  return matches;
}

function parsePhaseMatchesHtml(html: string, phaseName: string): {
  matchLabels: Array<{ matchId: number; phaseLabel: string }>;
  standings: Record<string, RfevbTeamStats>;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const matchLabels: Array<{ matchId: number; phaseLabel: string }> = [];
  const standings: Record<string, RfevbTeamStats> = {};

  doc.querySelectorAll('.card').forEach(card => {
    const groupLabel = card.querySelector('h4')?.textContent?.trim() ?? '';
    const phaseLabel = groupLabel ? `${phaseName} · ${groupLabel}` : phaseName;

    card.querySelectorAll('table.table tr').forEach(row => {
      const th = row.querySelector('th');
      if (!th) return;
      const matchId = parseInt(th.textContent?.trim() ?? '0', 10);
      if (matchId) matchLabels.push({ matchId, phaseLabel });
    });

    // Standings table: width="80%" (no class), tbody rows have 12 cells
    card.querySelectorAll('table[width="80%"] tbody tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 12) return;
      const ranking = parseInt(cells[0].textContent?.trim() ?? '0', 10);
      const nameRaw = (cells[1].textContent?.trim() ?? '').replace(/\s*\([^)]*\)\s*$/, '');
      const name = nameRaw.toLowerCase();
      const pts   = parseInt(cells[2].textContent?.trim() ?? '0', 10);
      const j     = parseInt(cells[3].textContent?.trim() ?? '0', 10);
      const g3    = parseInt(cells[4].textContent?.trim() ?? '0', 10);
      const g2    = parseInt(cells[5].textContent?.trim() ?? '0', 10);
      const p1    = parseInt(cells[6].textContent?.trim() ?? '0', 10);
      const p0    = parseInt(cells[7].textContent?.trim() ?? '0', 10);
      const sf    = parseInt(cells[8].textContent?.trim() ?? '0', 10);
      const sc    = parseInt(cells[9].textContent?.trim() ?? '0', 10);
      const pf    = parseInt(cells[10].textContent?.trim() ?? '0', 10);
      const pc    = parseInt(cells[11].textContent?.trim() ?? '0', 10);
      if (name) {
        standings[name] = {
          ranking,
          competitionPoints: pts,
          matchesPlayed: j,
          totalMatchesWon: g3 + g2,
          won3Points: g3,
          won2Points: g2,
          totalMatchesLost: p1 + p0,
          lost1Point: p1,
          lost0Points: p0,
          totalPointsScored: pf,
          totalPointsReceived: pc,
        };
        // SF/SC are sets scored/conceded — not in TeamCompetitionStats, ignored for now
        void sf; void sc;
      }
    });
  });

  return { matchLabels, standings };
}

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

  const [teamsHtml, matchesHtml, ...phaseHtmls] = await Promise.all([
    fetch(`${RFEVB_BASE}/webCompeticion-equipos.php?IdCompeticion=${competitionId}`).then(r => r.text()),
    fetch(`${RFEVB_BASE}/webCompeticion-encuentros.php?IdCompeticion=${competitionId}`).then(r => r.text()),
    ...phases.map(p =>
      fetch(`${RFEVB_BASE}/webCompeticion-campeonatosFase.php?auxIdFase=${p.id}`).then(r => r.text())
    ),
  ]);

  const teams = parseTeamsHtml(teamsHtml);
  const matches = parseMatchesHtml(matchesHtml);

  const phaseLabelMap = new Map<number, string>();
  const allStandings: Record<string, RfevbTeamStats> = {};
  phaseHtmls.forEach((html, i) => {
    const { matchLabels, standings } = parsePhaseMatchesHtml(html, phases[i].name);
    matchLabels.forEach(({ matchId, phaseLabel }) => phaseLabelMap.set(matchId, phaseLabel));
    Object.assign(allStandings, standings);
  });
  matches.forEach(m => {
    if (phaseLabelMap.has(m.id)) m.phaseLabel = phaseLabelMap.get(m.id)!;
  });

  const pageDoc = new DOMParser().parseFromString(pageHtml, 'text/html');
  const name = pageDoc.querySelector('.h5')?.textContent?.trim()
    ?? `Campeonato de España ${sex} ${year}`;

  const horizontalRfevbLogoUrl = "https://madridbeachvolley.com/media/a1we2l4c/esvoley-horizontal_rgb_recorte.png";
  const result: RfevbCompetitionData = { competitionId, name, logoUrl: horizontalRfevbLogoUrl /*logoUrl*/, teams, matches, standings: allStandings };
  competitionCache.set(cacheKey, { data: result, fetchedAt: Date.now() });
  return result;
}
