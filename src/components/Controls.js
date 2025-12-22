// Controls.js
import React from 'react';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';

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
    right: 10%;
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
    }

    return (
        <ControlsContainerDiv>
            <ReloadButton 
                onClick={() => handleReloadOverlay()}>
                Recargar overlay
            </ReloadButton>
            <div>
                <h3>Marcador</h3>
                <button onClick={() => handleToggle('scoreboard', 'enabled')}>
                    {config.scoreboard.enabled ? 'Ocultar' : 'Mostrar'}
                </button>
                <select
                    value={config.scoreboard.type}
                    onChange={(e) => handleSelectChange('scoreboard', 'type', e.target.value)}
                >
                    <option value="classic">Simple</option>
                    <option value="vertical-table">Complejo</option>
                </select>
                <select
                    value={config.scoreboard.position}
                    onChange={(e) => handleSelectChange('scoreboard', 'position', e.target.value)}
                >
                    <option value="top-left">Arriba Izquierda</option>
                    <option value="top">Arriba</option>
                    <option value="top-right">Arriba Derecha</option>
                    <option value="bottom-left">Abajo Izquierda</option>
                    <option value="bottom">Abajo</option>
                    <option value="bottom-right">Abajo Derecha</option>
                </select>
            </div>
            <div>
                <h3>Presentación partido</h3>
                <button onClick={() => handleToggle('matchup', 'enabled')}>
                    {config.matchup.enabled ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>
            <div>
                <h3>Presentación Lower Third</h3>
                <button onClick={() => handleToggle('lowerThird', 'enabled')}>
                    {config.lowerThird.enabled ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>
            <div>
                <h3>Comparación de equipos</h3>
                <button onClick={() => handleToggle('teamComparison', 'enabled')}>
                    {config.teamComparison.enabled ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>
            <div>
                <h3>Panel de resultados</h3>
                <button onClick={() => handleToggle('afterMatch', 'enabled')}>
                    {config.afterMatch.enabled ? 'Ocultar' : 'Mostrar'}
                </button>
                <button onClick={() => handleToggle('afterMatch', 'showStats')}>
                    {config.afterMatch.showStats ? 'Ocultar estadísticas' : 'Mostrar estadísticas'}
                </button>
            </div>
            <div>
                <h3>Panel de patrocinadores</h3>
                <button onClick={() => handleToggle('sponsors', 'enabled')}>
                    {config.sponsors.enabled ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>
        </ControlsContainerDiv>
    );
};

export default Controls;
