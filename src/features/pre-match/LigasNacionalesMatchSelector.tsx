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
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import type { TeamCompetitionStats } from '../../types';
import { getBestBadge } from '../../shared/utils/badgeUtils';
import { fetchCompeticiones, resolveFases, resolveGrupos, fetchGroupData, fetchJornadaResults } from '../../services/ligasNacionales/fontventaClient';
import type { LigaCompetition, LigaFase, LigaGrupo, LigaGroupData, LigaMatch, LigaMatchResult } from '../../services/ligasNacionales/types';
import { pickInitialJornada, jornadaOptionLabel } from './jornadaSelection';

interface Props {
  onSelectMatch: (matchDetails: Record<string, unknown>) => void;
  onClose: () => void;
}

const EMPTY_STATS: TeamCompetitionStats = {
  ranking: 0, competitionPoints: 0, matchesPlayed: 0, totalMatchesWon: 0, won3Points: 0,
  won2Points: 0, totalMatchesLost: 0, lost1Point: 0, lost0Points: 0, totalPointsScored: 0, totalPointsReceived: 0,
};

function buildMatchDetails(match: LigaMatch, data: LigaGroupData, competicion: LigaCompetition): Record<string, unknown> {
  const home = data.standings[match.homeTeam.trim().toLowerCase()];
  const away = data.standings[match.awayTeam.trim().toLowerCase()];
  return {
    teamA: match.homeTeam,
    teamB: match.awayTeam,
    teamALogo: match.homeLogo || getBestBadge(match.homeTeam) || '',
    teamBLogo: match.awayLogo || getBestBadge(match.awayTeam) || '',
    matchHeader: `${competicion.label} - ${data.grupo.nombre.trim()}`,
    extendedInfo: `${data.fase.nombre.trim()} · Jornada ${match.jornadaNumero}`,
    stadium: match.venue,
    competitionLogo: competicion.logo,
    maxSets: 5,
    stats: {
      teamA: home?.stats ?? EMPTY_STATS,
      teamB: away?.stats ?? EMPTY_STATS,
    },
  };
}

function groupByJornada(matches: LigaMatch[]): Map<string, LigaMatch[]> {
  const map = new Map<string, LigaMatch[]>();
  for (const match of matches) {
    if (!map.has(match.jornadaNumero)) map.set(match.jornadaNumero, []);
    map.get(match.jornadaNumero)!.push(match);
  }
  return map;
}

