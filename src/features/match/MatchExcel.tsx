import React from 'react';
import ExcelJS from 'exceljs'; // Importar ExcelJS
import { saveAs } from 'file-saver'; // Importar saveAs para descargas en el navegador
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import type { TeamRecord, TeamStats, SetStats } from '../../types';

interface ExcelProps {
    teams: TeamRecord<string>;
    statistics: TeamRecord<TeamStats>;
    setScores: { teamA: number; teamB: number }[];
    setStats: SetStats[];
}

const stats = [
    { label: "Saques", key: "serve" },
    { label: "Puntos directos de saque", key: "ace" },
    { label: "Errores de saque", key: "serveError" },
    { label: "Recepciones", key: "reception" },
    { label: "Errores de recepcion", key: "receptionError" },
    { label: "Defensas", key: "dig" },
    { label: "Errores de defensa", key: "digError" },
    { label: "Ataques", key: "attack" },
    { label: "Puntos de ataque", key: "attackPoint" },
    { label: "Errores de ataque", key: "attackError" },
    { label: "Bloqueos intentados", key: "block" },
    { label: "Puntos de Bloqueo", key: "blockPoint" },
    { label: "Errores de Bloqueo", key: "blockOut" },
    { label: "Faltas cometidas", key: "fault" },
    { label: "Total errores cometidos", key: "selfErrors" },
    { label: "Efectividad del servicio", key: "serviceEffectiveness" },
    { label: "Efectividad del ataque", key: "attackEffectiveness" },
    { label: "Efectividad de la defensa", key: "defenseEffectiveness" },
];

// Hacer la función asíncrona para usar workbook.xlsx.writeBuffer()
const generateExcel = async (teams: TeamRecord<string>, statistics: TeamRecord<TeamStats>, setScores: { teamA: number; teamB: number }[], setStats: SetStats[]) => {
    const workbook = new ExcelJS.Workbook();
    // Opcional: añadir propiedades al libro de trabajo
    workbook.creator = 'Tu Aplicación';
    workbook.created = new Date();

    // --- Hoja de Estadísticas Totales ---
    const statsSheet = workbook.addWorksheet('Estadísticas Totales');
    statsSheet.columns = [
        { header: 'Estadísticas', key: 'label', width: 30 },
        { header: teams.teamA, key: 'teamA', width: 15 },
        { header: teams.teamB, key: 'teamB', width: 15 }
    ];

    const statsData = stats.map(stat => ({
        label: stat.label,
        teamA: (statistics.teamA as unknown as Record<string, unknown>)[stat.key],
        teamB: (statistics.teamB as unknown as Record<string, unknown>)[stat.key]
    }));
    statsSheet.addRows(statsData);

    // --- Hoja de Puntos por Set ---
    const setScoresSheet = workbook.addWorksheet('Puntos por Set');
    setScoresSheet.columns = [
        { header: 'Set', key: 'set', width: 10 },
        { header: teams.teamA, key: 'teamA', width: 12 },
        { header: teams.teamB, key: 'teamB', width: 12 }
    ];

    const setScoresData = setScores.map((setScore, index) => ({
        set: `Set ${index + 1}`,
        teamA: setScore.teamA,
        teamB: setScore.teamB
    }));
    setScoresSheet.addRows(setScoresData);

    // --- Hojas por Set y Evolución de Rallies ---
    if (setStats && setStats.length > 0) {
        setStats.forEach((set) => {
            // Hoja de estadísticas por set
            const perSetSheet = workbook.addWorksheet(`Set ${set.setNumber}`);
            perSetSheet.columns = [
                { header: 'Estadísticas', key: 'label', width: 30 },
                { header: teams.teamA, key: 'teamA', width: 15 },
                { header: teams.teamB, key: 'teamB', width: 15 }
            ];
            const perSetData = stats.map(stat => ({
                label: stat.label,
                teamA: set.statistics && set.statistics.teamA ? (set.statistics.teamA as unknown as Record<string, unknown>)[stat.key] : 'N/A',
                teamB: set.statistics && set.statistics.teamB ? (set.statistics.teamB as unknown as Record<string, unknown>)[stat.key] : 'N/A'
            }));
            perSetSheet.addRows(perSetData);

            // Hoja de evolución de rallies
            const rallyEvolutionSheet = workbook.addWorksheet(`Set ${set.setNumber} - Rallies`);
            rallyEvolutionSheet.columns = [
                { header: 'Rally #', key: 'rally', width: 10 },
                { header: teams.teamA, key: 'teamA', width: 12 },
                { header: teams.teamB, key: 'teamB', width: 12 },
                { header: 'Evento', key: 'event', width: 25 }
            ];
            const rallyEvolutionData = set.history.map((entry, idx) => {
                let eventDescription = 'Rally';
                if (entry.event?.type === 'fault') {
                    eventDescription = `Falta (${entry.event.team === 'teamA' ? teams.teamA : teams.teamB})`;
                } else if (entry.event?.type === 'timeout') {
                    eventDescription = `Tiempo muerto (${entry.event.team === 'teamA' ? teams.teamA : teams.teamB})`;
                } else if (entry.event?.type === 'referee-call') {
                    eventDescription = 'Llamada del árbitro';
                }
                return {
                    rally: idx + 1,
                    teamA: entry.scores?.teamA ?? 'N/A',
                    teamB: entry.scores?.teamB ?? 'N/A',
                    event: eventDescription
                };
            });
            rallyEvolutionSheet.addRows(rallyEvolutionData);
        });
    }

    // Generar el archivo Excel como buffer y descargarlo
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const fileName = `${teams.teamA}_vs_${teams.teamB}_${currentDate}.xlsx`;
    
    // Usar file-saver para la descarga
    saveAs(blob, fileName);
};

const MatchExcel = ({ teams, statistics, setScores, setStats }: ExcelProps) => (
    <button onClick={() => generateExcel(teams, statistics, setScores, setStats)} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        <FontAwesomeIcon icon={faFileExcel} style={{ marginRight: '5px' }} />
        Descargar XLSX
    </button>);

export default MatchExcel;
