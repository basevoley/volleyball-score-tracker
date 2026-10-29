import type { TeamCompetitionStats } from '../../types';

export interface LigaCompetition {
  competicionId: number;
  label: string;
  logo: string; // '' if not found — the Fontventa API has no logo field, resolved separately (see logos.ts)
}

export interface LigaFase {
  id: string;
  nombre: string;
}

export interface LigaGrupo {
  id: string;
  nombre: string;
}

export interface LigaMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  date: string;
  time: string;
  venue: string;
  jornadaNumero: string;
}

// The calendar endpoint carries no result data; it comes from getPartidosByJornada (see
// fetchJornadaResults) and is overlaid on LigaMatch by id.
export interface LigaMatchResult {
  finished: boolean;
  homeScore: number;
  awayScore: number;
}

export interface LigaStanding {
  team: string;
  logo: string;
  stats: TeamCompetitionStats;
}

export interface LigaGroupData {
  grupo: LigaGrupo;
  fase: LigaFase;
  matches: LigaMatch[];
  currentJornada: string; // jornada number the federation considers current; '' if unknown
  jornadaIds: Record<string, number>; // jornada number -> API jornada id (needed for per-jornada results)
  standings: Record<string, LigaStanding>; // keyed by team name, trimmed + lowercased
}
