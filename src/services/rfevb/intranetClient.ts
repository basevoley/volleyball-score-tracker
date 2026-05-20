import type { RfevbTeam, RfevbMatch, RfevbTeamStats, ParticipantRef } from './types';
import { SOCKET_SERVER_URL } from '../../config';

export const RFEVB_BASE = 'https://intranet.rfevb.com/rfevbcom/includes-html/competiciones';
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function esvoleyUrl(path: string): string {
  return `${SOCKET_SERVER_URL}/proxy/esvoley?path=${encodeURIComponent(path)}`;
}

export function parseParticipantRef(raw: string): ParticipantRef {
  const winnerMatch = raw.match(/ganador\s+(\d+)/i);
  if (winnerMatch) return { type: 'winner', matchId: parseInt(winnerMatch[1], 10) };

  const loserMatch = raw.match(/perdedor\s+(\d+)/i);
  if (loserMatch) return { type: 'loser', matchId: parseInt(loserMatch[1], 10) };

  const groupPosMatch = raw.match(/#[=\s]*(\d+)\s+grupo\s+([A-H])/i);
  if (groupPosMatch) return { type: 'groupPosition', position: parseInt(groupPosMatch[1], 10), group: groupPosMatch[2].toUpperCase() };

  const teamKeyMatch = raw.match(/^([A-H][1-4])$/i);
  if (teamKeyMatch) return { type: 'team', groupKey: raw.toUpperCase() };

  if (raw) return { type: 'name', name: raw };
  return { type: 'unknown', raw };
}

// groupKeyStrategy receives the row's cells and the already-accumulated teams array.
// Return null to skip the row; return a string to use it as the groupKey.
// Default (rfevb): reads cells[3] as the group key letter+number (e.g. "A1").
export function parseTeamsHtml(
  html: string,
  groupKeyStrategy?: (cells: NodeListOf<Element>, teams: RfevbTeam[]) => string | null,
): RfevbTeam[] {
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
    if (!name) return;

    const groupKey = groupKeyStrategy
      ? groupKeyStrategy(cells, teams)
      : (cells[3].textContent?.trim() ?? '') || null;

    if (!groupKey) return;

    teams.push({ groupKey, name, logoUrl });
  });

  return teams;
}

export function parseMatchesHtml(html: string): RfevbMatch[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('tbody tr');
  const matches: RfevbMatch[] = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 5) return;

    const id = parseInt(cells[0].textContent?.trim() ?? '0', 10);
    if (!id) return;

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

export function parsePhaseMatchesHtml(html: string, phaseName: string): {
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

    card.querySelectorAll('table[width="80%"] tbody tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 12) return;
      const ranking = parseInt(cells[0].textContent?.trim() ?? '0', 10);
      const nameRaw = (cells[1].textContent?.trim() ?? '').replace(/\s*\([^)]*\)\s*$/, '');
      const name = nameRaw.toLowerCase();
      const pts = parseInt(cells[2].textContent?.trim() ?? '0', 10);
      const j   = parseInt(cells[3].textContent?.trim() ?? '0', 10);
      const g3  = parseInt(cells[4].textContent?.trim() ?? '0', 10);
      const g2  = parseInt(cells[5].textContent?.trim() ?? '0', 10);
      const p1  = parseInt(cells[6].textContent?.trim() ?? '0', 10);
      const p0  = parseInt(cells[7].textContent?.trim() ?? '0', 10);
      const sf  = parseInt(cells[8].textContent?.trim() ?? '0', 10);
      const sc  = parseInt(cells[9].textContent?.trim() ?? '0', 10);
      const pf  = parseInt(cells[10].textContent?.trim() ?? '0', 10);
      const pc  = parseInt(cells[11].textContent?.trim() ?? '0', 10);
      void sf; void sc;
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
      }
    });
  });

  return { matchLabels, standings };
}

export async function fetchCompetitionById(
  competitionId: string,
  phases: Array<{ id: string; name: string }>,
  options?: {
    groupKeyStrategy?: (cells: NodeListOf<Element>, teams: RfevbTeam[]) => string | null;
  },
): Promise<{ teams: RfevbTeam[]; matches: RfevbMatch[]; standings: Record<string, RfevbTeamStats> }> {
  // Phases with no numeric id have no fetchable campeonatosFase data
  const fetchablePhases = phases.filter(p => /^\d+$/.test(p.id));

  const [teamsHtml, matchesHtml, ...phaseHtmls] = await Promise.all([
    fetch(`${RFEVB_BASE}/webCompeticion-equipos.php?IdCompeticion=${competitionId}`).then(r => r.text()),
    fetch(`${RFEVB_BASE}/webCompeticion-encuentros.php?IdCompeticion=${competitionId}`).then(r => r.text()),
    ...fetchablePhases.map(p =>
      fetch(`${RFEVB_BASE}/webCompeticion-campeonatosFase.php?auxIdFase=${p.id}`).then(r => r.text())
    ),
  ]);

  const teams = parseTeamsHtml(teamsHtml, options?.groupKeyStrategy);
  const matches = parseMatchesHtml(matchesHtml);

  const phaseLabelMap = new Map<number, string>();
  const allStandings: Record<string, RfevbTeamStats> = {};
  phaseHtmls.forEach((html, i) => {
    const { matchLabels, standings } = parsePhaseMatchesHtml(html, fetchablePhases[i].name);
    matchLabels.forEach(({ matchId, phaseLabel }) => phaseLabelMap.set(matchId, phaseLabel));
    Object.assign(allStandings, standings);
  });
  matches.forEach(m => {
    if (phaseLabelMap.has(m.id)) m.phaseLabel = phaseLabelMap.get(m.id)!;
  });

  return { teams, matches, standings: allStandings };
}
