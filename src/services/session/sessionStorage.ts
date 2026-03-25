// Session storage — versioned persistence for match state.
//
// ── Schema version history ────────────────────────────────────────────────────
//
//   version 0  (legacy, no version field)
//              Shape: { matchData, matchDetails, config }
//              Written before versioning was introduced.
//
//   version 1  (current)
//              Shape: { version: 1, matchData, matchDetails, config }
//              Identical data shape to v0; adds the version stamp.
//
// ── Migration rules ───────────────────────────────────────────────────────────
//
//   0 → 1: data shape unchanged — stamp version: 1.
//
// ── Adding a new version ──────────────────────────────────────────────────────
//
//   1. Increment CURRENT_VERSION.
//   2. Add a migration block inside `migrate()` guarded by `fromVersion < N`.
//   3. Document the new shape in the version history above.

import type { Config, MatchData, MatchDetails } from '../../types';

export const STORAGE_KEY = 'vb_tracker_session';
export const CURRENT_VERSION = 1;

export interface PersistedSession {
    version: number;
    matchData: MatchData;
    matchDetails: MatchDetails;
    config: Config;
}

// Migrate raw parsed data from `fromVersion` up to CURRENT_VERSION.
// Returns null if the data cannot be safely migrated.
export const migrate = (raw: Record<string, unknown>, fromVersion: number): PersistedSession | null => {
    try {
        let data: Record<string, unknown> = { ...raw };

        if (fromVersion < 1) {
            // 0 → 1: stamp the version; data shape is unchanged
            data = { ...data, version: 1 };
        }

        // Future migrations go here:
        // if (fromVersion < 2) { ... }

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
