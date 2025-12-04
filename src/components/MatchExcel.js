import React from 'react';
import * as XLSX from 'xlsx';
// import DescriptionIcon from '@mui/icons-material/Description';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';

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

const generateExcel = (teams, statistics, setScores, setStats) => {
    const workbook = XLSX.utils.book_new();

    // Create statistics sheet
    const statsData = [
        ['Estadísticas', teams.teamA, teams.teamB],
        ...stats.map(stat => [
            stat.label,
            statistics.teamA[stat.key],
            statistics.teamB[stat.key]
        ])
    ];
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas Totales');

    // Create set scores sheet
    const setScoresData = [
        ['Set', teams.teamA, teams.teamB],
        ...setScores.map((setScore, index) => [
            `Set ${index + 1}`,
            setScore.teamA,
            setScore.teamB
        ])
    ];
    const setScoresSheet = XLSX.utils.aoa_to_sheet(setScoresData);
    XLSX.utils.book_append_sheet(workbook, setScoresSheet, 'Puntos por Set');

    // Create per-set statistics sheets and rally evolution sheets
    if (setStats && setStats.length > 0) {
      setStats.forEach((set) => {
        const perSetData = [
          ['Estadísticas', teams.teamA, teams.teamB],
          ...stats.map(stat => [
            stat.label,
            set.statistics && set.statistics.teamA ? set.statistics.teamA[stat.key] : 'N/A',
            set.statistics && set.statistics.teamB ? set.statistics.teamB[stat.key] : 'N/A'
          ])
        ];
        const perSetSheet = XLSX.utils.aoa_to_sheet(perSetData);
        XLSX.utils.book_append_sheet(workbook, perSetSheet, `Set ${set.setNumber}`);

        // Create rally evolution sheet for this set
        const rallyEvolutionData = [
          ['Rally #', teams.teamA, teams.teamB, 'Evento'],
          ...set.history.map((entry, idx) => [
            idx + 1,
            entry.scores?.teamA ?? 'N/A',
            entry.scores?.teamB ?? 'N/A',
            entry.event?.type === 'fault' 
              ? `Falta (${entry.event.team === 'teamA' ? teams.teamA : teams.teamB})`
              : entry.event?.type === 'timeout'
              ? `Tiempo muerto (${entry.event.team === 'teamA' ? teams.teamA : teams.teamB})`
              : entry.event?.type === 'referee-call'
              ? 'Llamada del árbitro'
              : 'Rally'
          ])
        ];
        const rallyEvolutionSheet = XLSX.utils.aoa_to_sheet(rallyEvolutionData);
        // Auto-fit columns (set reasonable widths)
        rallyEvolutionSheet['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, rallyEvolutionSheet, `Set ${set.setNumber} - Rallies`);
      });
    }

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    link.download = `${teams.teamA}_vs_${teams.teamB}_${currentDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const MatchExcel = ({ teams, statistics, setScores, setStats }) => (
    <button onClick={() => generateExcel(teams, statistics, setScores, setStats)} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        {/* <DescriptionIcon style={{ marginRight: '5px' }} /> */}
        <FontAwesomeIcon icon={faFileExcel} style={{ marginRight: '5px' }} />
        Descargar XLSX
    </button>);

export default MatchExcel;
