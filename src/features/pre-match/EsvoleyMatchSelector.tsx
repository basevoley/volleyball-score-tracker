import React, { useState, useEffect, useCallback } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import { resolveParticipant } from '../../services/rfevb/resolveParticipant';
import type { RfevbMatch } from '../../services/rfevb/types';
import type { Sex } from '../../services/rfevb/types';
import { getBestBadge } from '../../shared/utils/badgeUtils';
import {
  COMPETITION_PATHS,
  discoverGroups,
  fetchGroupData,
} from '../../services/esvoley/esvoleyService';
import type { EsvoleyGroup, EsvoleyGroupData } from '../../services/esvoley/esvoleyService';

interface Props {
  onSelectMatch: (matchDetails: Record<string, unknown>) => void;
  onClose: () => void;
}

const EMPTY_STATS = { ranking: 0, competitionPoints: 0, matchesPlayed: 0, totalMatchesWon: 0, won3Points: 0, won2Points: 0, totalMatchesLost: 0, lost1Point: 0, lost0Points: 0, totalPointsScored: 0, totalPointsReceived: 0 };

function buildMatchDetails(match: RfevbMatch, data: EsvoleyGroupData, sex: Sex): Record<string, unknown> {
  const home = resolveParticipant(match.homeRef, data);
  const away = resolveParticipant(match.awayRef, data);
  return {
    teamA: home.name,
    teamB: away.name,
    teamALogo: home.logoUrl || getBestBadge(home.name) || '',
    teamBLogo: away.logoUrl || getBestBadge(away.name) || '',
    matchHeader: COMPETITION_PATHS[sex].label,
    extendedInfo: data.groupName,
    stadium: `${match.date} ${match.time} · ${match.venue}`,
    competitionLogo: data.logoUrl,
    maxSets: 5,
    stats: {
      teamA: data.standings[home.name.toLowerCase()] ?? EMPTY_STATS,
      teamB: data.standings[away.name.toLowerCase()] ?? EMPTY_STATS,
    },
  };
}

// Two-level grouping: phase name → group label → matches (same format as RfevbMatchSelector)
function groupMatches(matches: RfevbMatch[]): Map<string, Map<string, RfevbMatch[]>> {
  const map = new Map<string, Map<string, RfevbMatch[]>>();
  for (const match of matches) {
    const [phase, group] = match.phaseLabel
      ? match.phaseLabel.split(' · ').map(s => s.trim())
      : ['Sin fase', ''];
    const groupKey = group || phase;
    if (!map.has(phase)) map.set(phase, new Map());
    const inner = map.get(phase)!;
    if (!inner.has(groupKey)) inner.set(groupKey, []);
    inner.get(groupKey)!.push(match);
  }
  return map;
}

const GROUP_ORDER = [
  'Grupo A', 'Grupo B', 'Grupo C', 'Grupo D',
  'Grupo E', 'Grupo F', 'Grupo G', 'Grupo H',
  '1 al 16', '17 al 32',
  '1 al 8', '9 al 16', '17 al 24', '25 al 32',
  '1 al 4', '5 al 8', '9 a 12', '13 al 16',
];

function sortGroupKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, 'es');
  });
}

