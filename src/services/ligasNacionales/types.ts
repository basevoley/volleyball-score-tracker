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

export interface LigaStanding {
  team: string;
  logo: string;
  stats: TeamCompetitionStats;
}

export interface LigaGroupData {
  grupo: LigaGrupo;
  fase: LigaFase;
  matches: LigaMatch[];
  standings: Record<string, LigaStanding>; // keyed by team name, trimmed + lowercased
}
