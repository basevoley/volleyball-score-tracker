import type { MatchData, MatchDetails, RuntimeConfig, OverlaySetup } from '../../types';
import { createEmptyMatchStats } from './stats';
import { SOCKET_SERVER_URL } from '../../config';

const baseUrl = SOCKET_SERVER_URL;

export const initialMatchData: MatchData = {
    scores: { teamA: 0, teamB: 0 },
    setsWon: { teamA: 0, teamB: 0 },
    currentServer: null,
    matchPhase: 'pre-match',
    timeouts: { teamA: 0, teamB: 0 },
    substitutions: { teamA: 0, teamB: 0 },
    statistics: createEmptyMatchStats(),
    currentSetStats: createEmptyMatchStats(),
    history: [],
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

export const initialConfig: RuntimeConfig = {
    scoreboard: { enabled: false, type: 'classic', position: 'top', showHistory: true },
    matchup: { enabled: false },
    lowerThird: { enabled: false },
    socialMedia: { enabled: false, position: 'top-left' },
    teamComparison: { enabled: false },
    afterMatch: { enabled: false, showStats: true },
    sponsors: { enabled: false },
    subscribe: { enabled: false, position: 'center' },
    lineup: { enabled: false, showStats: true },
};

export const initialOverlaySetup: OverlaySetup = {
    socialMedia: {
        channels: [
            { network: 'YouTube',   handle: '@voleibolAlcala',       icon: `${baseUrl}/images/networks/Youtube_logo.png` },
            { network: 'TikTok',    handle: '@cv_Alcala',            icon: `${baseUrl}/images/networks/tiktok-logo.png` },
            { network: 'Instagram', handle: '@voleibolalcala',       icon: `${baseUrl}/images/networks/Instagram-Gradient-Logo.png` },
            { network: 'Twitch',    handle: '@cvalcalaoficial',      icon: `${baseUrl}/images/networks/twitch-logo.png` },
            { network: 'Facebook',  handle: '@Club-Voleibol-Alcalá', icon: `${baseUrl}/images/networks/Facebook_Logo.png` },
            { network: 'Web',       handle: 'cvoleibolalcala.com',   icon: `${baseUrl}/images/networks/web.png` },
        ],
    },
    sponsors: {
        imageUrls: [`${baseUrl}/images/sponsors/sponsors-1.png`, `${baseUrl}/images/sponsors/sponsors-2.png`, `${baseUrl}/images/sponsors/sponsors-3.png`],
        displayTime: 5000,
    },
    subscribe: {
        logoUrl: `${baseUrl}/images/teams/cv-alcala.jpg`,
        callToActionText: 'SUSCRÍBETE',
        buttonColor: '#ff0000',
    },
    theme: {},
};
