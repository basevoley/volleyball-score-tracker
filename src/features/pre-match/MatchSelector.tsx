import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItemButton,
    ListItemText,
    Select,
    MenuItem,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import { getBestBadge } from '../../shared/utils/badgeUtils';
import { pickInitialJornada, jornadaOptionLabel } from './jornadaSelection';

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
    fecha: string;
    hora: string;
    puntos_local: number;
    puntos_visitante: number;
    finalizado: boolean;
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
    onClose: () => void;
}

const FMV_BASE = 'https://intranet.fmvoley.com/api/competiciones';

async function getFmv<T>(endpoint: string, params: Record<string, string | number>): Promise<T> {
    const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    );
    const response = await fetch(`${FMV_BASE}/${endpoint}?${query.toString()}`);
    const json = await response.json();
    return json.content;
}

interface GroupBundle {
    jornadas: JourneyData[];
    currentJornadaId: number;
    ranking: RankingItem[];
}

// The jornada list/ranking and each jornada's partidos are the parts users actually look
// at — cached for an hour, same convention as RfevbMatchSelector/EsvoleyMatchSelector, so
// the selector's refresh button has something real to bypass instead of every load being a
// fresh network round-trip regardless of the cache. Module-level so it survives dialog reopens.
const GROUP_BUNDLE_CACHE_TTL_MS = 60 * 60 * 1000;
const groupBundleCache = new Map<string, { data: GroupBundle; fetchedAt: number }>();
const jornadaMatchesCache = new Map<number, { data: MatchItem[]; fetchedAt: number }>();

async function fetchJornadaMatches(jornadaId: number, forceRefresh: boolean): Promise<MatchItem[]> {
    const cached = jornadaMatchesCache.get(jornadaId);
    if (!forceRefresh && cached && Date.now() - cached.fetchedAt < GROUP_BUNDLE_CACHE_TTL_MS) {
        return cached.data;
    }
    const data = await getFmv<MatchItem[]>('getPartidosByJornada', { jornadaId });
    jornadaMatchesCache.set(jornadaId, { data, fetchedAt: Date.now() });
    return data;
}

async function fetchGroupBundle(groupId: string | number, forceRefresh: boolean): Promise<GroupBundle> {
    const cacheKey = String(groupId);
    const cached = groupBundleCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.fetchedAt < GROUP_BUNDLE_CACHE_TTL_MS) {
        return cached.data;
    }
    const [calendar, current, ranking] = await Promise.all([
        getFmv<Array<{ id: number; numero: string | number }>>('getJornadasCalendario', { grupoId: groupId }),
        getFmv<JourneyData>('getJornadaActualGrupo', { grupoId: groupId }),
        getFmv<RankingItem[]>('getClasificacionGrupo', { grupoId: groupId }),
    ]);
    // The calendar lists every jornada of the group (so postponed matches from earlier
    // ones stay reachable). Fall back to just the current one if it comes back empty.
    const jornadas = calendar.length > 0
        ? calendar.map(j => ({ id: j.id, numero: Number(j.numero) }))
        : [current];
    const data = { jornadas, currentJornadaId: current.id, ranking };
    groupBundleCache.set(cacheKey, { data, fetchedAt: Date.now() });
    return data;
}

