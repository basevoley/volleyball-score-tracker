import React from 'react';
import { pdf, Svg, Path, Circle, Rect, G, Text as SvgText } from '@react-pdf/renderer';
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

const MatchReportDocument = ({ teams, statistics, setScores, setStats }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                <Text style={{ fontSize: 16, marginBottom: 10 }}>Informe de partido - Estadísticas Totales</Text>
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
                                <View style={{ marginTop: 6 }}>
                                    <View style={styles.table}>
                                        <View style={styles.tableRow}>
                                            <View style={styles.tableColHeader}>
                                                <Text style={styles.tableCellHeader}>Set</Text>
                                            </View>
                                            <View style={styles.tableColHeader}>
                                                <Text style={styles.tableCellHeader}>{teams.teamA}</Text>
                                            </View>
                                            <View style={styles.tableColHeader}>
                                                <Text style={styles.tableCellHeader}>{teams.teamB}</Text>
                                            </View>
                                        </View>
                                        {setScores.map((setScore, index) => (
                                            <View style={styles.tableRow} key={index}>
                                                <View style={styles.tableCol}>
                                                    <Text style={styles.tableCell}>{`Set ${index + 1}`}</Text>
                                                </View>
                                                <View style={styles.tableCol}>
                                                    <Text style={styles.tableCell}>{setScore.teamA}</Text>
                                                </View>
                                                <View style={styles.tableCol}>
                                                    <Text style={styles.tableCell}>{setScore.teamB}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
            </View>
        </Page>
                {setStats && setStats.map((set, setIndex) => (
                    <Page size="A4" style={styles.page} key={setIndex}>
                        <View style={styles.section}>
                            <Text style={{ fontSize: 14, marginBottom: 10 }}>Set {set.setNumber} - {teams.teamA} {set.scores?.teamA ?? 'N/A'} - {teams.teamB} {set.scores?.teamB ?? 'N/A'}</Text>
                            <View style={{ marginTop: 6 }}>
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
                                                <Text style={styles.tableCell}>{set.statistics && set.statistics.teamA ? set.statistics.teamA[stat.key] : 'N/A'}</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>{set.statistics && set.statistics.teamB ? set.statistics.teamB[stat.key] : 'N/A'}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Point evolution chart for the set */}
                            {set.history && set.history.length > 0 && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={{ fontSize: 12, marginBottom: 6 }}>Evolución de puntos (por rally)</Text>
                                    <SetTimelineSVG history={set.history} teams={teams} />
                                </View>
                            )}
                        </View>
                    </Page>
                ))}
    </Document>
);

// Simple SVG timeline renderer for PDFs using @react-pdf/renderer primitives
const SetTimelineSVG = ({ history, teams }) => {
    const width = 480;
    const height = 140; // give more vertical room for icons
    const padding = 12;
    const iconArea = 18; // reserved space above the plot for event icons

    // Extract score arrays from history (history entries store a `scores` object)
    const pointsA = history.map(h => (h && h.scores && typeof h.scores.teamA === 'number' ? h.scores.teamA : 0));
    const pointsB = history.map(h => (h && h.scores && typeof h.scores.teamB === 'number' ? h.scores.teamB : 0));
    const allPoints = [...pointsA, ...pointsB];
    const rawMax = Math.max(1, ...allPoints);
    // round up max to nearest multiple of 5 for nicer ticks
    const maxScore = Math.ceil(rawMax / 5) * 5 || 5;
    const n = Math.max(1, history.length);

    const svgWidth = width - 120; // leave room for legend to the right
    const legendWidth = 110;

    const topPadding = padding + iconArea; // start of plotting area
    const bottomY = height - padding; // x axis position

    const yForValue = (v) => topPadding + ((maxScore - v) * (bottomY - topPadding)) / maxScore;

    // x coordinate function for the svg plotting width
    const xForIndexSvg = (i) => padding + (i * (svgWidth - padding * 2)) / Math.max(1, n - 1);

    // ticks every 5 points
    const yTicks = [];
    for (let t = 0; t <= maxScore; t += 5) {
        yTicks.push(t);
    }

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Svg width={svgWidth} height={height}>
                {/* background */}
                <Path d={`M0 0 H${svgWidth} V${height} H0 Z`} fill="#ffffff" stroke="#f0f0f0" />

                {/* horizontal grid and y-axis ticks/labels */}
                {yTicks.map((tick, i) => {
                    const y = yForValue(tick);
                    return (
                        <G key={`tick-${i}`}>
                            <Path d={`M${padding} ${y} H${svgWidth - padding}`} stroke="#eeeeee" strokeWidth={0.5} />
                            <Path d={`M${padding - 4} ${y} H${padding}`} stroke="#333" strokeWidth={0.6} />
                            <SvgText x={padding - 10} y={y + 3} fontSize={8} fill="#333">{String(tick)}</SvgText>
                        </G>
                    );
                })}

                {/* axes */}
                <Path d={`M${padding} ${topPadding} V${bottomY}`} stroke="#333" strokeWidth={0.8} />
                <Path d={`M${padding} ${bottomY} H${svgWidth - padding}`} stroke="#333" strokeWidth={0.8} />

                {/* team lines */}
                {(() => {
                    const pathForSvg = (points) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xForIndexSvg(i)} ${yForValue(p)}`).join(' ');
                    const pathASvg = pathForSvg(pointsA);
                    const pathBSvg = pathForSvg(pointsB);
                    return (
                        <G>
                            <Path d={pathASvg} stroke="#2b7cff" strokeWidth={2} fill="none" />
                            <Path d={pathBSvg} stroke="#ff6b6b" strokeWidth={2} fill="none" />

                            {/* markers and event lines/icons */}
                            {pointsA.map((p, i) => {
                                const x = xForIndexSvg(i);
                                const yA = yForValue(pointsA[i]);
                                const yB = yForValue(pointsB[i]);
                                const entry = history[i] || {};
                                const eventColor = entry.event && entry.event.team === 'teamA' ? '#2b7cff' : '#ff6b6b';
                                return (
                                    <G key={`pt-${i}`}>
                                        {/* markers */}
                                        <Circle cx={x} cy={yA} r={2.5} fill="#2b7cff" />
                                        <Circle cx={x} cy={yB} r={2.5} fill="#ff6b6b" />

                                        {/* event vertical dashed line */}
                                        {entry.event && (entry.event.type === 'fault' || entry.event.type === 'timeout') && (
                                            <Path d={`M${x} ${topPadding} V${bottomY}`} stroke={eventColor} strokeWidth={1} strokeDasharray="3,2" />
                                        )}

                                        {/* event icon placed in the reserved icon area above the chart */}
                                        {entry.event && entry.event.type === 'fault' && (
                                            <Path d={`M${x - 6} ${padding + 2} L${x + 6} ${padding + 14} M${x + 6} ${padding + 2} L${x - 6} ${padding + 14}`} stroke={eventColor} strokeWidth={1.2} />
                                        )}
                                        {entry.event && entry.event.type === 'timeout' && (
                                            <G>
                                                <Rect x={x - 5} y={padding + 2} width={3} height={10} fill={eventColor} />
                                                <Rect x={x - 1} y={padding + 2} width={3} height={10} fill={eventColor} />
                                            </G>
                                        )}
                                    </G>
                                );
                            })}
                        </G>
                    );
                })()}
            </Svg>

            {/* Legend placed to the right of the chart using SVG shapes to ensure consistent rendering */}
            <View style={{ width: legendWidth, paddingLeft: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Svg width={14} height={14}>
                        <Circle cx={7} cy={7} r={6} fill="#2b7cff" />
                    </Svg>
                    <Text style={{ fontSize: 10, marginLeft: 6 }}>{teams && teams.teamA ? teams.teamA : 'Team A'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Svg width={14} height={14}>
                        <Circle cx={7} cy={7} r={6} fill="#ff6b6b" />
                    </Svg>
                    <Text style={{ fontSize: 10, marginLeft: 6 }}>{teams && teams.teamB ? teams.teamB : 'Team B'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Svg width={18} height={18}>
                        <Path d={`M2 2 L16 16 M16 2 L2 16`} stroke="#444" strokeWidth={1.2} />
                    </Svg>
                    <Text style={{ fontSize: 10, marginLeft: 6 }}>Falta</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Svg width={18} height={18}>
                        <Rect x={3} y={3} width={3} height={12} fill="#666" />
                        <Rect x={10} y={3} width={3} height={12} fill="#666" />
                    </Svg>
                    <Text style={{ fontSize: 10, marginLeft: 6 }}>Tiempo muerto</Text>
                </View>
            </View>
        </View>
    );
};

const MatchReport = ({ teams, statistics, setScores, setStats }) => {
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const fileName = `${teams.teamA}_vs_${teams.teamB}_${currentDate}.pdf`;

    const handleDownload = async () => {
        const doc = <MatchReportDocument teams={teams} statistics={statistics} setScores={setScores} setStats={setStats} />;
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
