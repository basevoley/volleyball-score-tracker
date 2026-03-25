import { ConfigChange, Sequence } from '../../types';

const ALL_PRESENTATION_PANELS: ConfigChange[] = [
    { section: 'matchup', key: 'enabled', value: false },
    { section: 'lowerThird', key: 'enabled', value: false },
    { section: 'teamComparison', key: 'enabled', value: false },
    { section: 'sponsors', key: 'enabled', value: false },
    { section: 'lineup', key: 'enabled', value: false },
    { section: 'socialMedia', key: 'enabled', value: false },
    { section: 'scoreboard', key: 'enabled', value: false },
    { section: 'subscribe', key: 'enabled', value: false },
    { section: 'afterMatch', key: 'enabled', value: false },
];

// --- Sequence data model ---
//
// Each sequence object has:
//   id                - unique string identifier
//   label             - short name shown in the Controls UI
//   description       - longer text shown below the label in the Controls UI
//   trigger           - { type: 'manual' } or { type: 'socketEvent', event, condition, initialState? }
//                       condition: (data, state) => bool  — state is a per-sequence mutable object
//                       useful for edge-triggered conditions that need to track previous values
//   defaultEnabled    - for socketEvent triggers: initial enabled state (defaults to true)
//   steps             - array of step objects (see below)
//   snapshotSections  - optional: config sections to snapshot before running; restored on stop or natural end
//   resetOnStop       - optional: sections to force-hide when stop() is called
//
// Each step has:
//   label      - displayed in the Controls progress indicator
//   changes    - array of { section, key, value } config patches
//   duration   - ms to wait before advancing to the next step
//   condition  - optional (ctx) => bool; step is skipped if false
//   loopStart  - optional boolean; marks the step to jump back to at sequence end

export const PRE_MATCH_SEQUENCE: Sequence = {
    id: 'PRE_MATCH',
    label: 'Secuencia pre-partido',
    description: 'Presenta el partido con matchup, lower third, redes sociales, patrocinadores, splash y opcionalmente comparación de equipos y listas de jugadores. Repite desde patrocinadores hasta que se inicia el partido o se detenga.',
    trigger: { type: 'manual' },
    resetOnStop: ['matchup', 'lowerThird', 'socialMedia', 'sponsors', 'teamComparison', 'lineup'],
    steps: [
        {
            label: 'Mostrar presentación de partido',
            changes: [{ section: 'matchup', key: 'enabled', value: true }],
            duration: 60000,
        },
        {
            label: 'Ocultar presentación de partido',
            changes: [{ section: 'matchup', key: 'enabled', value: false }],
            duration: 1500,
        },
        {
            label: 'Mostrar lower third',
            changes: [{ section: 'lowerThird', key: 'enabled', value: true }],
            duration: 1500,
        },
        {
            label: 'Mostrar redes sociales',
            changes: [
                { section: 'socialMedia', key: 'position', value: 'top-left' },
                { section: 'socialMedia', key: 'enabled', value: true },
            ],
            duration: 12000,
        },
        {
            label: 'Mostrar patrocinadores',
            changes: [{ section: 'sponsors', key: 'enabled', value: true }],
            duration: 120000,
            loopStart: true,
        },
        {
            label: 'Ocultar patrocinadores',
            changes: [{ section: 'sponsors', key: 'enabled', value: false }],
            duration: 2000,
        },
        {
            label: 'Mostrar splash de subscripción',
            changes: [
                { section: 'subscribe', key: 'position', value: 'center' },
                { section: 'subscribe', key: 'enabled', value: true }
            ],
            duration: 15000,
            condition: () => Math.random() >= 0.5,
        },
        {
            label: 'Ocultar splash de subscripción',
            changes: [{ section: 'subscribe', key: 'enabled', value: false }],
            duration: 2000,
        },
        // ******************************************************* BLOQUE COMPARACIÓN EQUIPOS
        {
            label: 'Mostrar comparación de equipos',
            changes: [
                { section: 'lowerThird', key: 'enabled', value: false },
                { section: 'teamComparison', key: 'enabled', value: true },
            ],
            duration: 40000,
            condition: ctx => ctx.hasStats,
        },
        {
            label: 'Ocultar comparación de equipos',
            changes: [
                { section: 'teamComparison', key: 'enabled', value: false },
                { section: 'lowerThird', key: 'enabled', value: true },
            ],
            duration: 10000,
            condition: ctx => ctx.hasStats,
        },
        // ******************************************************* BLOQUE COMPARACIÓN EQUIPOS
        // ******************************************************* TRANSICION SI HAY COMPARACION Y JUGADORES
        {
            label: 'Mostrar patrocinadores (2)',
            changes: [{ section: 'sponsors', key: 'enabled', value: true }],
            duration: 120000,
            condition: ctx => ctx.hasStats && ctx.hasPlayers,
        },
        {
            label: 'Ocultar patrocinadores',
            changes: [
                { section: 'sponsors', key: 'enabled', value: false },
            ],
            duration: 2000,
            condition: ctx => ctx.hasStats && ctx.hasPlayers,
        },
        // ******************************************************* TRANSICION SI HAY COMPARACION Y JUGADORES
        // ******************************************************* BLOQUE LISTADO JUGADORES
        {
            label: 'Configurar listado de jugadores',
            changes: [
                { section: 'lowerThird', key: 'enabled', value: false },
                { section: 'lineup', key: 'showStats', value: false }

            ],
            duration: 100,
            condition: ctx => ctx.hasPlayers,
        },
        {
            label: 'Mostrar listado de jugadores',
            changes: [
                { section: 'lineup', key: 'enabled', value: true },
            ],
            duration: 100,
            condition: ctx => ctx.hasPlayers,
        },
        {
            label: 'Mostrar listado de jugadores',
            changes: [
                { section: 'lineup', key: 'showStats', value: true }
                ],
            duration: 30000,
            condition: ctx => ctx.hasPlayers,
        },
        {
            label: 'Ocultar listado de jugadores',
            changes: [
                { section: 'lineup', key: 'showStats', value: false },
                { section: 'lineup', key: 'enabled', value: false }
            ],
            duration: 1500,
            condition: ctx => ctx.hasPlayers,
        },
    ],
};

