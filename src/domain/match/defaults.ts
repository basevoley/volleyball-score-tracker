import type { MatchData, MatchDetails, Config } from '../../types';
import { createEmptyMatchStats } from './stats';

export const initialMatchData: MatchData = {
    scores: { teamA: 0, teamB: 0 },
    setsWon: { teamA: 0, teamB: 0 },
    currentServer: null,
    matchPhase: 'pre-match',
    timeouts: { teamA: 0, teamB: 0 },
    substitutions: { teamA: 0, teamB: 0 },
    statistics: createEmptyMatchStats(),
    currentSetStats: createEmptyMatchStats(),
    currentSetHistory: [],
    setStats: [],
    winner: null,
};

export const initialMatchDetails: MatchDetails = {
    teams: { teamA: 'Equipo Local Demo', teamB: 'Equipo Visitante Demo' },
    teamLogos: {
        teamA: 'logo192.png',
        teamB: 'logo.svg',
    },
    teamColors: {
        teamA: '#007BFF',
        teamB: '#FF5733',
    },
    matchHeader: 'CATEGORIA - Division',
    extendedInfo: 'Fase - Jornada X',
    stadium: 'Pabellón donde se juega, Ciudad',
    competitionLogo: 'sample_logo.jpg',
    maxSets: 5,
    stats: {
        teamA: {
            ranking: 0, competitionPoints: 0, matchesPlayed: 0, totalMatchesWon: 0,
            won3Points: 0, won2Points: 0, totalMatchesLost: 0, lost1Point: 0,
            lost0Points: 0, totalPointsScored: 0, totalPointsReceived: 0,
        },
        teamB: {
            ranking: 0, competitionPoints: 0, matchesPlayed: 0, totalMatchesWon: 0,
            won3Points: 0, won2Points: 0, totalMatchesLost: 0, lost1Point: 0,
            lost0Points: 0, totalPointsScored: 0, totalPointsReceived: 0,
        },
    },
    players: {
        teamA: [],
        teamB: [],
    },
};

export const initialConfig: Config = {
    scoreboard: {
        enabled: false,
        type: 'classic',
        position: 'top',
        showHistory: true,
    },
    matchup: {
        enabled: false,
    },
    lowerThird: {
        enabled: false,
    },
    socialMedia: {
        enabled: false,
        position: 'top-left',
        channels: [
            { network: 'YouTube', handle: 'voleibolAlcala', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png' },
            { network: 'TikTok', handle: 'cv_Alcala', icon: 'https://images.seeklogo.com/logo-png/34/2/tiktok-logo-png_seeklogo-340606.png' },
            { network: 'Instagram', handle: 'voleibolalcala', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Instagram-Gradient-Logo-PNG.png' },
            { network: 'Twitch', handle: 'cvalcalaoficial', icon: 'https://images.seeklogo.com/logo-png/44/2/twitch-new-logo-png_seeklogo-447573.png' },
            { network: 'Facebook', handle: 'Club-Voleibol-Alcalá', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png' },
        ],
    },
    teamComparison: {
        enabled: false,
    },
    afterMatch: {
        enabled: false,
        showStats: true,
    },
    sponsors: {
        enabled: false,
        imageUrls: [
            'sponsors-1.png',
            'sponsors-2.png',
            'sponsors-3.png',
        ],
        displayTime: 5000,
    },
    subscribe: {
        enabled: false,
        position: 'center',
    },
    lineup: {
        enabled: false,
        showStats: true,
    },
};
