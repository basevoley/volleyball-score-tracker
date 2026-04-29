import type { ParticipantRef, RfevbCompetitionData, RfevbTeam } from './types';

export interface ResolvedParticipant {
  name: string;
  logoUrl: string;
  resolved: boolean;
}

const UNRESOLVED: ResolvedParticipant = { name: 'Por determinar', logoUrl: '', resolved: false };

function teamByGroupKey(data: RfevbCompetitionData, groupKey: string): RfevbTeam | undefined {
  return data.teams.find(t => t.groupKey.toUpperCase() === groupKey.toUpperCase());
}

function resolveRef(ref: ParticipantRef, data: RfevbCompetitionData, depth = 0): ResolvedParticipant {
  if (depth > 20) return UNRESOLVED; // cycle guard

  switch (ref.type) {
    case 'team': {
      const team = teamByGroupKey(data, ref.groupKey);
      return team
        ? { name: team.name, logoUrl: team.logoUrl, resolved: true }
        : UNRESOLVED;
    }

    case 'groupPosition': {
      // Only resolve once all matches involving teams from this group are played.
      // A match is considered played when at least one score is non-zero.
      const groupTeamKeys = data.teams
        .filter(t => t.groupKey.startsWith(ref.group))
        .map(t => t.groupKey);

      const groupMatches = data.matches.filter(m => {
        const refs = [m.homeRef, m.awayRef];
        return refs.some(r =>
          (r.type === 'team' && groupTeamKeys.includes(r.groupKey)) ||
          (r.type === 'name' && data.teams.some(t =>
            groupTeamKeys.includes(t.groupKey) &&
            t.name.trim().toLowerCase() === r.name.trim().toLowerCase()
          ))
        );
      });

      const allPlayed = groupMatches.length > 0 &&
        groupMatches.every(m => m.homeScore > 0 || m.awayScore > 0);

      if (!allPlayed) return UNRESOLVED;

      // All played — resolve by seed position (RFEVB standing data not available
      // via this API, so we can only fall back to seed key for now)
      const seedKey = `${ref.group}${ref.position}`;
      const team = teamByGroupKey(data, seedKey);
      return team
        ? { name: team.name, logoUrl: team.logoUrl, resolved: true }
        : UNRESOLVED;
    }

    case 'winner': {
      const match = data.matches.find(m => m.id === ref.matchId);
      if (!match) return UNRESOLVED;
      if (match.homeScore === 0 && match.awayScore === 0) return UNRESOLVED;
      const winnerRef = match.homeScore > match.awayScore ? match.homeRef : match.awayRef;
      return resolveRef(winnerRef, data, depth + 1);
    }

    case 'loser': {
      const match = data.matches.find(m => m.id === ref.matchId);
      if (!match) return UNRESOLVED;
      if (match.homeScore === 0 && match.awayScore === 0) return UNRESOLVED;
      const loserRef = match.homeScore > match.awayScore ? match.awayRef : match.homeRef;
      return resolveRef(loserRef, data, depth + 1);
    }

    case 'name': {
      const team = data.teams.find(t => t.name.trim().toLowerCase() === ref.name.trim().toLowerCase());
      return team
        ? { name: team.name, logoUrl: team.logoUrl, resolved: true }
        : { name: ref.name, logoUrl: '', resolved: true }; // name is known even if logo isn't
    }

    case 'unknown':
      return { name: ref.raw || 'Por determinar', logoUrl: '', resolved: false };
  }
}

export function resolveParticipant(ref: ParticipantRef, data: RfevbCompetitionData): ResolvedParticipant {
  return resolveRef(ref, data);
}
