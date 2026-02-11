import React from 'react';
import { Box, Button, Typography, Select, MenuItem, Avatar, Card, CardContent, IconButton, Tooltip, CardActions, Badge, ButtonGroup } from '@mui/material';
import { getContrastColor, isTooSimilar } from '../utils/colorUtils';
import { Add, Remove, TimerOutlined, SwapHoriz, Flag } from '@mui/icons-material';

function ScoreBoard({
  teams,
  teamLogos,
  teamColors,
  scores,
  setsWon,
  currentServer,
  ballPossession,
  matchStarted,
  onAdjustScore,
  maxSets,
  onSetsWonChange,
  onTimeout,
  onSubstitution,
  timeouts,
  substitutions,
  rallyStage,
  handleAction
}) {
  const handleSetsWonChange = (team, event) => {
    const newSetsWon = parseInt(event.target.value, 10);
    onSetsWonChange(team, newSetsWon);
  };

  const renderSetsWonOptions = () => {
    const maxValue = maxSets / 2;
    const options = [];
    for (let i = 0; i <= maxValue; i++) {
      options.push(<MenuItem key={i} value={i} dense>{i}</MenuItem>);
    }
    return options;
  };

  const getServingBorder = (isServing, color) => {
    const green = "#32CD32";
    if (isServing) {
      if (isTooSimilar(green, color)) {
        return `3px solid color-mix(in srgb, ${green}, yellow 50%)`;
      }
      return `3px solid ${green}`;
    }
    return `3px solid transparent`;
  };

  const getPossessionIndicatorBorder = (bgColor) => {
    const gold = "#FFD700";
    if (isTooSimilar(bgColor, gold)) {
      return '1px solid #ccc';
    }
    return 'none';
  };

  const getAdjustButtonBorder = (bgColor) => {
    const color = "#4CAF50";
    if (isTooSimilar(bgColor, color)) {
      return '1px solid #ffff';
    }
    return 'none';
  };

  const renderTeamScore = (teamKey) => {
    const color = teamColors[teamKey];
    const isPossession = ballPossession === teamKey;
    const isServing = currentServer === teamKey;
    const contrastColor = getContrastColor(color);

    return (
      <Card
        elevation={3}
        sx={{
          flex: 1,
          height: '100%', // Fuerza a ocupar el alto del contenedor flex padre  
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: getServingBorder(isServing, color),
          borderRadius: 2,
          ...(!matchStarted && {
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.1)'
            }
          })
        }}
      >
        <CardContent sx={{
          flexGrow: 1,
          padding: '8px !important',
          backgroundColor: color,
          color: contrastColor,
        }}>
          {/* Team Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              mt: 1
            }}
          >
            <Avatar
              src={teamLogos[teamKey]}
              alt={`${teams[teamKey]} logo`}
              sx={{
                width: 40,
                height: 40,
                mr: 1
              }}
            />
            <Typography fontWeight="bold" noWrap>
              {teams[teamKey]}
            </Typography>
          </Box>

          {/* Score and Controls */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // mb: 2
            }}
          >
            {teamKey === 'teamA' ? (
              <>
                {/* Adjust Buttons */}
                <ButtonGroup orientation="vertical" variant="outlined">
                  <Button
                    size="small"
                    disabled={!matchStarted}
                    onClick={() => onAdjustScore(teamKey, 1)}
                    sx={{
                      margin: '2px',
                      padding: '5px 10px',
                      minWidth: 'auto',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: getAdjustButtonBorder(color),
                      '&:hover': {
                        backgroundColor: '#45a049'
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        backgroundColor: '#ccc'
                      }
                    }}
                  >
                    <Add />
                  </Button>
                  <Button
                    size="small"
                    disabled={!matchStarted}
                    onClick={() => onAdjustScore(teamKey, -1)}
                    sx={{
                      margin: '2px',
                      padding: '5px 10px',
                      minWidth: 'auto',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: getAdjustButtonBorder(color),
                      '&:hover': {
                        backgroundColor: '#45a049'
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        backgroundColor: '#ccc'
                      }
                    }}
                  >
                    <Remove />
                  </Button>
                </ButtonGroup>
                {/* Score */}
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: '3em',
                    margin: '0 10px',
                    fontWeight: 'bold'
                  }}
                >
                  {scores[teamKey]}
                </Typography>

                {/* Sets Won */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    Sets:
                  </Typography>
                  <Select
                    size="small"
                    disabled={!matchStarted}
                    value={setsWon[teamKey]}
                    onChange={(event) => handleSetsWonChange(teamKey, event)}
                    sx={{
                      marginTop: '5px',
                      width: 'fit-content',
                      minWidth: '60px',
                      color: contrastColor,
                      '& .MuiSelect-select': {
                        padding: '5px'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: contrastColor
                      },
                      '& .MuiSvgIcon-root': {
                        color: contrastColor
                      }
                    }}
                  >
                    {renderSetsWonOptions()}
                  </Select>
                  {/* <Typography fontWeight="bold">
                    {setsWon[teamKey]}
                  </Typography> */}
                </Box>
              </>
            ) : (
              <>
                {/* Sets Won */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    Sets:
                  </Typography>
                  <Select
                    size="small"
                    disabled={!matchStarted}
                    value={setsWon[teamKey]}
                    onChange={(event) => handleSetsWonChange(teamKey, event)}
                    sx={{
                      marginTop: '5px',
                      width: 'fit-content',
                      minWidth: '60px',
                      color: contrastColor,
                      '& .MuiSelect-select': {
                        padding: '5px'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: contrastColor
                      },
                      '& .MuiSvgIcon-root': {
                        color: contrastColor
                      }
                    }}
                  >
                    {renderSetsWonOptions()}
                  </Select>
                  {/* <Typography fontWeight="bold">
                    {setsWon[teamKey]}
                  </Typography> */}
                </Box>

                {/* Score */}
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: '3em',
                    margin: '0 10px',
                    fontWeight: 'bold'
                  }}
                >
                  {scores[teamKey]}
                </Typography>

                {/* Adjust Buttons */}
                <ButtonGroup orientation="vertical" variant="outlined">
                  <Button
                    size="small"
                    disabled={!matchStarted}
                    onClick={() => onAdjustScore(teamKey, 1)}
                    sx={{
                      margin: '2px',
                      padding: '5px 10px',
                      minWidth: 'auto',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: getAdjustButtonBorder(color),
                      '&:hover': {
                        backgroundColor: '#45a049'
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        backgroundColor: '#ccc'
                      }
                    }}
                  >
                    <Add />
                  </Button>
                  <Button
                    size="small"
                    disabled={!matchStarted}
                    onClick={() => onAdjustScore(teamKey, -1)}
                    sx={{
                      margin: '2px',
                      padding: '5px 10px',
                      minWidth: 'auto',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: getAdjustButtonBorder(color),
                      '&:hover': {
                        backgroundColor: '#45a049'
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        backgroundColor: '#ccc'
                      }
                    }}
                  >
                    <Remove />
                  </Button>
                </ButtonGroup>
              </>
            )}
          </Box>
        </CardContent>
        <CardActions sx={{ pt: 2, justifyContent: 'space-evenly' }}>
          <Tooltip title={`Tiempo Muerto (${timeouts?.[teamKey] || 0}/2)`}>
            <span>
              <Badge badgeContent={`${timeouts?.[teamKey] || 0}/2`} invisible={!matchStarted} color={((timeouts?.[teamKey] || 0) >= 2) ? 'error' : 'primary'}>
                <IconButton
                  onClick={() => onTimeout?.(teamKey)}
                  disabled={!matchStarted || (timeouts?.[teamKey] || 0) >= 2 || rallyStage !== 'start'}
                  sx={{
                    backgroundColor: 'rgba(255, 152, 0, 0.9)',
                    // color: 'rgba(255, 152, 0, 0.9)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 1)'
                      // color: 'rgba(255, 152, 0, 1)'
                    },
                    '&:disabled': {
                      // color: 'rgba(0, 0, 0, 0.12)',
                      backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)'
                    }
                  }}
                >

                  <TimerOutlined />
                </IconButton>
              </Badge>
            </span>
          </Tooltip>

          <Tooltip title={`Cambio (${substitutions?.[teamKey] || 0}/6)`}>
            <span>
              <Badge badgeContent={`${substitutions?.[teamKey] || 0}/6`} invisible={!matchStarted} color={((substitutions?.[teamKey] || 0) >= 6) ? 'error' : 'primary'}>
                <IconButton
                  onClick={() => onSubstitution?.(teamKey)}
                  disabled={!matchStarted || (substitutions?.[teamKey] || 0) >= 6 || rallyStage !== 'start'}
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.9)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 1)'
                    },
                    '&:disabled': {
                      // color: 'rgba(0, 0, 0, 0.12)',
                      backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)'
                    }
                  }}
                >

                  <SwapHoriz />
                </IconButton>
              </Badge>
            </span>
          </Tooltip>

          <Tooltip title={'Falta'}>
            <span>
              <IconButton
                onClick={() => handleAction?.('fault', teamKey)}
                disabled={!matchStarted || (substitutions?.[teamKey] || 0) >= 6}
                sx={{
                  backgroundColor: 'rgba(255, 69, 0, 0.9)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(223, 59, 0, 1)'
                  },
                  '&:disabled': {
                    // color: 'rgba(0, 0, 0, 0.12)',
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)'
                  }
                }}
              >

                <Flag />
              </IconButton>
            </span>
          </Tooltip>
        </CardActions>

        {/* possession Indicator */}
        {isPossession && (
          <Box
            component="img"
            src="voleibol.png"
            alt="volleyball icon"
            sx={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '20px',
              height: '20px',
              backgroundColor: '#FFFF', //'#FFD700',
              borderRadius: '50%',
              border: getPossessionIndicatorBorder(color)
            }}
            
          />
        )}
      </Card>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }} >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }} >
        {renderTeamScore('teamA')}
        {renderTeamScore('teamB')}
      </Box >
    </Box >
  );
};

export default ScoreBoard;