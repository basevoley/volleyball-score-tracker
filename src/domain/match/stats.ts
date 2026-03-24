import type { TeamKey, TeamRecord, TeamStats, RallyTeamStats } from '../../types';

const calculatePercentage = (value: number, total: number): string =>
    total === 0 ? '0%' : `${((value / total) * 100).toFixed(2)}%`;

export const calculateComputedStats = (stats: TeamRecord<TeamStats>, team: TeamKey): TeamRecord<TeamStats> => {
    const opp = team === 'teamA' ? 'teamB' : 'teamA';
    return {
        ...stats,
        [team]: {
            ...stats[team],
            serviceEffectiveness: calculatePercentage(stats[team].ace - stats[team].serveError, stats[team].serve),
            receptionEffectiveness: calculatePercentage(stats[team].reception - stats[team].receptionError, stats[opp].serve),
            attackEffectiveness: calculatePercentage(stats[team].attackPoint - stats[team].attackError, stats[team].attack),
            defenseEffectiveness: calculatePercentage(stats[team].dig - stats[team].digError, stats[opp].attack),
            selfErrors: stats[team].serveError + stats[team].receptionError + stats[team].digError +
                stats[team].attackError + stats[team].blockOut + stats[team].fault || 0,
        },
    };
};

export const mergeStats = (current: TeamRecord<TeamStats>, update: TeamRecord<RallyTeamStats>, team: TeamKey): TeamStats =>
    Object.keys(current[team]).reduce((acc, key) => ({
        ...acc,
        [key]: (current[team] as unknown as Record<string, number>)[key] + ((update[team] as unknown as Record<string, number>)[key] || 0),
    }), {} as TeamStats);

export const calculateUpdatedStatistics = (current: TeamRecord<TeamStats>, update: TeamRecord<RallyTeamStats>): TeamRecord<TeamStats> => {
    const stats: TeamRecord<TeamStats> = {
        teamA: mergeStats(current, update, 'teamA'),
        teamB: mergeStats(current, update, 'teamB'),
    };
    return calculateComputedStats(calculateComputedStats(stats, 'teamA'), 'teamB');
};

const EMPTY_TEAM_STATS: TeamStats = {
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0,
    attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0,
    selfErrors: 0, serviceEffectiveness: '0%', receptionEffectiveness: '0%',
    attackEffectiveness: '0%', defenseEffectiveness: '0%',
};

export const createEmptyMatchStats = (): TeamRecord<TeamStats> => ({
    teamA: { ...EMPTY_TEAM_STATS },
    teamB: { ...EMPTY_TEAM_STATS },
});

const EMPTY_RALLY_TEAM_STATS: RallyTeamStats = {
    serve: 0, ace: 0, serveError: 0, reception: 0, receptionError: 0, dig: 0, digError: 0,
    attack: 0, attackPoint: 0, attackError: 0, block: 0, blockPoint: 0, blockOut: 0, fault: 0,
};

export const createEmptyRallyStats = (): TeamRecord<RallyTeamStats> => ({
    teamA: { ...EMPTY_RALLY_TEAM_STATS },
    teamB: { ...EMPTY_RALLY_TEAM_STATS },
});
