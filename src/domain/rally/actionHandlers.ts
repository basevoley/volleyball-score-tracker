import type { TeamKey, TeamRecord, RallyTeamStats, RallyStage, RallySnapshot, RallyActionHistoryEntry, RallyActionType } from '../../types';

const opp = (team: TeamKey): TeamKey => team === 'teamA' ? 'teamB' : 'teamA';

const inc = (stats: TeamRecord<RallyTeamStats>, team: TeamKey, field: keyof RallyTeamStats, delta = 1): TeamRecord<RallyTeamStats> => ({
    ...stats,
    [team]: { ...stats[team], [field]: stats[team][field] + delta },
});

export interface ActionApplyResult {
    stats: TeamRecord<RallyTeamStats>;
    stage: RallyStage;
    possession?: TeamKey;
    team: TeamKey;
}

export interface RallyActionHandler {
    apply: (state: RallySnapshot, faultingTeam?: TeamKey) => ActionApplyResult;
    undo: (entry: RallyActionHistoryEntry, stats: TeamRecord<RallyTeamStats>) => TeamRecord<RallyTeamStats>;
}

const ERROR_FIELDS: Partial<Record<RallyStage, keyof RallyTeamStats>> = {
    afterServe: 'serveError',
    afterReception: 'receptionError',
    afterAttack: 'attackError',
    afterDig: 'digError',
    afterBlock: 'blockOut',
};

const POINT_FIELDS: Partial<Record<RallyStage, keyof RallyTeamStats>> = {
    afterServe: 'ace',
    afterBlock: 'blockPoint',
    afterAttack: 'attackPoint',
};

export const RALLY_ACTION_HANDLERS: Record<RallyActionType, RallyActionHandler> = {
    serve: {
        apply: (state) => {
            const team = state.possession!;
            return { stats: inc(state.stats, team, 'serve'), stage: 'afterServe', team };
        },
        undo: (entry, stats) => inc(stats, entry.team, 'serve', -1),
    },
    reception: {
        apply: (state) => {
            const team = opp(state.possession!);
            return { stats: inc(state.stats, team, 'reception'), stage: 'afterReception', possession: team, team };
        },
        undo: (entry, stats) => inc(stats, entry.team, 'reception', -1),
    },
    attack: {
        apply: (state) => {
            const team = state.possession!;
            return { stats: inc(state.stats, team, 'attack'), stage: 'afterAttack', team };
        },
        undo: (entry, stats) => inc(stats, entry.team, 'attack', -1),
    },
    block: {
        apply: (state) => {
            const team = opp(state.possession!);
            return { stats: inc(state.stats, team, 'block'), stage: 'afterBlock', possession: team, team };
        },
        undo: (entry, stats) => inc(stats, entry.team, 'block', -1),
    },
    continue: {
        apply: (state) => {
            const team = state.possession!;
            return { stats: inc(state.stats, team, 'dig'), stage: 'afterDig', team };
        },
        undo: (entry, stats) => inc(stats, entry.team, 'dig', -1),
    },
    dig: {
        apply: (state) => {
            const team = opp(state.possession!);
            let newStats = inc(state.stats, team, 'dig');
            if (state.stage === 'afterBlock') {
                newStats = inc(newStats, state.possession!, 'attack');
            }
            return { stats: newStats, stage: 'afterDig', possession: team, team };
        },
        undo: (entry, stats) => {
            let newStats = inc(stats, entry.team, 'dig', -1);
            if (entry.rallyStage === 'afterBlock') {
                newStats = inc(newStats, opp(entry.team), 'attack', -1);
            }
            return newStats;
        },
    },
    error: {
        apply: (state) => {
            const team = state.possession!;
            const field = ERROR_FIELDS[state.stage];
            const newStats = field ? inc(state.stats, team, field) : state.stats;
            return { stats: newStats, stage: state.stage, possession: opp(team), team };
        },
        undo: (entry, stats) => {
            const field = ERROR_FIELDS[entry.rallyStage];
            return field ? inc(stats, entry.team, field, -1) : stats;
        },
    },
    fault: {
        apply: (state, faultingTeam) => {
            const team = faultingTeam!;
            return { stats: inc(state.stats, team, 'fault'), stage: state.stage, possession: opp(team), team };
        },
        undo: (entry, stats) => inc(stats, entry.team, 'fault', -1),
    },
    point: {
        apply: (state) => {
            const team = state.possession!;
            const field = POINT_FIELDS[state.stage];
            const newStats = field ? inc(state.stats, team, field) : state.stats;
            return { stats: newStats, stage: state.stage, team };
        },
        undo: (entry, stats) => {
            const field = POINT_FIELDS[entry.rallyStage];
            return field ? inc(stats, entry.team, field, -1) : stats;
        },
    },
};
