import React from 'react';
import styled from 'styled-components';
import type { TeamRecord, TeamStats } from '../../types';

const StatisticsContainer = styled.div`
  width: 100%;
  margin-top: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  background-color: #4CAF50;
  color: white;
  padding: 8px;
  text-align: center;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f2f2f2;
  }
`;

const TableCell = styled.td`
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
`;

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

interface Props {
  teams: TeamRecord<string>;
  statistics: TeamRecord<TeamStats>;
}

const Statistics = ({ teams, statistics }: Props) => {
  return (
    <StatisticsContainer>
      <div id="statistics-table">
        <Table>
          <thead>
            <tr>
              <TableHeader>Estadísticas</TableHeader>
              <TableHeader>{teams.teamA}</TableHeader>
              <TableHeader>{teams.teamB}</TableHeader>
            </tr>
          </thead>
          <tbody>

            {stats.map((stat, index) => (
                        <TableRow key={index}>
                            <TableCell>{stat.label}</TableCell>
                            <TableCell>{(statistics.teamA as unknown as Record<string, unknown>)[stat.key] as string | number}</TableCell>
                            <TableCell>{(statistics.teamB as unknown as Record<string, unknown>)[stat.key] as string | number}</TableCell>
                        </TableRow>
                    ))}
          </tbody>
        </Table>
      </div>
    </StatisticsContainer>
  );
};

export default Statistics;