// Triggered automatically when the match starts.
// Sets all presentation panels to hidden and configures the scoreboard + social media.
export const MATCH_START_SEQUENCE: Sequence = {
    id: 'MATCH_START',
    label: 'Inicio de partido',
    description: 'Oculta paneles de presentación y configura el marcador al iniciar el partido.',
    trigger: { type: 'domainEvent', event: 'MatchStarted' },
    defaultEnabled: true,
    steps: [
        {
            label: 'Ocultar paneles',
            changes: [
                ...ALL_PRESENTATION_PANELS,
            ],
            duration: 1000,
        },
        {
            label: 'Configurar marcador para el partido',
            changes: [
                { section: 'scoreboard', key: 'enabled', value: true },
                { section: 'scoreboard', key: 'type', value: 'vertical-table' },
                { section: 'scoreboard', key: 'position', value: 'bottom-left' },
                { section: 'scoreboard', key: 'showHistory', value: true },
                { section: 'socialMedia', key: 'enabled', value: true },
            ],
            duration: 30000,
        },
        {
            label: 'Ocultar sets previos',
            changes: [
                { section: 'scoreboard', key: 'showHistory', value: false },
            ],
            duration: 0,
        },
    ],
};

// Triggered automatically on a timeout call.
// Hides the scoreboard, shows sponsors for 30 seconds, then restores the scoreboard.
export const TIMEOUT_SEQUENCE: Sequence = {
    id: 'TIMEOUT',
    label: 'Tiempo muerto',
    description: 'Oculta el marcador y muestra patrocinadores durante 30 segundos. Restaura el marcador al finalizar.',
    trigger: { type: 'domainEvent', event: 'TimeoutCalled' },
    defaultEnabled: true,
    snapshotSections: ['scoreboard', 'socialMedia'],
    steps: [
        {
            label: 'Espera',
            changes: [{ section: 'scoreboard', key: 'enabled', value: true }],
            duration: 5500,
        },
        {
            label: 'Ocultar marcador',
            changes: [{ section: 'scoreboard', key: 'enabled', value: false }],
            duration: 500,
        },
        {
            label: 'Mostrar patrocinadores',
            changes: [{ section: 'sponsors', key: 'enabled', value: true }],
            duration: 12000,
        },
        {
            label: 'Mostrar splash de subscripción',
            changes: [
                { section: 'subscribe', key: 'position', value: 'bottom-right' },
                { section: 'subscribe', key: 'enabled', value: true }
            ],
            duration: 0,
            condition: () => Math.random() >= 0.5,
        },
        {
            label: 'Mostrar patrocinadores',
            changes: [{ section: 'sponsors', key: 'enabled', value: true }],
            duration: 12000,
        },
        {
            label: 'Ocultar patrocinadores',
            changes: [
                { section: 'sponsors', key: 'enabled', value: false },
                { section: 'subscribe', key: 'enabled', value: false },
            ],
            duration: 1000,
        },
    ],
};

