import React, { useState } from 'react';
import { useSocket } from '../../services/socket/SocketContext';
import type { Sequence, SequenceStep } from '../../types';
import { useConfig } from '../../contexts/ConfigContext';
import { useMatchContext } from '../../contexts/MatchContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import ControlSection from '../../shared/components/ControlSection';
import {
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Box,
    Typography,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    LinearProgress,
    Tooltip,
    IconButton,
    ClickAwayListener,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAutomation } from '../../contexts/AutomationContext';


interface SequenceRowProps {
    seq: Sequence;
    isRunning: boolean;
    activeSequenceId: string | null;
    currentStepIndex: number | null;
    activeSteps: SequenceStep[];
    automationsEnabled: Record<string, boolean>;
    toggleAutomation: (id: string) => void;
    runSequence: (seq: Sequence) => void;
    stop: () => void;
    socket: import('socket.io-client').Socket | null;
}

const SequenceRow = ({ seq, isRunning, activeSequenceId, currentStepIndex, activeSteps, automationsEnabled, toggleAutomation, runSequence, stop, socket }: SequenceRowProps) => {
    const isThisRunning = isRunning && activeSequenceId === seq.id;
    const isManual = seq.trigger.type === 'manual';
    const [descOpen, setDescOpen] = useState(false);

    return (
        <Box sx={{ py: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">{seq.label}</Typography>
                    <ClickAwayListener onClickAway={() => setDescOpen(false)}>
                        <Tooltip
                            title={seq.description}
                            arrow
                            placement="bottom-start"
                            open={descOpen}
                            disableFocusListener
                            disableHoverListener
                            disableTouchListener
                            slotProps={{
                                popper: {
                                    modifiers: [
                                        { name: 'preventOverflow', options: { boundary: 'window', padding: 8 } },
                                        { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom', 'top'] } },
                                    ],
                                },
                                tooltip: { sx: { maxWidth: 220 } }
                            }}
                        >
                            <IconButton size="small" onClick={() => setDescOpen(v => !v)} sx={{ p: 0.25 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                            </IconButton>
                        </Tooltip>
                    </ClickAwayListener>
                </Box>
                {isManual ? (
                    <Button
                        variant={isThisRunning ? 'outlined' : 'contained'}
                        color={isThisRunning ? 'error' : 'primary'}
                        size="small"
                        startIcon={isThisRunning ? <StopIcon /> : <PlayArrowIcon />}
                        onClick={isThisRunning ? stop : () => runSequence(seq)}
                        disabled={!isThisRunning && (isRunning || !socket)}
                        sx={isThisRunning ? {} : { color: 'white' }}
                    >
                        {isThisRunning ? 'Detener' : 'Iniciar'}
                    </Button>
                ) : (
                    <Switch
                        checked={automationsEnabled[seq.id] ?? true}
                        onChange={() => toggleAutomation(seq.id)}
                    />
                )}
            </Box>
            {isThisRunning && currentStepIndex !== null && (
                <Box sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography variant="caption" color="text.secondary">
                            {activeSteps[currentStepIndex]?.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {currentStepIndex + 1} / {activeSteps.length}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={((currentStepIndex + 1) / activeSteps.length) * 100}
                        sx={{ height: 3, borderRadius: 2 }}
                    />
                </Box>
            )}
        </Box>
    );
};

const Controls = () => {
    const { socket } = useSocket();
    const { config, setConfig } = useConfig();
    const { matchManager, matchDetails } = useMatchContext();
    const { noStats } = usePreferences();
    const { match: matchData } = matchManager;

    const hasStats = [...Object.values(matchDetails.stats.teamA), ...Object.values(matchDetails.stats.teamB)].some(val => Number(val) > 0);
    const hasPlayers = (matchDetails.players.teamA?.length > 0) || (matchDetails.players.teamB?.length > 0);
    const isPreMatch = !matchData.matchStarted && matchData.setStats.length === 0;

    const { isRunning, activeSequenceId, currentStepIndex, activeSteps, runSequence, stop, automationsEnabled, toggleAutomation, manualSequences, autoSequences } = useAutomation();

    const handleToggle = (section: string, key: string) => {
        const cfg = config as unknown as Record<string, Record<string, unknown>>;
        const updatedConfig = {
            ...config,
            [section]: {
                ...cfg[section],
                [key]: !cfg[section][key],
            },
        };
        setConfig(updatedConfig);
    };

    const handleSelectChange = (section: string, key: string, value: unknown) => {
        const cfg = config as unknown as Record<string, Record<string, unknown>>;
        const updatedConfig = {
            ...config,
            [section]: {
                ...cfg[section],
                [key]: value,
            },
        };
        setConfig(updatedConfig);
    };

    const handleReloadOverlay = () => {
        socket?.emit('reload');
    };

    return (
        <Box sx={{ width: '100%', p: { xs: 1, sm: 2 }, boxSizing: 'border-box' }}>
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    maxWidth: '800px',
                    margin: '0 auto',
                    p: { xs: 2, sm: 4 },
                    boxSizing: 'border-box',
                    borderRadius: 2
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                    gap: 2,
                    flexWrap: 'wrap'
                }}>
                    <Typography variant="h4" component="h1">
                        Controles
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        onClick={handleReloadOverlay}
                        startIcon={<RefreshIcon />}
                        sx={{
                            color: 'white',
                            fontSize: '0.75rem',
                            padding: '6px 12px',
                        }}
                    >
                        Recargar overlay
                    </Button>
                </Box>

                <Accordion defaultExpanded sx={{ mt: 1, mb: 0, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Automatismos</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                            {/* Manual sequences */}
                            {manualSequences.length > 0 && (
                                <Box>
                                    <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Manuales
                                    </Typography>
                                    {manualSequences.map(seq => (
                                        <SequenceRow
                                            key={seq.id}
                                            seq={seq}
                                            isRunning={isRunning}
                                            activeSequenceId={activeSequenceId}
                                            currentStepIndex={currentStepIndex}
                                            activeSteps={activeSteps}
                                            automationsEnabled={automationsEnabled}
                                            toggleAutomation={toggleAutomation}
                                            runSequence={runSequence}
                                            stop={stop}
                                            socket={socket}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Auto-triggered sequences */}
                            {autoSequences.length > 0 && (
                                <Box>
                                    <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Automáticas
                                    </Typography>
                                    {autoSequences.map(seq => (
                                        <SequenceRow
                                            key={seq.id}
                                            seq={seq}
                                            isRunning={isRunning}
                                            activeSequenceId={activeSequenceId}
                                            currentStepIndex={currentStepIndex}
                                            activeSteps={activeSteps}
                                            automationsEnabled={automationsEnabled}
                                            toggleAutomation={toggleAutomation}
                                            runSequence={runSequence}
                                            stop={stop}
                                            socket={socket}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded={isPreMatch} sx={{ mt: 1, mb: 0, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6" >Controles de Presentación</Typography>
                    </AccordionSummary>
                    <AccordionDetails>

                        <ControlSection
                            title="Presentación partido"
                            checked={config.matchup.enabled}
                            onToggle={() => handleToggle('matchup', 'enabled')}
                        />

                        <ControlSection
                            title="Presentación Lower Third"
                            checked={config.lowerThird.enabled}
                            onToggle={() => handleToggle('lowerThird', 'enabled')}
                        />

                        <ControlSection
                            title="Comparación de equipos"
                            disabled={!hasStats}
                            checked={config.teamComparison.enabled}
                            onToggle={() => handleToggle('teamComparison', 'enabled')}
                        />

                        <ControlSection
                            title="Listado de Jugadores"
                            disabled={!hasPlayers}
                            checked={config.lineup.enabled}
                            onToggle={() => handleToggle('lineup', 'enabled')}
                        >
                        </ControlSection>
                    </AccordionDetails>
                </Accordion>
                <Accordion defaultExpanded={!matchData.matchStarted} sx={{ mt: 1, mb: 0, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6" >Patrocinadores y RRSS</Typography>
                    </AccordionSummary>
                    <AccordionDetails>

                        <ControlSection
                            title="Panel de patrocinadores"
                            checked={config.sponsors.enabled}
                            onToggle={() => handleToggle('sponsors', 'enabled')}
                        />

                        <ControlSection
                            title="Panel de redes sociales"
                            checked={config.socialMedia.enabled}
                            onToggle={() => handleToggle('socialMedia', 'enabled')}
                        >
                            <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
                                <InputLabel id="select-socialmedia-pos">Posición</InputLabel>
                                <Select
                                    labelId="select-socialmedia-pos"
                                    label="Posición"
                                    value={config.socialMedia.position}
                                    onChange={(e) => handleSelectChange('socialMedia', 'position', e.target.value)}
                                >
                                    <MenuItem value="top-left">Arriba Izquierda</MenuItem>
                                    <MenuItem value="top">Arriba</MenuItem>
                                    <MenuItem value="top-right">Arriba Derecha</MenuItem>
                                    <MenuItem value="center">Centro</MenuItem>
                                    <MenuItem value="bottom-left">Abajo Izquierda</MenuItem>
                                    <MenuItem value="bottom">Abajo</MenuItem>
                                    <MenuItem value="bottom-right">Abajo Derecha</MenuItem>
                                </Select>
                            </FormControl>
                        </ControlSection>
                        <ControlSection
                            title="Splash de Suscripción"
                            checked={config.subscribe.enabled}
                            onToggle={() => handleToggle('subscribe', 'enabled')}
                        >
                            <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
                                <InputLabel id="select-subscribe-pos">Posición</InputLabel>
                                <Select
                                    labelId="select-subscribe-pos"
                                    label="Posición"
                                    value={config.subscribe.position}
                                    onChange={(e) => handleSelectChange('subscribe', 'position', e.target.value)}
                                >
                                    <MenuItem value="top-left">Arriba Izquierda</MenuItem>
                                    <MenuItem value="top">Arriba</MenuItem>
                                    <MenuItem value="top-right">Arriba Derecha</MenuItem>
                                    <MenuItem value="center">Centro</MenuItem>
                                    <MenuItem value="bottom-left">Abajo Izquierda</MenuItem>
                                    <MenuItem value="bottom">Abajo</MenuItem>
                                    <MenuItem value="bottom-right">Abajo Derecha</MenuItem>
                                </Select>
                            </FormControl>
                        </ControlSection>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded={matchData.matchStarted} sx={{ mt: 1, mb: 0, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6" >Marcador y Resultados</Typography>
                    </AccordionSummary>
                    <AccordionDetails>

                        <ControlSection
                            title="Marcador"
                            checked={config.scoreboard.enabled}
                            onToggle={() => handleToggle('scoreboard', 'enabled')}
                        >
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <FormControl sx={{ minWidth: 150 }} size="small">
                                    <InputLabel id="select-scoreboard-type">Apariencia</InputLabel>
                                    <Select
                                        labelId="select-scoreboard-type"
                                        label="Apariencia"
                                        value={config.scoreboard.type}
                                        onChange={(e) => handleSelectChange('scoreboard', 'type', e.target.value)}
                                    >
                                        <MenuItem value="classic">Simple</MenuItem>
                                        <MenuItem value="vertical-table">Multilínea</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl sx={{ minWidth: 150 }} size="small">
                                    <InputLabel id="select-scoreboard-pos">Posición</InputLabel>
                                    <Select
                                        labelId="select-scoreboard-pos"
                                        label="Posición"
                                        value={config.scoreboard.position}
                                        onChange={(e) => handleSelectChange('scoreboard', 'position', e.target.value)}
                                    >
                                        <MenuItem value="top-left">Arriba Izquierda</MenuItem>
                                        <MenuItem value="top">Arriba</MenuItem>
                                        <MenuItem value="top-right">Arriba Derecha</MenuItem>
                                        <MenuItem value="center">Centro</MenuItem>
                                        <MenuItem value="bottom-left">Abajo Izquierda</MenuItem>
                                        <MenuItem value="bottom">Abajo</MenuItem>
                                        <MenuItem value="bottom-right">Abajo Derecha</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box
                                sx={{
                                    ml: 2,
                                    mt: 1,
                                    p: 1.5,
                                    backgroundColor: 'background.paper',
                                    // opacity: config.afterMatch.enabled ? 1 : 0.5,
                                    // pointerEvents: config.afterMatch.enabled ? 'auto' : 'none',
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignitems: 'center', gap: 1 }}>
                                        <Typography variant='body2' sx={{ fontweight: 500 }}>
                                            Sets anteriores
                                        </Typography>
                                    </Box>
                                    <FormControlLabel control={
                                        <Switch size="small" checked={config.scoreboard.showHistory} onChange={() => handleToggle('scoreboard', 'showHistory')} />
                                    }
                                        label={
                                            <Typography variant="body2">
                                                {config.scoreboard.showHistory ? 'Mostrar' : 'Ocultar'}
                                            </Typography>
                                        }
                                    >
                                    </FormControlLabel>
                                </Box>
                            </Box>
                        </ControlSection>

                        <ControlSection
                            title="Panel de resultados"
                            checked={config.afterMatch.enabled}
                            onToggle={() => handleToggle('afterMatch', 'enabled')}
                        >
                            <Box
                                sx={{
                                    ml: 2,
                                    mt: 1,
                                    p: 1.5,
                                    backgroundColor: 'background.paper',
                                    // opacity: config.afterMatch.enabled ? 1 : 0.5,
                                    // pointerEvents: config.afterMatch.enabled ? 'auto' : 'none',
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignitems: 'center', gap: 1 }}>
                                        <Typography variant='body2' sx={{ fontweight: 500 }}>
                                            Tabla de Estadísticas
                                        </Typography>
                                    </Box>
                                    <FormControlLabel control={
                                        <Switch size="small" checked={!noStats && config.afterMatch.showStats} disabled={noStats} onChange={() => handleToggle('afterMatch', 'showStats')} />
                                    }
                                        label={
                                            <Typography variant="body2">
                                                {config.afterMatch.showStats ? 'Mostrar' : 'Ocultar'}
                                            </Typography>
                                        }
                                    >
                                    </FormControlLabel>
                                </Box>
                            </Box>
                        </ControlSection>
                    </AccordionDetails>
                </Accordion>
            </Paper>
        </Box>
    );
};

export default Controls;