export default function LigasNacionalesMatchSelector({ onSelectMatch, onClose }: Props) {
  const [competiciones, setCompeticiones] = useState<LigaCompetition[]>([]);
  const [loadingCompeticiones, setLoadingCompeticiones] = useState(true);
  const [competicion, setCompeticion] = useState<LigaCompetition | null>(null);
  const [fases, setFases] = useState<LigaFase[]>([]);
  const [selectedFaseId, setSelectedFaseId] = useState('');
  const [grupos, setGrupos] = useState<LigaGrupo[]>([]);
  const [selectedGrupoId, setSelectedGrupoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LigaGroupData | null>(null);
  const [selectedJornada, setSelectedJornada] = useState('');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [results, setResults] = useState<Record<number, LigaMatchResult>>({});
  // Set by handleRefresh so the results effect below bypasses its cache for that one reload.
  const forceResultsRef = useRef(false);

  useEffect(() => {
    fetchCompeticiones()
      .then(setCompeticiones)
      .catch(e => setError(e instanceof Error ? e.message : 'Error cargando las competiciones'))
      .finally(() => setLoadingCompeticiones(false));
  }, []);

  // Results (finished + score) live in a different endpoint than the match list, so they are
  // fetched for the jornada being viewed. Best-effort: on failure every match stays selectable.
  useEffect(() => {
    const jornadaId = data?.jornadaIds[selectedJornada];
    if (!jornadaId) { setResults({}); return; }
    let cancelled = false;
    const forceRefresh = forceResultsRef.current;
    forceResultsRef.current = false;
    fetchJornadaResults(jornadaId, forceRefresh)
      .then(r => { if (!cancelled) setResults(r); })
      .catch(() => { if (!cancelled) setResults({}); });
    return () => { cancelled = true; };
  }, [data, selectedJornada]);

  const resetDownstream = () => {
    setData(null);
    setSelectedJornada('');
    setLastFetched(null);
    setError(null);
  };

  // `selectedJornada` is '' after resetDownstream (new group) and still set on a refresh, so
  // pickInitialJornada lands on the current jornada for a new group and keeps what the
  // operator browsed to on a refresh.
  const loadMatches = async (grupo: LigaGrupo, fase: LigaFase, forceRefresh = false) => {
    const result = await fetchGroupData(grupo, fase, forceRefresh);
    const jornadaKeys = Array.from(groupByJornada(result.matches).keys());
    setData(result);
    setSelectedJornada(previous => pickInitialJornada(jornadaKeys, result.currentJornada, previous));
    setLastFetched(new Date());
  };

  const loadGrupos = async (fase: LigaFase, forceRefresh: boolean, preferGrupoId?: string) => {
    const gs = await resolveGrupos(fase.id, forceRefresh);
    setGrupos(gs);
    const grupo = gs.find(g => g.id === preferGrupoId) ?? gs[0];
    if (!grupo) { setSelectedGrupoId(''); return; }
    setSelectedGrupoId(grupo.id);
    await loadMatches(grupo, fase, forceRefresh);
  };

  const loadFases = async (comp: LigaCompetition, forceRefresh: boolean, preferFaseId?: string, preferGrupoId?: string) => {
    const fs = await resolveFases(comp.competicionId, forceRefresh);
    setFases(fs);
    const fase = fs.find(f => f.id === preferFaseId) ?? fs[0];
    if (!fase) { setSelectedFaseId(''); setGrupos([]); return; }
    setSelectedFaseId(fase.id);
    await loadGrupos(fase, forceRefresh, preferGrupoId);
  };

  const handleCompeticionChange = (competicionId: number) => {
    const comp = competiciones.find(c => c.competicionId === competicionId) ?? null;
    setCompeticion(comp);
    setFases([]);
    setSelectedFaseId('');
    setGrupos([]);
    setSelectedGrupoId('');
    resetDownstream();
    if (!comp) return;

    setLoading(true);
    loadFases(comp, false)
      .catch(e => setError(e instanceof Error ? e.message : 'Error cargando las fases'))
      .finally(() => setLoading(false));
  };

  const handleFaseChange = (faseId: string) => {
    const fase = fases.find(f => f.id === faseId);
    if (!fase) return;
    setSelectedFaseId(faseId);
    setGrupos([]);
    setSelectedGrupoId('');
    resetDownstream();
    setLoading(true);
    loadGrupos(fase, false)
      .catch(e => setError(e instanceof Error ? e.message : 'Error cargando los grupos'))
      .finally(() => setLoading(false));
  };

  const handleGrupoChange = (grupoId: string) => {
    const fase = fases.find(f => f.id === selectedFaseId);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!fase || !grupo) return;
    setSelectedGrupoId(grupoId);
    resetDownstream();
    setLoading(true);
    loadMatches(grupo, fase)
      .catch(e => setError(e instanceof Error ? e.message : 'Error cargando los partidos'))
      .finally(() => setLoading(false));
  };

  // Re-checks fases (not just the currently selected one) so a newly-seeded phase — a
  // promotion playoff, a final stage — becomes selectable without leaving the dialog.
  const handleRefresh = () => {
    if (!competicion) return;
    forceResultsRef.current = true;
    setLoading(true);
    loadFases(competicion, true, selectedFaseId, selectedGrupoId)
      .catch(e => setError(e instanceof Error ? e.message : 'Error actualizando'))
      .finally(() => setLoading(false));
  };

  const handleMatchSelect = (match: LigaMatch) => {
    if (!data || !competicion) return;
    onSelectMatch(buildMatchDetails(match, data, competicion));
    onClose();
  };

  const grouped = data ? groupByJornada(data.matches) : null;
  const jornadaKeys = grouped ? Array.from(grouped.keys()) : [];
  const visibleMatches = (grouped && selectedJornada) ? (grouped.get(selectedJornada) ?? []) : [];

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        Ligas Nacionales
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" fullWidth disabled={loadingCompeticiones}>
            <InputLabel>Competición</InputLabel>
            <Select
              value={competicion?.competicionId ?? ''}
              label="Competición"
              onChange={e => handleCompeticionChange(Number(e.target.value))}
            >
              <MenuItem value=""><em>Seleccionar</em></MenuItem>
              {competiciones.map(c => (
                <MenuItem key={c.competicionId} value={c.competicionId}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {fases.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Fase</InputLabel>
              <Select
                value={selectedFaseId}
                label="Fase"
                onChange={e => handleFaseChange(e.target.value)}
              >
                {fases.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.nombre.trim()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {grupos.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Grupo</InputLabel>
              <Select
                value={selectedGrupoId}
                label="Grupo"
                onChange={e => handleGrupoChange(e.target.value)}
              >
                {grupos.map(g => (
                  <MenuItem key={g.id} value={g.id}>{g.nombre.trim()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {lastFetched && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Actualizado: {lastFetched.toLocaleTimeString()}
              {selectedJornada ? ` · Jornada ${selectedJornada}` : ''}
            </Typography>
            <Tooltip title="Actualizar (comprueba también si hay nuevas fases)">
              <span>
                <IconButton size="small" aria-label="Actualizar" onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        {(loading || loadingCompeticiones) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ py: 2 }}>{error}</Typography>
        )}

        {data && !loading && jornadaKeys.length > 1 && (
          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Jornada</InputLabel>
            <Select
              value={selectedJornada}
              label="Jornada"
              onChange={e => setSelectedJornada(e.target.value)}
            >
              {jornadaKeys.map(k => (
                <MenuItem key={k} value={k}>{jornadaOptionLabel(k, k === data.currentJornada)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {data && !loading && visibleMatches.length > 0 && (
          <List dense disablePadding>
            {visibleMatches.map(match => {
              const result = results[match.id];
              const finished = result?.finished ?? false;
              const details = `${match.date} ${match.time} · ${match.venue}`;
              return (
                <ListItemButton
                  key={match.id}
                  onClick={() => handleMatchSelect(match)}
                  disabled={finished}
                  divider
                  sx={{ opacity: finished ? 0.5 : 1 }}
                >
                  <ListItemText
                    primary={`${match.homeTeam} vs ${match.awayTeam}`}
                    secondary={
                      finished
                        ? <>{`${details} · `}<strong>FINALIZADO: {result.homeScore}-{result.awayScore}</strong></>
                        : details
                    }
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}

        {data && !loading && selectedJornada && visibleMatches.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No hay partidos disponibles para esta jornada
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
