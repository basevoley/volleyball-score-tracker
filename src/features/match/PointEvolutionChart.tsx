import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Customized } from 'recharts';
import type { HistoryEntry, TeamKey, TeamRecord } from '../../types';

type ChartEvent = { type: 'rally' } | { type: 'fault' | 'timeout' | 'substitution'; team: TeamKey };

const toChartEvent = (entry: HistoryEntry): ChartEvent => {
    if (entry.entryType === 'timeout') return { type: 'timeout', team: entry.team };
    if (entry.entryType === 'substitution') return { type: 'substitution', team: entry.team };
    if (entry.entryType === 'rally' && entry.faultingTeam) return { type: 'fault', team: entry.faultingTeam };
    return { type: 'rally' };
};

interface Props {
  history?: HistoryEntry[];
  teams: TeamRecord<string>;
  teamColors: TeamRecord<string>;
}

// Per-set timeline chart with event labels and optimized mobile layout
function PointEvolutionChart({ history = [], teams, teamColors }: Props) {
  let data = history.map((h, i) => ({
        rally: i + 1,
        teamA: h.scores.teamA,
        teamB: h.scores.teamB,
        event: toChartEvent(h),
        timestamp: h.timestamp,
      }));
  data.unshift({
        rally: 0,
        teamA: 0,
        teamB: 0,
        event: { type: 'rally' } as ChartEvent,
        timestamp: 0,
      });

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: (typeof data)[0] }>; label?: number }) => {
    if (!active || !payload || payload.length === 0) return null;
    const p = payload[0].payload;
    const eventLabel = p.event.type === 'fault' ? 'Falta' : p.event.type === 'timeout' ? 'Tiempo muerto' : 'Cambio';
    return (
      <div style={{ background: 'white', border: '1px solid #ccc', padding: 8, fontSize: 12 }}>
        <div style={{ fontWeight: 700 }}>Rally {label}</div>
        <div>{teams.teamA}: {p.teamA}</div>
        <div>{teams.teamB}: {p.teamB}</div>
        {p.event && p.event.type !== 'rally' && (
          <div style={{ marginTop: 6 }}><strong>{eventLabel}</strong> {teams[(p.event as { type: string; team: TeamKey }).team]}</div>
        )}
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    const hasEvent = payload && payload.event && payload.event.type !== 'rally' && (payload.event as { type: string; team: TeamKey }).team === dataKey;
    const fill = teamColors[dataKey as 'teamA' | 'teamB'];// === 'teamA' ? '#1976d2' : '#d32f2f';
    return (
      <circle cx={cx} cy={cy} r={hasEvent ? 5 : 2.5} fill={fill} stroke={hasEvent ? '#333' : 'none'} strokeWidth={1} />
    );
  };

  return (
    <div style={{ width: '100%', height: 180, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* Mantenemos un margen superior generoso */}
        <LineChart data={data} margin={{ top: 30, right: 8, left: 6, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rally" label={{ value: 'Rally', position: 'insideBottomRight', offset: -6 }} tick={{ fontSize: 10 }} />
          <YAxis width={30} label={{ value: 'Puntos', angle: -90, position: 'insideLeft', offset: 0 }} allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="teamA" stroke={teamColors.teamA} dot={renderDot} isAnimationActive={false} strokeWidth={2} />
          <Line type="monotone" dataKey="teamB" stroke={teamColors.teamB} dot={renderDot} isAnimationActive={false} strokeWidth={2} />

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Customized component={(props: any) => {
            // Acceso CORREGIDO a las escalas (del código anterior)
            const xScale = props.xAxisMap[Object.keys(props.xAxisMap)[0]].scale;
            const yScale = props.yAxisMap[Object.keys(props.yAxisMap)[0]].scale;

            // Accedemos a la altura total del gráfico para calcular la posición superior
            const { height, margin } = props;

            if (!xScale || !yScale || !height || !margin) return null;

            // Calculamos la coordenada Y superior absoluta usando el margen superior
            // iconY estará a 15px del borde superior del contenedor
            const iconY = margin.top - 15;

            return (
              <g>
                {data.map((d, i) => {
                  if (!d.event || d.event.type === 'rally') return null;
                  const eventTeam = d.event.team;
                  const isFault = d.event.type === 'fault';
                  const isTimeout = d.event.type === 'timeout';
                  const isSub = d.event.type === 'substitution';
                  if (!isFault && !isTimeout && !isSub) return null;

                  if (!eventTeam) return null;
                  const cx = xScale(d.rally);
                  const color = teamColors[eventTeam as 'teamA' | 'teamB'];
                  const eventLabel = isFault ? `Falta (${teams[eventTeam as 'teamA' | 'teamB']})` : isTimeout ? `Tiempo Muerto (${teams[eventTeam as 'teamA' | 'teamB']})` : `Cambio (${teams[eventTeam as 'teamA' | 'teamB']})`;

                  return (
                    <g key={`evt-${i}`} style={{ cursor: 'pointer' }}>
                      <line
                        x1={cx}
                        y1={yScale(0)}
                        x2={cx}
                        y2={iconY + 8} // La línea termina un poco antes del centro del icono
                        stroke={color}
                        strokeWidth={1}
                        strokeDasharray="4 4" />

                      {/* SVG symbol: X for fault, rect/lines for timeout */}
                      {isFault ? (
                        // Fault: X symbol (centrado en iconY)
                        <g transform={`translate(${cx}, ${iconY})`}>
                          <line x1={-5} y1={-5} x2={5} y2={5} stroke={color} strokeWidth={2} />
                          <line x1={5} y1={-5} x2={-5} y2={5} stroke={color} strokeWidth={2} />
                        </g>
                      ) : isTimeout ? (
                        // Timeout: two vertical lines (pause icon) (centrado en iconY)
                        <g transform={`translate(${cx}, ${iconY})`}>
                          <rect x={-4} y={-5} width={2} height={10} fill={color} />
                          <rect x={2} y={-5} width={2} height={10} fill={color} />
                        </g>
                      ) : (
                        // Substitution: two vertical lines (pause icon) (centrado en iconY)
                        <g transform={`translate(${cx}, ${iconY})`}>
                          <polygon points="-6,0 -1,-5 -1,5" fill={color} />
                          <polygon points="6,0 1,-5 1,5" fill={color} />
                        </g>
                      )}

                      <title>{eventLabel}</title>
                      <rect x={cx - 8} y={iconY - 8} width={16} height={16} fill="transparent" pointerEvents="all" style={{ cursor: 'pointer' }}>
                        <title>{eventLabel}</title>
                      </rect>
                    </g>
                  );
                })}
              </g>
            );
          }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PointEvolutionChart