import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
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
import { CATEGORIES, type Sex } from '../../services/rfevb/types';
import { fetchCompetitionData } from '../../services/rfevb/rfevbService';
import { resolveParticipant } from '../../services/rfevb/resolveParticipant';
import type { RfevbCompetitionData, RfevbMatch } from '../../services/rfevb/types';
import { getBestBadge } from '../../shared/utils/badgeUtils';

interface Props {
  onSelectMatch: (matchDetails: Record<string, unknown>) => void;
  onClose: () => void;
}

const EMPTY_STATS = { ranking: 0, competitionPoints: 0, matchesPlayed: 0, totalMatchesWon: 0, won3Points: 0, won2Points: 0, totalMatchesLost: 0, lost1Point: 0, lost0Points: 0, totalPointsScored: 0, totalPointsReceived: 0 };

function buildMatchDetails(
  match: RfevbMatch,
  data: RfevbCompetitionData,
  categorySlug: string,
  sex: Sex,
): Record<string, unknown> {
  const home = resolveParticipant(match.homeRef, data);
  const away = resolveParticipant(match.awayRef, data);
  const categoryLabel = CATEGORIES.find(c => c.slug === categorySlug)?.label ?? categorySlug;
  return {
    teamA: home.name,
    teamB: away.name,
    teamALogo: home.logoUrl || getBestBadge(home.name) || '',
    teamBLogo: away.logoUrl || getBestBadge(away.name) || '',
    matchHeader: `Campeonatos de España ${categoryLabel} ${sex}`,
    extendedInfo: match.phaseLabel ?? '',
    stadium: `${match.date} ${match.time} · ${match.venue}`,
    competitionLogo: data.logoUrl,
    maxSets: 5,
    stats: {
      teamA: data.standings[home.name.toLowerCase()] ?? EMPTY_STATS,
      teamB: data.standings[away.name.toLowerCase()] ?? EMPTY_STATS,
    },
  };
}

// Returns a two-level structure: top-level phase name → group label → matches
// phaseLabel format is "Primera Fase · Grupo A" or "Octavos · 1 al 8"
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
  '1 al 4', '5 al 8', '9 a 12', '13 al 16', '17 al 20', '21 al 24', '25 al 28', '29 al 32',
];

function sortGroupKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    const leadingNum = (s: string) => parseInt(s, 10) || 0;
    return leadingNum(a) - leadingNum(b) || a.localeCompare(b, 'es');
  });
}

export default function RfevbMatchSelector({ onSelectMatch, onClose }: Props) {
  const [categorySlug, setCategorySlug] = useState('');
  const [sex, setSex] = useState<Sex>('Femenino');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RfevbCompetitionData | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const year = new Date().getFullYear();

  const load = useCallback(async (slug: string, selectedSex: Sex, forceRefresh = false) => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSelectedPhase('');
    setSelectedGroup('');
    try {
      const result = await fetchCompetitionData(slug, selectedSex, year, forceRefresh);
      setData(result);
      const grouped = groupMatches(result.matches);
      const firstPhase = Array.from(grouped.keys())[0] ?? '';
      const firstGroup = sortGroupKeys(Array.from(grouped.get(firstPhase)?.keys() ?? []))[0] ?? '';
      setSelectedPhase(firstPhase);
      setSelectedGroup(firstGroup);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando los datos');
    } finally {
      setLoading(false);
    }
  }, [year]);

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    if (slug) load(slug, sex);
  };

  const handleSexChange = (_: React.MouseEvent, value: Sex | null) => {
    if (!value) return;
    setSex(value);
    if (categorySlug) load(categorySlug, value);
  };

  const handleMatchSelect = (match: RfevbMatch) => {
    if (!data) return;
    onSelectMatch(buildMatchDetails(match, data, categorySlug, sex));
    onClose();
  };

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
        Campeonatos de España RFEVB {year}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Category + sex selectors */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={categorySlug}
              label="Categoría"
              onChange={e => handleCategoryChange(e.target.value)}
            >
              <MenuItem value=""><em>Seleccionar</em></MenuItem>
              {CATEGORIES.map(c => (
                <MenuItem key={c.slug} value={c.slug}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={sex}
            exclusive
            onChange={handleSexChange}
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
                    onClick={() => load(categorySlug, sex, true)}
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
                <InputLabel>Grupo</InputLabel>
                <Select
                  value={selectedGroup}
                  label="Grupo"
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
