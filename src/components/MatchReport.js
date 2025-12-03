import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
// import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

// Styles for the PDF document
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 20,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '33%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        backgroundColor: '#4CAF50',
        padding: 5,
    },
    tableCol: {
        width: '33%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    tableCellHeader: {
        margin: 'auto',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    tableCell: {
        margin: 'auto',
        fontSize: 10,
    },
});

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

const MatchReportDocument = ({ teams, statistics, setScores }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                <Text style={{ fontSize: 16, marginBottom: 10 }}>Informe de partido</Text>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={styles.tableColHeader}>
                            <Text style={styles.tableCellHeader}>Estadísticas</Text>
                        </View>
                        <View style={styles.tableColHeader}>
                            <Text style={styles.tableCellHeader}>{teams.teamA}</Text>
                        </View>
                        <View style={styles.tableColHeader}>
                            <Text style={styles.tableCellHeader}>{teams.teamB}</Text>
                        </View>
                    </View>
                    {stats.map((stat, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{stat.label}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{statistics.teamA[stat.key]}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{statistics.teamB[stat.key]}</Text>
                            </View>
                        </View>
                    ))}
                </View>
                <Text style={{ fontSize: 14, marginTop: 20 }}>Puntos por Set:</Text>
                {setScores.map((setScore, index) => (
                    <Text key={index} style={{ fontSize: 12 }}>
                        Set {index + 1}: {teams.teamA} {setScore.teamA} - {teams.teamB} {setScore.teamB}
                    </Text>
                ))}
            </View>
        </Page>
    </Document>
);

const MatchReport = ({ teams, statistics, setScores }) => {
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const fileName = `${teams.teamA}_vs_${teams.teamB}_${currentDate}.pdf`;

    const handleDownload = async () => {
        const doc = <MatchReportDocument teams={teams} statistics={statistics} setScores={setScores} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleDownload}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '5px 10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
            }}
        >
            <FontAwesomeIcon icon={faFilePdf} style={{ marginRight: '5px' }} />
            Descargar PDF
        </button>
    );
};

export default MatchReport;