const MatchSelector = ({ onSelectMatch, onClose }: Props) => {
    const [competitionTypes, setCompetitionTypes] = useState<FMVApiItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
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
    const [jornadas, setJornadas] = useState<JourneyData[]>([]);
    const [currentJornadaId, setCurrentJornadaId] = useState<number | null>(null);
    const [selectedJornadaId, setSelectedJornadaId] = useState('');

    // Id of the jornada the user last picked, so a slow response for a previous pick can't overwrite it.
    const latestJornadaRef = useRef('');

    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    useEffect(() => {
        getFmv<FMVApiItem[]>('getTiposCompeticion', {})
            .then(list => {
                setCompetitionTypes(list);
                setLoadingTypes(false);
                // Auto-advance when there's nothing to actually choose — same convention as
                // LigasNacionalesMatchSelector, which hides/skips single-option levels.
                if (list.length === 1) handleTipoChange(list[0].id);
            })
            .catch(() => { setError('Error cargando los tipos de competición'); setLoadingTypes(false); });
    // handleTipoChange is defined below but only ever invoked asynchronously, after the
    // component has finished its first render — safe to reference here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetResults = () => {
        latestJornadaRef.current = '';
        setMatches([]); setRankingData([]);
        setJornadas([]); setCurrentJornadaId(null); setSelectedJornadaId('');
        setLastFetched(null); setError(null);
    };

    // `keepJornadaId` is the jornada the operator was browsing: a refresh passes it so they
    // aren't yanked back to the current jornada; a freshly picked group passes nothing.
    const loadGroupData = (groupId: string | number, forceRefresh = false, keepJornadaId = '') => {
        setLoading(true);
        resetResults();

        fetchGroupBundle(groupId, forceRefresh)
            .then(async bundle => {
                const initialId = pickInitialJornada(
                    bundle.jornadas.map(j => String(j.id)),
                    String(bundle.currentJornadaId),
                    keepJornadaId,
                );
                latestJornadaRef.current = initialId;
                const matchesData = await fetchJornadaMatches(Number(initialId), forceRefresh);
                setJornadas(bundle.jornadas);
                setCurrentJornadaId(bundle.currentJornadaId);
                setSelectedJornadaId(initialId);
                setRankingData(bundle.ranking);
                setMatches(matchesData);
                setLastFetched(new Date());
            })
            .catch(() => setError('Error cargando los partidos'))
            .finally(() => setLoading(false));
    };

    // Switching jornada only reloads that jornada's partidos — group, ranking and the
    // dropdown cascade stay as they are.
    const handleJornadaChange = (jornadaId: string) => {
        latestJornadaRef.current = jornadaId;
        setSelectedJornadaId(jornadaId);
        setMatches([]);
        setError(null);
        setLoading(true);
        fetchJornadaMatches(Number(jornadaId), false)
            .then(result => { if (latestJornadaRef.current === jornadaId) setMatches(result); })
            .catch(() => { if (latestJornadaRef.current === jornadaId) setError('Error cargando los partidos'); })
            .finally(() => { if (latestJornadaRef.current === jornadaId) setLoading(false); });
    };

    // Each cascade step below follows the same shape: reset everything downstream, fetch this
    // level's options, and either auto-advance into the next step (which takes over the
    // `loading` flag itself) or stop and clear `loading` here. Never both — a trailing
    // `.finally(() => setLoading(false))` would race with a nested step's `setLoading(true)`
    // and clear it prematurely while that step is still fetching.
    const handleTipoChange = (tipoId: string | number) => {
        setSelectedCompetitionType(tipoId);
        setCategories([]); setSelectedCategory('');
        setDivisions([]); setSelectedDivision('');
        setPhases([]); setSelectedPhase('');
        setGroups([]); setSelectedGroup('');
        resetResults();
        if (!tipoId) return;

        setLoading(true);
        getFmv<CategoryItem[]>('getCompeticiones', { tipoCompeticionId: tipoId })
            .then(list => {
                setCategories(list);
                if (list.length === 1) handleCategoriaChange(list[0].id);
                else setLoading(false);
            })
            .catch(() => { setError('Error cargando las categorías'); setLoading(false); });
    };

    const handleCategoriaChange = (categoryId: string | number) => {
        setSelectedCategory(categoryId);
        setDivisions([]); setSelectedDivision('');
        setPhases([]); setSelectedPhase('');
        setGroups([]); setSelectedGroup('');
        resetResults();
        if (!categoryId) return;

        setLoading(true);
        getFmv<FMVApiItem[]>('getCompeticionesTemporada', { competicionId: categoryId })
            .then(list => {
                setDivisions(list);
                if (list.length === 1) handleDivisionChange(list[0].id);
                else setLoading(false);
            })
            .catch(() => { setError('Error cargando las divisiones'); setLoading(false); });
    };

    const handleDivisionChange = (divisionId: string | number) => {
        setSelectedDivision(divisionId);
        setPhases([]); setSelectedPhase('');
        setGroups([]); setSelectedGroup('');
        resetResults();
        if (!divisionId) return;

        setLoading(true);
        getFmv<FMVApiItem[]>('getFasesCompeticion', { competicionTemporadaId: divisionId })
            .then(list => {
                setPhases(list);
                if (list.length === 1) handleFaseChange(list[0].id);
                else setLoading(false);
            })
            .catch(() => { setError('Error cargando las fases'); setLoading(false); });
    };

    const handleFaseChange = (phaseId: string | number) => {
        setSelectedPhase(phaseId);
        setGroups([]); setSelectedGroup('');
        resetResults();
        if (!phaseId) return;

        setLoading(true);
        getFmv<FMVApiItem[]>('getGruposCompeticion', { faseId: phaseId })
            .then(list => {
                setGroups(list);
                if (list.length === 1) handleGrupoChange(list[0].id);
                else setLoading(false);
            })
            .catch(() => { setError('Error cargando los grupos'); setLoading(false); });
    };

    const handleGrupoChange = (groupId: string | number) => {
        setSelectedGroup(groupId);
        if (groupId) loadGroupData(groupId);
    };

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

    const handleMatchSelect = (match: MatchItem) => {
        const teamAData = rankingData.find(team => team.nombre.trim() === match.equipo_local.trim());
        const teamBData = rankingData.find(team => team.nombre.trim() === match.equipo_visitante.trim());
        const category = categories.find(type => type.id === selectedCategory);
        const division = divisions.find(type => type.id === selectedDivision);
        const phase = phases.find(comp => comp.id === selectedPhase);
        const jornada = jornadas.find(j => String(j.id) === selectedJornadaId);

        if (!teamAData || !teamBData || !category || !division || !phase || !jornada) return;

        const teamABadge = getBestBadge(teamAData.nombre);
        const teamBBadge = getBestBadge(teamBData.nombre);

        onSelectMatch({
            teamA: teamAData.nombre,
            teamB: teamBData.nombre,
            teamALogo: teamABadge ? teamABadge : teamAData.imagen,
            teamBLogo: teamBBadge ? teamBBadge : teamBData.imagen,
            matchHeader: `${category.categoria_sexo} - ${division.nombre}`,
            extendedInfo: `Fase ${phase.nombre} - Jornada ${jornada.numero}`,
            stadium: `Pabellón ${match.pabellon}`,
            competitionLogo: 'https://fmvoley.com/images/logo.svg',
            maxSets: 5,
            stats: {
                teamA: mapTeamDataToStats(teamAData),
                teamB: mapTeamDataToStats(teamBData),
            },
        });
        onClose();
    };

    const selectSx = { minWidth: 160, flex: '1 1 160px' };
    const selectedJornada = jornadas.find(j => String(j.id) === selectedJornadaId);

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                FMV
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={selectSx} disabled={loadingTypes}>
                        <InputLabel>Tipo de competición</InputLabel>
                        <Select
                            value={selectedCompetitionType}
                            label="Tipo de competición"
                            onChange={(e) => handleTipoChange(e.target.value)}
                        >
                            <MenuItem value=""><em>Seleccionar</em></MenuItem>
                            {competitionTypes.map(type => (
                                <MenuItem key={type.id} value={type.id}>{type.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={selectSx} disabled={!selectedCompetitionType}>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                            value={selectedCategory}
                            label="Categoría"
                            onChange={(e) => handleCategoriaChange(e.target.value)}
                        >
                            <MenuItem value=""><em>Seleccionar</em></MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.nombre_comp}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={selectSx} disabled={!selectedCategory}>
                        <InputLabel>División</InputLabel>
                        <Select
                            value={selectedDivision}
                            label="División"
                            onChange={(e) => handleDivisionChange(e.target.value)}
                        >
                            <MenuItem value=""><em>Seleccionar</em></MenuItem>
                            {divisions.map(div => (
                                <MenuItem key={div.id} value={div.id}>{div.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={selectSx} disabled={!selectedDivision}>
                        <InputLabel>Fase</InputLabel>
                        <Select
                            value={selectedPhase}
                            label="Fase"
                            onChange={(e) => handleFaseChange(e.target.value)}
                        >
                            <MenuItem value=""><em>Seleccionar</em></MenuItem>
                            {phases.map(phase => (
                                <MenuItem key={phase.id} value={phase.id}>{phase.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={selectSx} disabled={!selectedPhase}>
                        <InputLabel>Grupo</InputLabel>
                        <Select
                            value={selectedGroup}
                            label="Grupo"
                            onChange={(e) => handleGrupoChange(e.target.value)}
                        >
                            <MenuItem value=""><em>Seleccionar</em></MenuItem>
                            {groups.map(group => (
                                <MenuItem key={group.id} value={group.id}>{group.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {lastFetched && !loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Actualizado: {lastFetched.toLocaleTimeString()}
                            {selectedJornada ? ` · Jornada ${selectedJornada.numero}` : ''}
                        </Typography>
                        <Tooltip title="Actualizar">
                            <span>
                                <IconButton size="small" aria-label="Actualizar" onClick={() => loadGroupData(selectedGroup, true, selectedJornadaId)} disabled={loading}>
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                )}

                {(loading || loadingTypes) && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                )}

                {error && (
                    <Typography color="error" sx={{ py: 2 }}>{error}</Typography>
                )}

                {!loadingTypes && jornadas.length > 1 && (
                    <FormControl size="small" fullWidth sx={{ mb: 2 }} disabled={loading}>
                        <InputLabel id="fmv-jornada-label">Jornada</InputLabel>
                        <Select
                            labelId="fmv-jornada-label"
                            value={selectedJornadaId}
                            label="Jornada"
                            onChange={(e) => handleJornadaChange(String(e.target.value))}
                        >
                            {jornadas.map(j => (
                                <MenuItem key={j.id} value={String(j.id)}>
                                    {jornadaOptionLabel(j.numero, j.id === currentJornadaId)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {!loading && matches.length > 0 && (
                    <List dense disablePadding>
                        {matches.map(match => (
                            <ListItemButton
                                key={match.id}
                                onClick={() => handleMatchSelect(match)}
                                disabled={match.finalizado}
                                divider
                                sx={{ opacity: match.finalizado ? 0.5 : 1 }}
                            >
                                <ListItemText
                                    primary={`${match.equipo_local} vs ${match.equipo_visitante}`}
                                    secondary={
                                        match.finalizado
                                            ? <>{`${match.fecha} ${match.hora} · ${match.pabellon} · `}<strong>FINALIZADO: {match.puntos_local}-{match.puntos_visitante}</strong></>
                                            : `${match.fecha} ${match.hora} · ${match.pabellon}`
                                    }
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                )}

                {!loading && selectedGroup && matches.length === 0 && !error && (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No hay partidos disponibles para esta jornada
                    </Typography>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MatchSelector;
