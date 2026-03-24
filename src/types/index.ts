// ── Core domain primitives ──────────────────────────────────────────────────

export type TeamKey = 'teamA' | 'teamB';
export type TeamRecord<T> = { teamA: T; teamB: T };

// ── Statistics ───────────────────────────────────────────────────────────────

/** Full match statistics for a single team (includes computed effectiveness fields). */
export interface TeamStats {
  serve: number;
  ace: number;
  serveError: number;
  reception: number;
  receptionError: number;
  dig: number;
  digError: number;
  attack: number;
  attackPoint: number;
  attackError: number;
  block: number;
  blockPoint: number;
  blockOut: number;
  fault: number;
  selfErrors: number;
  serviceEffectiveness: string;
  receptionEffectiveness: string;
  attackEffectiveness: string;
  defenseEffectiveness: string;
}

/** Raw per-rally stats (no computed effectiveness fields). */
export interface RallyTeamStats {
  serve: number;
  ace: number;
  serveError: number;
  reception: number;
  receptionError: number;
  dig: number;
  digError: number;
  attack: number;
  attackPoint: number;
  attackError: number;
  block: number;
  blockPoint: number;
  blockOut: number;
  fault: number;
}

// ── Match data ───────────────────────────────────────────────────────────────

export interface MatchScores {
  teamA: number;
  teamB: number;
}

export interface MatchEvent {
  type: string | null;
  details: Record<string, unknown> | null;
}

interface BaseHistoryEntry {
  index: number;
  timestamp: number;
  scores: MatchScores;
}

export interface RallyHistoryEntry extends BaseHistoryEntry {
  entryType: 'rally';
  server: TeamKey;
  faultingTeam: TeamKey | null;
  prevServer: TeamKey | null;
  rallySnapshot: RallySnapshot;
  statsUpdate: TeamRecord<RallyTeamStats>;
}

export interface TimeoutHistoryEntry extends BaseHistoryEntry {
  entryType: 'timeout';
  team: TeamKey;
}

export interface SubstitutionHistoryEntry extends BaseHistoryEntry {
  entryType: 'substitution';
  team: TeamKey;
}

export interface AdjustHistoryEntry extends BaseHistoryEntry {
  entryType: 'adjust';
  team: TeamKey;
  delta: number;
}

export type HistoryEntry = RallyHistoryEntry | TimeoutHistoryEntry | SubstitutionHistoryEntry | AdjustHistoryEntry;

export interface SetStats {
  setNumber: number;
  scores: MatchScores;
  statistics: TeamRecord<TeamStats>;
  history: HistoryEntry[];
}

export interface MatchData {
  scores: MatchScores;
  setsWon: MatchScores;
  setScores: MatchScores[];
  currentServer: TeamKey | null;
  ballPossession: TeamKey | null;
  matchStarted: boolean;
  timeouts: MatchScores;
  substitutions: MatchScores;
  statistics: TeamRecord<TeamStats>;
  currentSetStats: TeamRecord<TeamStats>;
  currentSetHistory: HistoryEntry[];
  setStats: SetStats[];
  winner: TeamKey | null;
  matchEvent: MatchEvent;
}

// ── Match details (pre-match setup) ─────────────────────────────────────────

export interface Player {
  id?: number;
  number: number;
  name: string;
  roles: string[];
}

export interface TeamCompetitionStats {
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

export interface MatchDetails {
  teams: TeamRecord<string>;
  teamLogos: TeamRecord<string>;
  teamColors: TeamRecord<string>;
  matchHeader: string;
  extendedInfo: string;
  stadium: string;
  competitionLogo: string;
  maxSets: number;
  stats: TeamRecord<TeamCompetitionStats>;
  players: TeamRecord<Player[]>;
}

// ── Overlay config ───────────────────────────────────────────────────────────

export interface SocialChannel {
  network: string;
  handle: string;
  icon: string;
}

export interface Config {
  scoreboard: { enabled: boolean; type: string; position: string; showHistory: boolean };
  matchup: { enabled: boolean };
  lowerThird: { enabled: boolean };
  socialMedia: { enabled: boolean; position: string; channels: SocialChannel[] };
  teamComparison: { enabled: boolean };
  afterMatch: { enabled: boolean; showStats: boolean };
  sponsors: { enabled: boolean; imageUrls: string[]; displayTime: number };
  subscribe: { enabled: boolean; position: string };
  lineup: { enabled: boolean; showStats: boolean };
}

// ── Automation / sequences ───────────────────────────────────────────────────

export interface ConfigChange {
  section: keyof Config;
  key: string;
  value: unknown;
}

export interface AutomationCtx {
  hasStats: boolean;
  hasPlayers: boolean;
  hasMatchStats: boolean;
}

export interface SequenceStep {
  label: string;
  changes: ConfigChange[];
  duration: number;
  loopStart?: boolean;
  condition?: (ctx: AutomationCtx) => boolean;
}

export type SequenceTriggerState = Record<string, unknown>;

export type SequenceTrigger =
  | { type: 'manual' }
  | {
      type: 'socketEvent';
      event: string;
      condition: (data: Record<string, unknown>, state: SequenceTriggerState) => boolean;
      initialState?: SequenceTriggerState;
    };

export interface Sequence {
  id: string;
  label: string;
  description: string;
  trigger: SequenceTrigger;
  defaultEnabled?: boolean;
  steps: SequenceStep[];
  snapshotSections?: (keyof Config)[];
  resetOnStop?: (keyof Config)[];
}

// ── Rally ────────────────────────────────────────────────────────────────────

export type RallyStage =
  | 'start'
  | 'afterServe'
  | 'afterReception'
  | 'afterAttack'
  | 'afterDig'
  | 'afterBlock';

export type RallyActionType =
  | 'serve'
  | 'reception'
  | 'attack'
  | 'block'
  | 'continue'
  | 'dig'
  | 'error'
  | 'fault'
  | 'point';

export interface RallyActionHistoryEntry {
  action: RallyActionType;
  team: TeamKey;
  rallyStage: RallyStage;
  previousPossession: TeamKey | null;
}

export interface RallySnapshot {
  id: number;
  stage: RallyStage;
  possession: TeamKey | null;
  actionHistory: RallyActionHistoryEntry[];
  stats: TeamRecord<RallyTeamStats>;
}

export interface RallyState extends RallySnapshot {
  showConfirmation: boolean;
  showDiscardConfirmation: boolean;
}

// ── Socket ───────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

// ── Badges ───────────────────────────────────────────────────────────────────

export interface Badge {
  id: number;
  name: string;
  url: string;
}
