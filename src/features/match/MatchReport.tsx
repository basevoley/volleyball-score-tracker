import React from 'react';
import { pdf, Svg, Path, Circle, Rect, G, Text as SvgText, Polygon } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { TeamKey, TeamRecord, RawTeamStats, SetStats, HistoryEntry } from '../../types';
import { computeEffectiveness } from '../../domain/match/stats';

type ReportEvent = { type: 'rally' } | { type: 'fault' | 'timeout' | 'substitution'; team: TeamKey };

const toReportEvent = (entry: HistoryEntry): ReportEvent => {
    if (entry.entryType === 'timeout') return { type: 'timeout', team: entry.team };
    if (entry.entryType === 'substitution') return { type: 'substitution', team: entry.team };
    if (entry.entryType === 'rally' && entry.faultingTeam) return { type: 'fault', team: entry.faultingTeam };
    return { type: 'rally' };
};
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
        display: 'flex',
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

interface ReportProps {
    teams: TeamRecord<string>;
    teamColors: TeamRecord<string>;
    statistics: TeamRecord<RawTeamStats>;
    setScores: { teamA: number; teamB: number }[];
    setStats: SetStats[];
}

interface TimelineSVGProps {
    history: HistoryEntry[];
    teams: TeamRecord<string>;
    teamColors: TeamRecord<string>;
}

const MatchReportDocument = ({ teams, teamColors, statistics, setScores, setStats }: ReportProps) => {
    const computedTotal = {
        teamA: computeEffectiveness(statistics.teamA, statistics.teamB),
        teamB: computeEffectiveness(statistics.teamB, statistics.teamA),
    };
    return (
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
                                <Text style={styles.tableCell}>{String((computedTotal.teamA as unknown as Record<string, unknown>)[stat.key])}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{String((computedTotal.teamB as unknown as Record<string, unknown>)[stat.key])}</Text>
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
                {setStats && setStats.map((set, setIndex) => {
                    const computedSet = {
                        teamA: computeEffectiveness(set.statistics.teamA, set.statistics.teamB),
                        teamB: computeEffectiveness(set.statistics.teamB, set.statistics.teamA),
                    };
                    return (
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
                                                <Text style={styles.tableCell}>{String((computedSet.teamA as unknown as Record<string, unknown>)[stat.key])}</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>{String((computedSet.teamB as unknown as Record<string, unknown>)[stat.key])}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Point evolution chart for the set */}
                            {set.history && set.history.length > 0 && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={{ fontSize: 12, marginBottom: 6 }}>Evolución de puntos (por rally)</Text>
                                    <SetTimelineSVG history={set.history} teams={teams} teamColors={teamColors} />
                                </View>
                            )}
                        </View>
                    </Page>
                    );
                })}
    </Document>
    );
};

