import { describe, it, expect } from 'vitest';
import { resolveParticipant } from '../resolveParticipant';
import type { RfevbCompetitionData } from '../types';

const baseData: RfevbCompetitionData = {
  competitionId: '9036',
  name: 'Test Competition',
  logoUrl: '',
  standings: {},
  teams: [
    { groupKey: 'A1', name: 'Team Alpha', logoUrl: 'https://example.com/alpha.png' },
    { groupKey: 'A2', name: 'Team Beta',  logoUrl: 'https://example.com/beta.png' },
    { groupKey: 'B1', name: 'Team Gamma', logoUrl: 'https://example.com/gamma.png' },
  ],
  matches: [
    { id: 1, homeRef: { type: 'team', groupKey: 'A1' }, awayRef: { type: 'team', groupKey: 'A2' }, venue: 'Hall A', date: '06/05/26', time: '16:30', phaseLabel: 'Grupo A', homeScore: 3, awayScore: 1 },
    { id: 2, homeRef: { type: 'team', groupKey: 'B1' }, awayRef: { type: 'team', groupKey: 'A2' }, venue: 'Hall B', date: '07/05/26', time: '09:00', phaseLabel: 'Grupo B', homeScore: 0, awayScore: 0 },
  ],
};

describe('resolveParticipant', () => {
  it('resolves a direct team key', () => {
    const result = resolveParticipant({ type: 'team', groupKey: 'A1' }, baseData);
    expect(result.name).toBe('Team Alpha');
    expect(result.logoUrl).toBe('https://example.com/alpha.png');
    expect(result.resolved).toBe(true);
  });

  it('returns unresolved for unknown team key', () => {
    const result = resolveParticipant({ type: 'team', groupKey: 'Z9' }, baseData);
    expect(result.resolved).toBe(false);
    expect(result.name).toBe('Por determinar');
  });

  it('returns unresolved for group position when group matches are not yet played', () => {
    // match 2 in baseData (group A match) has scores 0-0
    const result = resolveParticipant({ type: 'groupPosition', position: 2, group: 'A' }, baseData);
    expect(result.resolved).toBe(false);
  });

  it('resolves group position via seed key when all group matches are played', () => {
    const data: RfevbCompetitionData = {
      ...baseData,
      matches: [
        { ...baseData.matches[0], homeScore: 3, awayScore: 1 }, // A1 vs A2, played
        { id: 3, homeRef: { type: 'name', name: 'Team Alpha' }, awayRef: { type: 'name', name: 'Team Beta' }, venue: 'Hall A', date: '07/05/26', time: '09:00', phaseLabel: 'Grupo A', homeScore: 3, awayScore: 0 },
      ],
    };
    const result = resolveParticipant({ type: 'groupPosition', position: 2, group: 'A' }, data);
    expect(result.name).toBe('Team Beta');
    expect(result.resolved).toBe(true);
  });

  it('resolves winner of a played match', () => {
    // match 1: homeScore 3 > awayScore 1 → home (A1 = Team Alpha) wins
    const result = resolveParticipant({ type: 'winner', matchId: 1 }, baseData);
    expect(result.name).toBe('Team Alpha');
    expect(result.resolved).toBe(true);
  });

  it('resolves loser of a played match', () => {
    const result = resolveParticipant({ type: 'loser', matchId: 1 }, baseData);
    expect(result.name).toBe('Team Beta');
    expect(result.resolved).toBe(true);
  });

  it('returns unresolved when referenced match has not been played', () => {
    // match 2: both scores 0
    const result = resolveParticipant({ type: 'winner', matchId: 2 }, baseData);
    expect(result.resolved).toBe(false);
  });

  it('returns unresolved for unknown match id', () => {
    const result = resolveParticipant({ type: 'winner', matchId: 999 }, baseData);
    expect(result.resolved).toBe(false);
  });

  it('chains winner resolution across two matches', () => {
    const data: RfevbCompetitionData = {
      ...baseData,
      matches: [
        ...baseData.matches,
        {
          id: 3,
          homeRef: { type: 'winner', matchId: 1 }, // resolves to Team Alpha
          awayRef: { type: 'team', groupKey: 'B1' },
          venue: 'Hall C', date: '08/05/26', time: '11:00', phaseLabel: 'QF',
          homeScore: 3, awayScore: 0,
        },
      ],
    };
    const result = resolveParticipant({ type: 'winner', matchId: 3 }, data);
    expect(result.name).toBe('Team Alpha');
    expect(result.resolved).toBe(true);
  });

  it('handles unknown ref type', () => {
    const result = resolveParticipant({ type: 'unknown', raw: 'some text' }, baseData);
    expect(result.resolved).toBe(false);
    expect(result.name).toBe('some text');
  });
});