// Triggered automatically when a set ends (match not yet decided).
// Hides all panels, shows the afterMatch panel for 1 minute, then shows sponsors + scoreboard with history.
export const SET_END_SEQUENCE: Sequence = {
    id: 'SET_END',
    label: 'Fin de set',
    description: 'Al acabar un set, oculta todos los paneles, muestra el panel de resultados durante 1 minuto, y luego muestra patrocinadores y el marcador con historial de sets.',
    trigger: { type: 'domainEvent', event: 'SetEnded' },
    defaultEnabled: true,
    resetOnStop: ['afterMatch', 'sponsors'],
    steps: [
        {
            label: 'Establecer estado inicial',
            changes: [
                ...ALL_PRESENTATION_PANELS,
            ],
            duration: 1000,
        },
        {
            label: 'Mostrar panel de resultados',
            changes: [
                { section: 'afterMatch', key: 'showStats', value: false },
                { section: 'afterMatch', key: 'enabled', value: true },
            ],
            duration: 0,
        },
        {
            label: 'Mostrar panel de resultados SIN estadísticas',
            changes: [
                { section: 'afterMatch', key: 'enabled', value: true },
            ],
            duration: 15000,                    //Different display time depending on whether there are stats or not
            condition: ctx => !ctx.hasMatchStats,
        },
        {
            label: 'Mostrar panel de resultados CON estadísticas',
            changes: [
                { section: 'afterMatch', key: 'showStats', value: true },
                { section: 'afterMatch', key: 'enabled', value: true },
            ],
            duration: 60000,                    //Different display time depending on whether there are stats or not
            condition: ctx => ctx.hasMatchStats,
        },
        {
            label: 'Ocultar panel de resultados',
            changes: [{ section: 'afterMatch', key: 'enabled', value: false }],
            duration: 1000,
        },
        {
            label: 'Mostrar patrocinadores y marcador',
            changes: [
                { section: 'sponsors', key: 'enabled', value: true },
                { section: 'scoreboard', key: 'enabled', value: true },
                { section: 'scoreboard', key: 'showHistory', value: true },
            ],
            duration: 1000,
        },
        {
            label: 'Mostrar splash de subscripción',
            changes: [
                { section: 'subscribe', key: 'position', value: 'bottom-right' },
                { section: 'subscribe', key: 'enabled', value: true }
            ],
            duration: 0,
            condition: () => Math.random() >= 0.5,
        },
    ],
};

// Triggered automatically when the match ends.
// Hides all panels, shows the afterMatch panel for 1 minute, then shows sponsors (no scoreboard).
export const MATCH_END_SEQUENCE: Sequence = {
    id: 'MATCH_END',
    label: 'Fin de partido',
    description: 'Al terminar el partido, oculta todos los paneles, muestra el panel de resultados durante 1 minuto, y luego muestra patrocinadores.',
    trigger: { type: 'domainEvent', event: 'MatchEnded' },
    defaultEnabled: true,
    resetOnStop: ['afterMatch'],
    steps: [
        {
            label: 'Establecer estado inicial',
            changes: [
                ...ALL_PRESENTATION_PANELS,
            ],
            duration: 1000,
        },
        {
            label: 'Mostrar panel de resultados',
            changes: [
                { section: 'afterMatch', key: 'showStats', value: false },
                { section: 'afterMatch', key: 'enabled', value: true },
            ],
            duration: 0,
        },
        {
            label: 'Mostrar panel de resultados SIN estadísticas',
            changes: [
                { section: 'afterMatch', key: 'enabled', value: true },
            ],
            duration: 15000,                    //Different display time depending on whether there are stats or not
            condition: ctx => !ctx.hasMatchStats,
        },
        {
            label: 'Mostrar panel de resultados CON estadísticas',
            changes: [
                { section: 'afterMatch', key: 'showStats', value: true },
                { section: 'afterMatch', key: 'enabled', value: true },
            ],
            duration: 60000,                    //Different display time depending on whether there are stats or not
            condition: ctx => ctx.hasMatchStats,
        },
        {
            label: 'Ocultar panel de resultados',
            changes: [{ section: 'afterMatch', key: 'enabled', value: false }],
            duration: 1000,
        },
        {
            label: 'Mostrar patrocinadores',
            changes: [{ section: 'sponsors', key: 'enabled', value: true }],
            duration: 1000,
        },
        {
            label: 'Mostrar splash de subscripción',
            changes: [
                { section: 'subscribe', key: 'position', value: 'bottom-right' },
                { section: 'subscribe', key: 'enabled', value: true }
            ],
            duration: 0,
            condition: () => Math.random() >= 0.5,
        },
    ],
};

export const ALL_SEQUENCES: Sequence[] = [
    PRE_MATCH_SEQUENCE,
    MATCH_START_SEQUENCE,
    TIMEOUT_SEQUENCE,
    SET_END_SEQUENCE,
    MATCH_END_SEQUENCE,
];
