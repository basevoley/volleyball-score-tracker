import React from 'react';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const ControlsContainerDiv = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-content: stretch;
    justify-content: center;
    align-items: start;
    position: relative;
    box-sizing: border-box;
    padding: 20px;
`;

const ReloadButton = styled.button`
    position: absolute;
    top: 0;
    right: 5%;
    margin: 10px;
    padding: 10px 20px;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    &:hover {
        background-color: #0056b3;
    }
`;

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
        <ControlsContainerDiv>
            <ReloadButton variant="contained" onClick={handleReloadOverlay}>
                Recargar overlay
            </ReloadButton>
            <div>
                <h3>Presentación partido</h3>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.matchup.enabled}
                            onChange={() => handleToggle('matchup', 'enabled')}
                        />
                    }
                    label={config.matchup.enabled ? 'Mostrar' : 'Ocultar'}
                />
            </div>
            <div>
                <h3>Presentación Lower Third</h3>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.lowerThird.enabled}
                            onChange={() => handleToggle('lowerThird', 'enabled')}
                        />
                    }
                    label={config.lowerThird.enabled ? 'Mostrar' : 'Ocultar'}
                />
            </div>
            <div>
                <h3>Comparación de equipos</h3>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.teamComparison.enabled}
                            onChange={() => handleToggle('teamComparison', 'enabled')}
                        />
                    }
                    label={config.teamComparison.enabled ? 'Mostrar' : 'Ocultar'}
                />
            </div>
            <div>
                <h3>Panel de patrocinadores</h3>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.sponsors.enabled}
                            onChange={() => handleToggle('sponsors', 'enabled')}
                        />
                    }
                    label={config.sponsors.enabled ? 'Mostrar' : 'Ocultar'}
                />
            </div>
            <div>
                <h3>Marcador</h3>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.scoreboard.enabled}
                            onChange={() => handleToggle('scoreboard', 'enabled')}
                        />
                    }
                    label={config.scoreboard.enabled ? 'Mostrar' : 'Ocultar'}
                    sx={{ marginRight: '5px' }} 
                />

                <FormControl sx={{ m: 1, minWidth: 120, margin: '5px' }} size="small">
                    <InputLabel id='select-scoreboard-type'>Apariencia</InputLabel>
                    <Select
                        labelId='select-scoreboard-type'
                        label='Apariencia'
                        value={config.scoreboard.type}
                        onChange={(e) => handleSelectChange('scoreboard', 'type', e.target.value)}
                    // sx={{ width: 120, fontSize: 12 }}
                    >
                        <MenuItem value="classic">Simple</MenuItem>
                        <MenuItem value="vertical-table">Multilínea</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ m: 1, minWidth: 120, margin: '5px' }} size="small">
                    <InputLabel id='select-scoreboard-pos'>Posición</InputLabel>
                    <Select
                        labelId='select-scoreboard-pos'
                        label='Posición'
                        value={config.scoreboard.position}
                        onChange={(e) => handleSelectChange('scoreboard', 'position', e.target.value)}
                    // sx={{ width: 120, fontSize: 12 }}
                    >
                        <MenuItem value="top-left">Arriba Izquierda</MenuItem>
                        <MenuItem value="top">Arriba</MenuItem>
                        <MenuItem value="top-right">Arriba Derecha</MenuItem>
                        <MenuItem value="bottom-left">Abajo Izquierda</MenuItem>
                        <MenuItem value="bottom">Abajo</MenuItem>
                        <MenuItem value="bottom-right">Abajo Derecha</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <div>
                <h3>Panel de resultados</h3>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.afterMatch.enabled}
                            onChange={() => handleToggle('afterMatch', 'enabled')}
                        />
                    }
                    label={config.afterMatch.enabled ? 'Mostrar' : 'Ocultar'}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.afterMatch.showStats}
                            onChange={() => handleToggle('afterMatch', 'showStats')}
                        />
                    }
                    label={config.afterMatch.showStats ? 'Mostrar estadísticas' : 'Ocultar estadísticas'}
                />
            </div>
        </ControlsContainerDiv>
    );
};

export default Controls;
