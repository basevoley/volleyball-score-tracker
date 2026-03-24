import type { MatchScores, TeamKey } from '../../types';

export const checkSetEnd = (scores: MatchScores, setsWon: MatchScores, maxSets: number): TeamKey | null => {
    const required = (setsWon.teamA + setsWon.teamB === maxSets - 1) ? 15 : 25;
    if (scores.teamA >= required && scores.teamA - scores.teamB >= 2) return 'teamA';
    if (scores.teamB >= required && scores.teamB - scores.teamA >= 2) return 'teamB';
    return null;
};

export const checkMatchEnd = (setsWon: MatchScores, maxSets: number): TeamKey | null => {
    const needed = Math.ceil(maxSets / 2);
    return setsWon.teamA >= needed ? 'teamA' : setsWon.teamB >= needed ? 'teamB' : null;
};
