export interface RfevbTeam {
  groupKey: string; // e.g. "A1", "H4"
  name: string;
  logoUrl: string;
}

export type ParticipantRef =
  | { type: 'team'; groupKey: string }
  | { type: 'name'; name: string }
  | { type: 'groupPosition'; position: number; group: string }
  | { type: 'winner'; matchId: number }
  | { type: 'loser'; matchId: number }
  | { type: 'unknown'; raw: string };

export interface RfevbMatch {
  id: number;
  homeRef: ParticipantRef;
  awayRef: ParticipantRef;
  venue: string;
  date: string; // DD/MM/YY
  time: string; // HH:MM
  phaseLabel: string;
  homeScore: number;
  awayScore: number;
}

export interface RfevbTeamStats {
  ranking: number;
  competitionPoints: number;
  matchesPlayed: number;
  totalMatchesWon: number;
  won3Points: number;
  won2Points: number;
  totalMatchesLost: number;
  lost1Point: number;
  lost0Points: number;
  totalPointsScored: number;
  totalPointsReceived: number;
}

export interface RfevbCompetitionData {
  competitionId: string;
  name: string;
  logoUrl: string;
  teams: RfevbTeam[];
  matches: RfevbMatch[];
  standings: Record<string, RfevbTeamStats>; // key: lowercase team name
}

export interface CategoryOption {
  label: string;
  slug: string;
}

export const CATEGORIES: CategoryOption[] = [
  { label: 'Benjamín',  slug: 'benjamin' },
  { label: 'Alevín',    slug: 'alevin' },
  { label: 'Infantil',  slug: 'infantil' },
  { label: 'Cadete',    slug: 'cadete' },
  { label: 'Juvenil',   slug: 'juvenil' },
  { label: 'Júnior',    slug: 'junior' },
];

export type Sex = 'Femenino' | 'Masculino';
