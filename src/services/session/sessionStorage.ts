// Session storage — versioned persistence for match state.
//
// ── Schema version history ────────────────────────────────────────────────────
//
//   version 0  (legacy, no version field)
//              Shape: { matchData, matchDetails, config }
//              Written before versioning was introduced.
//
//   version 1
//              Shape: { version: 1, matchData, matchDetails, config }
//              matchData fields: matchStarted: boolean, ballPossession, setScores,
//              currentSetHistory: HistoryEntry[], setStats[n].history: HistoryEntry[].
//              History entries carry index: number (per-set position), no setNumber.
//              AdjustHistoryEntry has no prevServer field.
//              Stats objects are TeamStats (includes computed effectiveness fields).
//
//   version 2  (current)
//              Shape: { version: 2, matchData, matchDetails, config }
//              matchData fields: matchPhase enum replaces matchStarted/ballPossession/setScores.
//              Single history: HistoryEntry[] spanning the full match (replaces split arrays).
//              History entries carry setNumber: number, no index.
//              AdjustHistoryEntry has prevServer: TeamKey | null.
//              Stats objects are RawTeamStats (no computed effectiveness fields).
//
// ── Migration rules ───────────────────────────────────────────────────────────
//
//   0 → 1: data shape unchanged — stamp version: 1.
//   1 → 2: see migrateV1ToV2() below.
//
// ── Adding a new version ──────────────────────────────────────────────────────
//
//   1. Increment CURRENT_VERSION.
//   2. Add a migration block inside `migrate()` guarded by `fromVersion < N`.
//   3. Document the new shape in the version history above.

import type { Config, MatchData, MatchDetails } from '../../types';

export const STORAGE_KEY = 'vb_tracker_session';
export const CURRENT_VERSION = 2;

export interface PersistedSession {
    version: number;
    matchData: MatchData;
    matchDetails: MatchDetails;
    config: Config;
}

// Raw field keys that belong in RawTeamStats (v2). All others are computed and must be stripped.
const RAW_STAT_KEYS = new Set([
    'serve', 'ace', 'serveError', 'reception', 'receptionError',
    'dig', 'digError', 'attack', 'attackPoint', 'attackError',
    'block', 'blockPoint', 'blockOut', 'fault',
]);

const stripComputedFields = (stats: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(stats).filter(([k]) => RAW_STAT_KEYS.has(k)));

const stripTeamRecord = (tr: Record<string, unknown>): Record<string, unknown> => ({
    teamA: stripComputedFields(tr.teamA as Record<string, unknown>),
    teamB: stripComputedFields(tr.teamB as Record<string, unknown>),
});

// Normalise a single history entry to v2 shape: swap index for setNumber, patch prevServer on adjust.
const migrateHistoryEntry = (entry: Record<string, unknown>, setNumber: number): Record<string, unknown> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { index: _index, ...rest } = entry as Record<string, unknown> & { index?: unknown };
    const migrated: Record<string, unknown> = { ...rest, setNumber };
    if (migrated.entryType === 'adjust' && !('prevServer' in migrated)) {
        migrated.prevServer = null;
    }
    return migrated;
};

const migrateV1ToV2 = (data: Record<string, unknown>): Record<string, unknown> => {
    const matchData = data.matchData as Record<string, unknown>;
    const setsWon = matchData.setsWon as { teamA: number; teamB: number } | undefined;
    const setStats = Array.isArray(matchData.setStats)
        ? (matchData.setStats as Record<string, unknown>[])
        : [];
    const currentSetHistory = Array.isArray(matchData.currentSetHistory)
        ? (matchData.currentSetHistory as Record<string, unknown>[])
        : [];

    // Derive matchPhase from v1 fields
    let matchPhase: string;
    if (matchData.winner) {
        matchPhase = 'ended';
    } else if (matchData.matchStarted) {
        matchPhase = 'in-progress';
    } else if (setStats.length > 0) {
        matchPhase = 'between-sets';
    } else {
        matchPhase = 'pre-match';
    }

    // Merge per-set histories into one flat array ordered chronologically
    const currentSetNumber = setsWon ? setsWon.teamA + setsWon.teamB + 1 : setStats.length + 1;
    const unifiedHistory: Record<string, unknown>[] = [];

    for (let i = 0; i < setStats.length; i++) {
        const setHistory = Array.isArray(setStats[i].history)
            ? (setStats[i].history as Record<string, unknown>[])
            : [];
        setHistory.forEach(e => unifiedHistory.push(migrateHistoryEntry(e, i + 1)));
    }
    currentSetHistory.forEach(e => unifiedHistory.push(migrateHistoryEntry(e, currentSetNumber)));

    // Migrate setStats: drop per-set history, strip computed stats fields
    const newSetStats = setStats.map(s => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { history: _history, ...rest } = s;
        return {
            ...rest,
            statistics: stripTeamRecord(s.statistics as Record<string, unknown>),
        };
    });

    // Rebuild matchData without v1-only fields
    const {
        matchStarted: _ms,
        ballPossession: _bp,
        setScores: _sc,
        currentSetHistory: _csh,
        setStats: _ss,
        statistics,
        currentSetStats,
        ...restMatchData
    } = matchData;

    return {
        ...data,
        version: 2,
        matchData: {
            ...restMatchData,
            matchPhase,
            statistics: stripTeamRecord(statistics as Record<string, unknown>),
            currentSetStats: stripTeamRecord(currentSetStats as Record<string, unknown>),
            history: unifiedHistory,
            setStats: newSetStats,
        },
    };
};

// Migrate raw parsed data from `fromVersion` up to CURRENT_VERSION.
// Returns null if the data cannot be safely migrated.
export const migrate = (raw: Record<string, unknown>, fromVersion: number): PersistedSession | null => {
    try {
        let data: Record<string, unknown> = { ...raw };

        if (fromVersion < 1) {
            // 0 → 1: stamp the version; data shape is unchanged
            data = { ...data, version: 1 };
        }

        if (fromVersion < 2) {
            data = migrateV1ToV2(data);
        }

        return data as unknown as PersistedSession;
    } catch {
        return null;
    }
};

// Read and return the current session from localStorage, migrating if needed.
// Returns null on any error or if no session is stored.
export const loadSession = (): PersistedSession | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const version = typeof parsed.version === 'number' ? parsed.version : 0;

        if (version === CURRENT_VERSION) {
            return parsed as unknown as PersistedSession;
        }

        return migrate(parsed, version);
    } catch {
        return null;
    }
};

// Persist a session to localStorage, stamping the current version.
export const saveSession = (session: Omit<PersistedSession, 'version'>): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CURRENT_VERSION, ...session }));
    } catch { /* storage unavailable or quota exceeded */ }
};

// Remove the stored session from localStorage.
export const clearSession = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};
