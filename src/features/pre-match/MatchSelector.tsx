import React, { useState, useEffect } from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { getBestBadge } from '../../shared/utils/badgeUtils';

interface FMVApiItem {
    id: string | number;
    nombre: string;
}

interface CategoryItem {
    id: string | number;
    nombre_comp: string;
    categoria_sexo?: string;
}

interface MatchItem {
    id: number;
    equipo_local: string;
    equipo_visitante: string;
    pabellon: string;
}

interface RankingItem {
    nombre: string;
    imagen: string;
    posicion: number;
    puntos: number;
    jugados: number;
    ganados: number;
    ganados3: number;
    ganados2: number;
    perdidos: number;
    perdidos1: number;
    perdidos0: number;
    puntos_a_favor: number;
    puntos_en_contra: number;
}

interface JourneyData {
    id: number;
    numero: number;
}

interface Props {
    onSelectMatch: (matchDetails: Record<string, unknown>) => void;
}

const MatchSelector = ({ onSelectMatch }: Props) => {
    const [competitionTypes, setCompetitionTypes] = useState<FMVApiItem[]>([]);
    const [categories, setCompetitions] = useState<CategoryItem[]>([]);
    const [divisions, setDivisions] = useState<FMVApiItem[]>([]);
    const [phases, setPhases] = useState<FMVApiItem[]>([]);
    const [groups, setGroups] = useState<FMVApiItem[]>([]);
    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [rankingData, setRankingData] = useState<RankingItem[]>([]);

    const [selectedCompetitionType, setSelectedCompetitionType] = useState<string | number>('');
    const [selectedCategory, setSelectedCategory] = useState<string | number>('');
    const [selectedDivision, setSelectedDivision] = useState<string | number>('');
    const [selectedPhase, setSelectedPhase] = useState<string | number>('');
    const [selectedGroup, setSelectedGroup] = useState<string | number>('');
    const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
    const [journeyData, setJourneyData] = useState<JourneyData | null>(null);

    useEffect(() => {
        const fetchCompetitionTypes = async () => {
            try {
                const response = await fetch('https://intranet.fmvoley.com/api/competiciones/getTiposCompeticion');
                const data = await response.json();
                setCompetitionTypes(data.content);
            } catch (error) {
                console.error('Error fetching competition types:', error);
            }
        };

        fetchCompetitionTypes();
    }, []);

    useEffect(() => {
        if (selectedCompetitionType) {
            const fetchCompetitions = async () => {
                try {
                    const response = await fetch(`https://intranet.fmvoley.com/api/competiciones/getCompeticiones?tipoCompeticionId=${selectedCompetitionType}`);
                    const data = await response.json();
                    setCompetitions(data.content);
                } catch (error) {
                    console.error('Error fetching categories:', error);
                }
            };

            fetchCompetitions();
        }
    }, [selectedCompetitionType]);

    useEffect(() => {
        if (selectedCategory) {
            const fetchDivisions = async () => {
                try {
                    const response = await fetch(`https://intranet.fmvoley.com/api/competiciones/getCompeticionesTemporada?competicionId=${selectedCategory}`);
                    const data = await response.json();
                    setDivisions(data.content);
                } catch (error) {
                    console.error('Error fetching divisions:', error);
                }
            };

            fetchDivisions();
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedDivision) {
            const fetchPhases = async () => {
                try {
                    const response = await fetch(`https://intranet.fmvoley.com/api/competiciones/getFasesCompeticion?competicionTemporadaId=${selectedDivision}`);
                    const data = await response.json();
                    setPhases(data.content);
                } catch (error) {
                    console.error('Error fetching phases:', error);
                }
            };

            fetchPhases();
        }
    }, [selectedDivision]);

    useEffect(() => {
        if (selectedPhase) {
            const fetchGroups = async () => {
                try {
                    const response = await fetch(`https://intranet.fmvoley.com/api/competiciones/getGruposCompeticion?faseId=${selectedPhase}`);
                    const data = await response.json();
                    setGroups(data.content);
                } catch (error) {
                    console.error('Error fetching groups:', error);
                }
            };

            fetchGroups();
        }
    }, [selectedPhase]);

    useEffect(() => {
        if (selectedGroup) {
            const fetchGroupData = async () => {
                try {
                    const journeyResponse = await fetch(`https://intranet.fmvoley.com/api/competiciones/getJornadaActualGrupo?grupoId=${selectedGroup}`);
                    const journeyData = await journeyResponse.json();
                    setJourneyData(journeyData.content);
                    const journeyId = journeyData.content.id;

                    const matchesResponse = await fetch(`https://intranet.fmvoley.com/api/competiciones/getPartidosByJornada?jornadaId=${journeyId}`);
                    const matchesData = await matchesResponse.json();
                    setMatches(matchesData.content);

                    const rankingResponse = await fetch(`https://intranet.fmvoley.com/api/competiciones/getClasificacionGrupo?grupoId=${selectedGroup}`);
                    const rankingData = await rankingResponse.json();
                    setRankingData(rankingData.content);
                } catch (error) {
                    console.error('Error fetching group data:', error);
                }
            };

            fetchGroupData();
        }
    }, [selectedGroup]);

    const mapTeamDataToStats = (teamData: RankingItem) => ({
        ranking: teamData.posicion,
        competitionPoints: teamData.puntos,
        matchesPlayed: teamData.jugados,
        totalMatchesWon: teamData.ganados,
        won3Points: teamData.ganados3,
        won2Points: teamData.ganados2,
        totalMatchesLost: teamData.perdidos,
        lost1Point: teamData.perdidos1,
        lost0Points: teamData.perdidos0,
        totalPointsScored: teamData.puntos_a_favor,
        totalPointsReceived: teamData.puntos_en_contra,
    });

    const handleMatchSelect = (selectedMatch: MatchItem) => {
        const teamAData = rankingData.find(team => team.nombre.trim() === selectedMatch.equipo_local.trim());
        const teamBData = rankingData.find(team => team.nombre.trim() === selectedMatch.equipo_visitante.trim());
        const category = categories.find(type => type.id === selectedCategory);
        const division = divisions.find(type => type.id === selectedDivision);
        const phase = phases.find(comp => comp.id === selectedPhase);

        if (!teamAData || !teamBData || !category || !division || !phase) return;

        const teamABadge = getBestBadge(teamAData.nombre);
        const teamBBadge = getBestBadge(teamBData.nombre);

        const matchDetails = {
            teamA: teamAData.nombre,
            teamB: teamBData.nombre,
            teamALogo: teamABadge ? teamABadge : teamAData.imagen,
            teamBLogo: teamBBadge ? teamBBadge : teamBData.imagen,
            matchHeader: `${category.categoria_sexo} - ${division.nombre}`,
            extendedInfo: `Fase ${phase.nombre} - Jornada ${journeyData?.numero}`,
            stadium: `Pabellón ${selectedMatch.pabellon}`,
            competitionLogo: 'https://fmvoley.com/images/logo.svg',
            maxSets: 5,
            stats: {
                teamA: mapTeamDataToStats(teamAData),
                teamB: mapTeamDataToStats(teamBData),
            },
        };

        onSelectMatch(matchDetails);
    };

    const handleMatchDropdownChange = (e: { target: { value: unknown } }) => {
        const selectedMatchId = parseInt(e.target.value as string, 10);
        const match = matches.find(match => match.id === selectedMatchId);
        setSelectedMatch(match ?? null);
        if (match) {
            handleMatchSelect(match);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                gap: 0
            }}
        >
            <FormControl fullWidth sx={{ margin: '10px 0' }} size="small">
                <InputLabel>Tipo de competición</InputLabel>
                <Select
                    size="small"
                    value={selectedCompetitionType}
                    label="Tipo de competición"
                    onChange={(e) => setSelectedCompetitionType(e.target.value)}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                maxHeight: 300,
                                '& .MuiMenuItem-root': {
                                    fontSize: '0.875rem',
                                    padding: '6px 16px',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word'
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="">
                        <em>Tipo de competición</em>
                    </MenuItem>
                    {competitionTypes.map(type => (
                        <MenuItem key={type.id} value={type.id} >{type.nombre}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ margin: '10px 0' }} disabled={!selectedCompetitionType} size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                    value={selectedCategory}
                    label="Categoría"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                maxHeight: 300,
                                '& .MuiMenuItem-root': {
                                    fontSize: '0.875rem',
                                    padding: '6px 16px',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word'
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="">
                        <em>Categoría</em>
                    </MenuItem>
                    {categories.map(cat => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.nombre_comp}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ margin: '10px 0' }} disabled={!selectedCategory} size="small">
                <InputLabel>División</InputLabel>
                <Select
                    value={selectedDivision}
                    label="División"
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                maxHeight: 300,
                                '& .MuiMenuItem-root': {
                                    fontSize: '0.875rem',
                                    padding: '6px 16px',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word'
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="">
                        <em>División</em>
                    </MenuItem>
                    {divisions.map(div => (
                        <MenuItem key={div.id} value={div.id}>{div.nombre}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ margin: '10px 0' }} disabled={!selectedDivision} size="small">
                <InputLabel>Fase</InputLabel>
                <Select
                    value={selectedPhase}
                    label="Fase"
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                maxHeight: 300,
                                '& .MuiMenuItem-root': {
                                    fontSize: '0.875rem',
                                    padding: '6px 16px',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word'
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="">
                        <em>Fase</em>
                    </MenuItem>
                    {phases.map(phase => (
                        <MenuItem key={phase.id} value={phase.id}>{phase.nombre}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ margin: '10px 0' }} disabled={!selectedPhase} size="small">
                <InputLabel>Grupo</InputLabel>
                <Select
                    value={selectedGroup}
                    label="Grupo"
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                maxHeight: 300,
                                '& .MuiMenuItem-root': {
                                    fontSize: '0.875rem',
                                    padding: '6px 16px',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word'
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="">
                        <em>Grupo</em>
                    </MenuItem>
                    {groups.map(group => (
                        <MenuItem key={group.id} value={group.id}>{group.nombre}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ margin: '10px 0' }} disabled={!selectedGroup} size="small">
                <InputLabel>Partido</InputLabel>
                <Select
                    value={selectedMatch?.id || ''}
                    label="Partido"
                    onChange={handleMatchDropdownChange}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                maxHeight: 300,
                                '& .MuiMenuItem-root': {
                                    fontSize: '0.875rem',
                                    padding: '6px 16px',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word'
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="">
                        <em>Partido</em>
                    </MenuItem>
                    {matches.map(match => (
                        <MenuItem key={match.id} value={match.id}>
                            {match.equipo_local} vs {match.equipo_visitante}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default MatchSelector;