// Simple SVG timeline renderer for PDFs using @react-pdf/renderer primitives
const SetTimelineSVG = ({ history, teams, teamColors }: TimelineSVGProps) => {
    const width = 480;
    const height = 160; // reduced height
    const padding = 12;
    const iconArea = 18; // reserved space above the plot for event icons
    const legendHeight = 30; // reduced legend space
    const leftMargin = 25; // space for y-axis labels

    // Extract score arrays from history (history entries store a `scores` object)
    const pointsA = history.map(h => (h && h.scores && typeof h.scores.teamA === 'number' ? h.scores.teamA : 0));
    const pointsB = history.map(h => (h && h.scores && typeof h.scores.teamB === 'number' ? h.scores.teamB : 0));
    const allPoints = [...pointsA, ...pointsB];
    const rawMax = Math.max(1, ...allPoints);
    // round up max to nearest multiple of 5 for nicer ticks
    const maxScore = Math.ceil(rawMax / 5) * 5 || 5;
    const n = Math.max(1, history.length);

    const svgWidth = width; // use full width
    const topPadding = padding + iconArea; // start of plotting area
    const bottomY = height - legendHeight; // x axis position (leave room for legend)

    const yForValue = (v: number) => topPadding + ((maxScore - v) * (bottomY - topPadding)) / maxScore;

    // x coordinate function for the svg plotting width
    const xForIndexSvg = (i: number) => leftMargin + (i * (svgWidth - leftMargin - padding)) / Math.max(1, n - 1);

    // ticks every 5 points
    const yTicks = [];
    for (let t = 0; t <= maxScore; t += 5) {
        yTicks.push(t);
    }

    return (
        <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Svg width={svgWidth} height={height}>
                {/* background */}
                <Path d={`M0 0 H${svgWidth} V${height} H0 Z`} fill="#ffffff" stroke="#f0f0f0" />

                {/* horizontal grid and y-axis ticks/labels */}
                {yTicks.map((tick, i) => {
                    const y = yForValue(tick);
                    return (
                        <G key={`tick-${i}`}>
                            <Path d={`M${leftMargin} ${y} H${svgWidth - padding}`} stroke="#eeeeee" strokeWidth={0.5} />
                            <Path d={`M${leftMargin - 4} ${y} H${leftMargin}`} stroke="#333" strokeWidth={0.6} />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <SvgText {...{ x: leftMargin - 8, y: y + 3, fontSize: 8, fill: '#333', textAnchor: 'end' } as any}>{String(tick)}</SvgText>
                        </G>
                    );
                })}

                {/* axes */}
                <Path d={`M${leftMargin} ${topPadding} V${bottomY}`} stroke="#333" strokeWidth={0.8} />
                <Path d={`M${leftMargin} ${bottomY} H${svgWidth - padding}`} stroke="#333" strokeWidth={0.8} />

                {/* team lines */}
                {(() => {
                    const pathForSvg = (points: number[]) => points.map((p: number, i: number) => `${i === 0 ? 'M' : 'L'} ${xForIndexSvg(i)} ${yForValue(p)}`).join(' ');
                    const pathASvg = pathForSvg(pointsA);
                    const pathBSvg = pathForSvg(pointsB);
                    return (
                        <G>
                            <Path d={pathASvg} stroke={teamColors.teamA} strokeWidth={2} fill="none" />
                            <Path d={pathBSvg} stroke={teamColors.teamB} strokeWidth={2} fill="none" />

                            {/* markers and event lines/icons */}
                            {pointsA.map((p, i) => {
                                const x = xForIndexSvg(i);
                                const yA = yForValue(pointsA[i]);
                                const yB = yForValue(pointsB[i]);
                                const entry = history[i];
                                const ev = entry ? toReportEvent(entry) : ({ type: 'rally' } as ReportEvent);
                                const eventColor = ev.type !== 'rally' && (ev as { team: TeamKey }).team === 'teamA' ? teamColors.teamA : teamColors.teamB;

                                return (
                                    <G key={`pt-${i}`}>
                                        {/* event vertical dashed line */}
                                        {(ev.type === 'fault' || ev.type === 'timeout' || ev.type === 'substitution') && (
                                            <Path d={`M${x} ${topPadding} V${bottomY}`} stroke={eventColor} strokeWidth={1} strokeDasharray="3,2" />
                                        )}

                                        {/* event icon placed in the reserved icon area above the chart */}
                                        {ev.type === 'fault' && (
                                            <Path d={`M${x - 6} ${padding + 2} L${x + 6} ${padding + 14} M${x + 6} ${padding + 2} L${x - 6} ${padding + 14}`} stroke={eventColor} strokeWidth={1.2} />
                                        )}
                                        {ev.type === 'timeout' && (
                                            <G>
                                                <Rect x={x - 5} y={padding + 2} width={3} height={10} fill={eventColor} />
                                                <Rect x={x + 2} y={padding + 2} width={3} height={10} fill={eventColor} />
                                            </G>
                                        )}
                                        {ev.type === 'substitution' && (
                                            <G>
                                                <Polygon points={`${x - 6},${padding + 7} ${x - 1},${padding + 2} ${x - 1},${padding + 12}`} fill={eventColor} />
                                                <Polygon points={`${x + 6},${padding + 7} ${x + 1},${padding + 2} ${x + 1},${padding + 12}`} fill={eventColor} />
                                            </G>
                                        )}

                                        {/* Team A marker - empty circle */}
                                        <Circle cx={x} cy={yA} r={3} fill={teamColors.teamA} />

                                        {/* Team B marker - empty circle */}
                                        <Circle cx={x} cy={yB} r={3} fill={teamColors.teamB} />
                                    </G>
                                );
                            })}
                        </G>
                    );
                })()}
            </Svg>

            {/* Legend placed below the chart - compact horizontal layout */}
            <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                paddingTop: 4,
                paddingHorizontal: leftMargin,
                gap: 12,
                alignItems: 'center'
            }}>
                {/* Team A */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Svg width={12} height={12}>
                        <Circle cx={6} cy={6} r={5} fill={teamColors.teamA} />
                    </Svg>
                    <Text style={{ fontSize: 9, marginLeft: 4 }}>{teams && teams.teamA ? teams.teamA : 'Team A'}</Text>
                </View>

                {/* Team B */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Svg width={12} height={12}>
                        <Circle cx={6} cy={6} r={5} fill={teamColors.teamB} />
                    </Svg>
                    <Text style={{ fontSize: 9, marginLeft: 4 }}>{teams && teams.teamB ? teams.teamB : 'Team B'}</Text>
                </View>

                {/* Fault */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Svg width={14} height={14}>
                        <Path d={`M2 2 L12 12 M12 2 L2 12`} stroke="#444" strokeWidth={1.2} />
                    </Svg>
                    <Text style={{ fontSize: 9, marginLeft: 4 }}>Falta</Text>
                </View>

                {/* Timeout */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Svg width={14} height={14}>
                        <Rect x={3} y={2} width={2.5} height={10} fill="#666" />
                        <Rect x={8.5} y={2} width={2.5} height={10} fill="#666" />
                    </Svg>
                    <Text style={{ fontSize: 9, marginLeft: 4 }}>Tiempo muerto</Text>
                </View>

                {/* Substitution */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Svg width={14} height={14}>
                        <Polygon points="2,7 6,3 6,11" fill="#444" />
                        <Polygon points="12,7 8,3 8,11" fill="#444" />
                    </Svg>
                    <Text style={{ fontSize: 9, marginLeft: 4 }}>Cambio</Text>
                </View>
            </View>
        </View>
    );
};

const MatchReport = ({ teams, teamColors, statistics, setScores, setStats }: ReportProps) => {
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const fileName = `${teams.teamA}_vs_${teams.teamB}_${currentDate}.pdf`;

    const handleDownload = async () => {
        const doc = <MatchReportDocument teams={teams} teamColors={teamColors} statistics={statistics} setScores={setScores} setStats={setStats} />;
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