export default function EsvoleyMatchSelector({ onSelectMatch, onClose }: Props) {
  const [sex, setSex] = useState<Sex>('Femenino');
  const [groups, setGroups] = useState<EsvoleyGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EsvoleyGroupData | null>(null);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    setGroups([]);
    setSelectedGroupId('');
    setData(null);
    setSelectedPhase('');
    setSelectedGroup('');
    setLastFetched(null);
    setLoadingGroups(true);
    setError(null);
    discoverGroups(sex)
      .then(g => setGroups(g))
      .catch(e => setError(e instanceof Error ? e.message : 'Error cargando los grupos'))
      .finally(() => setLoadingGroups(false));
  }, [sex]);

  const loadGroupData = useCallback(async (groupId: string, forceRefresh = false) => {
    const group = groups.find(g => g.competitionId === groupId);
    if (!group) return;
    setLoadingMatches(true);
    setError(null);
    setData(null);
    setSelectedPhase('');
    setSelectedGroup('');
    try {
      const result = await fetchGroupData(group, forceRefresh);
      setData(result);
      const grouped = groupMatches(result.matches);
      const firstPhase = Array.from(grouped.keys())[0] ?? '';
      const firstGroup = sortGroupKeys(Array.from(grouped.get(firstPhase)?.keys() ?? []))[0] ?? '';
      setSelectedPhase(firstPhase);
      setSelectedGroup(firstGroup);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando los partidos');
    } finally {
      setLoadingMatches(false);
    }
  }, [groups]);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (groupId) loadGroupData(groupId);
  };

  const handleMatchSelect = (match: RfevbMatch) => {
    if (!data) return;
    onSelectMatch(buildMatchDetails(match, data, sex));
    onClose();
  };

  const loading = loadingGroups || loadingMatches;
  const grouped = data ? groupMatches(data.matches) : null;
  const phaseKeys = grouped ? Array.from(grouped.keys()) : [];
  const groupKeys = (grouped && selectedPhase)
    ? sortGroupKeys(Array.from(grouped.get(selectedPhase)?.keys() ?? []))
    : [];
  const visibleMatches = (grouped && selectedPhase && selectedGroup)
    ? (grouped.get(selectedPhase)?.get(selectedGroup) ?? [])
    : [];

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        {COMPETITION_PATHS[sex].label}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Group selector + sex toggle */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }} disabled={loadingGroups}>
            <InputLabel>Grupo</InputLabel>
            <Select
              value={selectedGroupId}
              label="Grupo"
              onChange={e => handleGroupChange(e.target.value)}
            >
              <MenuItem value=""><em>Seleccionar</em></MenuItem>
              {groups.map(g => (
                <MenuItem key={g.competitionId} value={g.competitionId}>{g.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={sex}
            exclusive
            onChange={(_: React.MouseEvent, value: Sex | null) => { if (value) setSex(value); }}
            size="small"
          >
            <Tooltip title="Femenino">
              <ToggleButton value="Femenino">
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Femenino</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>F</Box>
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Masculino">
              <ToggleButton value="Masculino">
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Masculino</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>M</Box>
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Box>

        {lastFetched && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Actualizado: {lastFetched.toLocaleTimeString()}
            </Typography>
            {data && (
              <Tooltip title="Actualizar">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => loadGroupData(selectedGroupId, true)}
                    disabled={loading}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ py: 2 }}>{error}</Typography>
        )}

        {/* Phase + group filters */}
        {data && !loading && phaseKeys.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Fase</InputLabel>
              <Select
                value={selectedPhase}
                label="Fase"
                onChange={e => {
                  const phase = e.target.value;
                  setSelectedPhase(phase);
                  const firstGroup = sortGroupKeys(Array.from(grouped!.get(phase)?.keys() ?? []))[0] ?? '';
                  setSelectedGroup(firstGroup);
                }}
              >
                {phaseKeys.map(k => (
                  <MenuItem key={k} value={k}>{k}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {groupKeys.length > 1 && (
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Subgrupo</InputLabel>
                <Select
                  value={selectedGroup}
                  label="Subgrupo"
                  onChange={e => setSelectedGroup(e.target.value)}
                >
                  {groupKeys.map(k => (
                    <MenuItem key={k} value={k}>{k}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {/* Match list */}
        {data && !loading && visibleMatches.length > 0 && (
          <List dense disablePadding>
            {visibleMatches.map(match => {
              const home = resolveParticipant(match.homeRef, data);
              const away = resolveParticipant(match.awayRef, data);
              const unresolved = !home.resolved || !away.resolved;
              const played = match.homeScore > 0 || match.awayScore > 0;
              return (
                <ListItemButton
                  key={match.id}
                  onClick={() => handleMatchSelect(match)}
                  disabled={unresolved || played}
                  divider
                  sx={{ opacity: unresolved || played ? 0.5 : 1 }}
                >
                  <ListItemText
                    primary={`${home.name} vs ${away.name}`}
                    secondary={
                      played
                        ? <>{`${match.date} ${match.time} · ${match.venue} · `}<strong>FINALIZADO: {match.homeScore}-{match.awayScore}</strong></>
                        : `${match.date} ${match.time} · ${match.venue}`
                    }
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}

        {data && !loading && selectedPhase && visibleMatches.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No hay partidos disponibles para esta fase
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
