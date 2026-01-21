import React from 'react';
import { useSocket } from '../contexts/SocketContext';
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
    Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

// 1. EXTRAER FUERA DEL COMPONENTE PRINCIPAL
// Esto evita que React desmonte el componente al actualizar el estado
const ControlSection = ({ title, enabled, onToggle, children }) => (
    <Box sx={{ paddingY: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography >
                {title}
            </Typography>
            <FormControlLabel
                control={
                    <Switch
                        checked={enabled}
                        onChange={(e) => {
                            // Opcional: previene comportamientos extraños del navegador
                            onToggle();
                        }}
                    />
                }
                label={enabled ? 'Mostrar' : 'Ocultar'}
            />
        </Box>
        {children}
        <Divider sx={{ mt: 1 }} />
    </Box>
);

const Controls = ({ config, setConfig }) => {
    const { socket } = useSocket();

    const handleToggle = (section, key) => {
        const updatedConfig = {
            ...config,
            [section]: {
                ...config[section],
                [key]: !config[section][key],
            },
        };
        setConfig(updatedConfig);
        socket.emit('updateConfig', updatedConfig);
    };

    const handleSelectChange = (section, key, value) => {
        const updatedConfig = {
            ...config,
            [section]: {
                ...config[section],
                [key]: value,
            },
        };
        setConfig(updatedConfig);
        socket.emit('updateConfig', updatedConfig);
    };

    const handleReloadOverlay = () => {
        socket.emit('reload');
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
                {/* Cabecera con botón */}
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
                        onClick={handleReloadOverlay}
                        startIcon={<RefreshIcon />}
                    >
                        Recargar overlay
                    </Button>
                </Box>

                <ControlSection
                    title="Presentación partido"
                    enabled={config.matchup.enabled}
                    onToggle={() => handleToggle('matchup', 'enabled')}
                />

                <ControlSection
                    title="Presentación Lower Third"
                    enabled={config.lowerThird.enabled}
                    onToggle={() => handleToggle('lowerThird', 'enabled')}
                />

                <ControlSection
                    title="Comparación de equipos"
                    enabled={config.teamComparison.enabled}
                    onToggle={() => handleToggle('teamComparison', 'enabled')}
                />

                <ControlSection
                    title="Panel de patrocinadores"
                    enabled={config.sponsors.enabled}
                    onToggle={() => handleToggle('sponsors', 'enabled')}
                />

                <ControlSection
                    title="Panel de redes sociales"
                    enabled={config.socialMedia.enabled}
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
                    title="Marcador"
                    enabled={config.scoreboard.enabled}
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
                    enabled={config.afterMatch.enabled}
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
                                <Switch size="small" checked={config.afterMatch.showStats} onChange={() => handleToggle('afterMatch', 'showStats')} />
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





            </Paper>
        </Box>
    );
};

export default Controls;
