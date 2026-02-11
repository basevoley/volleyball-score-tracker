import React, { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Button,
  Slide,
  DialogTitle,
  useMediaQuery, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssessmentIcon from '@mui/icons-material/Assessment';

const DownloadsContainer = styled.div`
  display: flex;
  align-items: end;
  justify-content: end;
  width: 100%;
  padding-top: 20px;
`;

const StatsContainer = styled.div`
  width: 100%;
  // margin-top: 16px;
`;

const TriggerButton = styled(Button)`
  && {
    width: 100%;
    // padding: 12px;
    border-radius: 8px;
    text-transform: none;
    font-size: 1rem;
    font-weight: 600;
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #e0e0e0;
    transition: all 0.2s ease;

    &:hover {
      background-color: #eeeeee;
      border-color: #bdbdbd;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
`;

// Transition component for slide up animation
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function StatsHandler(props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <StatsContainer>
      {/* Integrated trigger button */}
      <TriggerButton
        onClick={handleDialogOpen}
        startIcon={<AssessmentIcon />}
        endIcon={<ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} />}
        variant="outlined"
      >
        Estadísticas
      </TriggerButton>

      {/* Full-screen dialog with slide transition */}
      <Dialog
        fullScreen={isMobile}
        fullWidth
        maxWidth={'md'}
        open={dialogOpen}
        onClose={handleDialogClose}
        slots={{
          transition: Transition,
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#f9f9f9'
            }
          }
        }}
        scroll='paper'
      >
        <DialogTitle id="scroll-dialog-title" sx={{
          fontSize: '1rem',
          fontWeight: '600',
          backgroundColor: '#f5f5f5',
          color: '#333',
        }}
        >
          <Box display={'flex'} flexDirection={'row'} width={'100%'} alignItems={'center'} justifyContent={'space-evenly'}>
            <AssessmentIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Estadísticas y Descargas
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleDialogClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Scrollable content */}
        <DialogContent sx={{ p: 2 }} dividers>
          <DownloadsContainer>
            <MatchReport
              teams={props.teams}
              teamColors={props.teamColors}
              statistics={props.localMatchData.statistics}
              setScores={props.localMatchData.setScores}
              setStats={props.localMatchData.setStats}
            />
            <MatchExcel
              teams={props.teams}
              statistics={props.localMatchData.statistics}
              setScores={props.localMatchData.setScores}
              setStats={props.localMatchData.setStats}
            />
          </DownloadsContainer>

          {!props.localMatchData.winner && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  mb: 2
                }}
              >
                Set {props.localMatchData.setsWon.teamA + props.localMatchData.setsWon.teamB + 1} - Estadísticas en Vivo
              </Typography>
              <Statistics teams={props.teams} statistics={props.localMatchData.currentSetStats} />
              <Box sx={{ mt: 2 }}>
                <PointEvolutionChart
                  history={props.localMatchData.currentSetHistory}
                  teams={props.teams}
                  teamColors={props.teamColors}
                />
              </Box>
            </Box>
          )}

          {props.localMatchData.setStats && props.localMatchData.setStats.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Resumen de sets
              </Typography>
              {props.localMatchData.setStats.map((set, index) => (
                <Accordion
                  key={index}
                  expanded={props.expandedSetIndex === index}
                  sx={{
                    mb: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    overflow: 'hidden',
                    '&:before': {
                      display: 'none',
                    }
                  }}
                  onChange={(e, isExpanded) => props.setExpandedSetIndex(isExpanded ? index : null)}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: '#f6f6f6',
                      padding: '8px 12px',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          fontWeight: 700,
                          display: 'flex',
                          gap: 1,
                          alignItems: 'center',
                        }}
                      >
                        <span>Set {set.setNumber}:</span>
                        <span style={{ fontWeight: 600 }}>{props.teams.teamA}</span>
                        <span style={{ color: '#666' }}>{set.scores.teamA}</span>
                        <span style={{ margin: '0 6px' }}>-</span>
                        <span style={{ fontWeight: 600 }}>{props.teams.teamB}</span>
                        <span style={{ color: '#666' }}>{set.scores.teamB}</span>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      padding: 1.5,
                      display: 'block',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Statistics teams={props.teams} statistics={set.statistics} />
                    {set.history && set.history.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <PointEvolutionChart
                          history={set.history}
                          teams={props.teams}
                          teamColors={props.teamColors}
                        />
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 3, mb: 2 }}>
            <Accordion
              sx={{
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                '&:before': {
                  display: 'none',
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: '#f6f6f6',
                  padding: '8px 12px'
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  Estadísticas Totales del Partido
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  padding: 1.5,
                  display: 'block',
                  backgroundColor: '#fff',
                }}
              >
                <Statistics teams={props.teams} statistics={props.localMatchData.statistics} />
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
      </Dialog>
    </StatsContainer >
  );
}

export default StatsHandler;
