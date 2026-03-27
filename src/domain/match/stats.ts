import type { TeamKey, TeamRecord, RawTeamStats, ComputedTeamStats, RallyTeamStats } from '../../types';

const calculatePercentage = (value: number, total: number): string =>
    total === 0 ? '0%' : `${((value / total) * 100).toFixed(2)}%`;

/** Compute display/overlay stats from raw stored stats. Single source of truth for all effectiveness formulas. */
export const computeEffectiveness = (team: RawTeamStats, opp: RawTeamStats): ComputedTeamStats => ({
    ...team,
    selfErrors: team.serveError + team.receptionError + team.digError +
        team.attackError + team.blockOut + team.fault || 0,
    serviceEffectiveness: calculatePercentage(team.ace - team.serveError, team.serve),
    receptionEffectiveness: calculatePercentage(team.reception - team.receptionError, opp.serve),
    attackEffectiveness: calculatePercentage(team.attackPoint - team.attackError, team.attack),
    defenseEffectiveness: calculatePercentage(team.dig - team.digError, opp.attack),
});

export const mergeStats = (current: TeamRecord<RawTeamStats>, update: TeamRecord<RallyTeamStats>, team: TeamKey): RawTeamStats =>
    Object.keys(current[team]).reduce((acc, key) => ({
        ...acc,
        [key]: (current[team] as unknown as Record<string, number>)[key] + ((update[team] as unknown as Record<string, number>)[key] || 0),
    }), {} as RawTeamStats);

export const calculateUpdatedStatistics = (current: TeamRecord<RawTeamStats>, update: TeamRecord<RallyTeamStats>): TeamRecord<RawTeamStats> => ({
    teamA: mergeStats(current, update, 'teamA'),
    teamB: mergeStats(current, update, 'teamB'),
});

/** Reverses a rally stats update — subtracts delta from each field. Used by history undo. */
export const reverseStats = (current: TeamRecord<RawTeamStats>, delta: TeamRecord<RallyTeamStats>): TeamRecord<RawTeamStats> => ({
    teamA: Object.keys(current.teamA).reduce((acc, key) => ({
        ...acc,
        [key]: (current.teamA as unknown as Record<string, number>)[key] - ((delta.teamA as unknown as Record<string, number>)[key] || 0),
    }), {} as RawTeamStats),
    teamB: Object.keys(current.teamB).reduce((acc, key) => ({
        ...acc,
        [key]: (current.teamB as unknown as Record<string, number>)[key] - ((delta.teamB as unknown as Record<string, number>)[key] || 0),
    }), {} as RawTeamStats),
});

const EMPTY_RAW_TEAM_STATS: RawTeamStats = {
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0,
    attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0,
};

export const createEmptyMatchStats = (): TeamRecord<RawTeamStats> => ({
    teamA: { ...EMPTY_RAW_TEAM_STATS },
    teamB: { ...EMPTY_RAW_TEAM_STATS },
});

const EMPTY_RALLY_TEAM_STATS: RallyTeamStats = {
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0,
    attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0,
};

export const createEmptyRallyStats = (): TeamRecord<RallyTeamStats> => ({
    teamA: { ...EMPTY_RALLY_TEAM_STATS },
    teamB: { ...EMPTY_RALLY_TEAM_STATS },
});
