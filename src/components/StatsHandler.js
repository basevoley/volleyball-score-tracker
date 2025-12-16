import React from 'react';
import styled from 'styled-components';
import Statistics from './Statistics';
import MatchReport from './MatchReport';
import MatchExcel from './MatchExcel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PointEvolutionChart from './PointEvolutionChart';

const DownloadsContainer = styled.div`
display: flex;
    align-items: end;
    justify-content: end;
    width: 100%;
    padding-top: 20px;
`;

function StatsHandler(props) {
  return (<Accordion style={{
    width: '100%',
    marginTop: 16,
  }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Estadísticas y Descargas</Typography>
    </AccordionSummary>
    <AccordionDetails style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <DownloadsContainer>
        <MatchReport teams={props.teams} statistics={props.localMatchData.statistics} setScores={props.localMatchData.setScores} setStats={props.localMatchData.setStats} />
        <MatchExcel teams={props.teams} statistics={props.localMatchData.statistics} setScores={props.localMatchData.setScores} setStats={props.localMatchData.setStats} />
      </DownloadsContainer>
      <div style={{
        marginTop: 12,
        marginBottom: 8
      }}>
        <Typography variant="h6" style={{
          fontWeight: 600,
          color: '#333'
        }}>
          Set {props.localMatchData.setsWon.teamA + props.localMatchData.setsWon.teamB + 1} - Estadísticas en Vivo
        </Typography>
      </div>
      <Statistics teams={props.teams} statistics={props.localMatchData.currentSetStats} />

      {props.localMatchData.setStats && props.localMatchData.setStats.length > 0 && <div>
        <h3>Resumen de sets</h3>
        {props.localMatchData.setStats.map((set, index) => <Accordion key={index} expanded={props.expandedSetIndex === index} style={{
          marginBottom: 8,
          backgroundColor: '#ffffff',
          borderRadius: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }} onChange={(e, isExpanded) => props.setExpandedSetIndex(isExpanded ? index : null)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{
            backgroundColor: '#f6f6f6',
            padding: '8px 12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center'
            }}>
              <div style={{
                fontWeight: 700,
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              }}>
                <span>Set {set.setNumber}:</span>
                <span style={{
                  fontWeight: 600
                }}>{props.teams.teamA}</span>
                <span style={{
                  color: '#666'
                }}>{set.scores.teamA}</span>
                <span style={{
                  margin: '0 6px'
                }}>-</span>
                <span style={{
                  fontWeight: 600
                }}>{props.teams.teamB}</span>
                <span style={{
                  color: '#666'
                }}>{set.scores.teamB}</span>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails style={{
            padding: 12,
            display: 'block',
            backgroundColor: '#fff'
          }}>
            <Statistics teams={props.teams} statistics={set.statistics} />
            {set.history && set.history.length > 0 && 
            <div style={{ marginTop: 12 }}>
              <PointEvolutionChart history={set.history} teams={props.teams} />
            </div>
            }
          </AccordionDetails>
        </Accordion>)}
      </div>}

      <div>
        <Accordion style={{
          marginTop: 12,
          backgroundColor: '#ffffff',
          borderRadius: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{
            backgroundColor: '#f6f6f6',
            padding: '8px 12px'
          }}>
            <Typography style={{
              fontWeight: 600
            }}>Estadísticas Totales del Partido</Typography>
          </AccordionSummary>
          <AccordionDetails style={{
            padding: 12,
            display: 'block',
            backgroundColor: '#fff'
          }}>
            <Statistics teams={props.teams} statistics={props.localMatchData.statistics} />
          </AccordionDetails>
        </Accordion>
      </div>
    </AccordionDetails>
  </Accordion>);
}

export default StatsHandler;