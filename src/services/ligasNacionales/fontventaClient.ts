import type { LigaCompetition, LigaFase, LigaGrupo, LigaGroupData, LigaMatch, LigaStanding } from './types';
import { fetchCompetitionLogos, lookupCompetitionLogo } from './logos';

const FONTVENTA_BASE = 'https://rfevb.fontventa.com/api/competiciones';

// Short-lived on purpose: unlike the group list itself, a competition's phase list can
// grow mid-season (e.g. a promotion playoff phase appearing once seeded) — don't cache forever.
const CACHE_TTL_MS = 10 * 60 * 1000;

// The match list + standings bundle is the part users actually look at — cached for an hour,
// same convention as RfevbMatchSelector/EsvoleyMatchSelector's intranetClient.ts, so the
// selector's refresh button has something real to bypass instead of every load being a fresh
// network round-trip regardless of the cache.
const GROUP_DATA_CACHE_TTL_MS = 60 * 60 * 1000;

interface FontventaResponse<T> {
  content: T;
}

async function get<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  );
  const suffix = query.toString();
  const response = await fetch(`${FONTVENTA_BASE}/${endpoint}${suffix ? `?${suffix}` : ''}`);
  const json: FontventaResponse<T> = await response.json();
  return json.content;
}

// "Competiciones Nacionales" is the federation's own taxonomy category covering every
// competition this app tracks (Liga Iberdrola, Superliga(s), Primera División, both sexes).
// Resolved by name and cached rather than hardcoding its numeric id — this is an internal
// classification, not a sponsor name, but there's no reason to hardcode it when the API
// already exposes it via getTiposCompeticion.
let tipoCompeticionIdCache: { id: number; fetchedAt: number } | null = null;

async function resolveTipoCompeticionId(forceRefresh = false): Promise<number> {
  if (!forceRefresh && tipoCompeticionIdCache && Date.now() - tipoCompeticionIdCache.fetchedAt < CACHE_TTL_MS) {
    return tipoCompeticionIdCache.id;
  }
  const tipos = await get<Array<{ id: string; nombre: string }>>('getTiposCompeticion');
  const tipo = tipos.find(t => t.nombre.trim() === 'Competiciones Nacionales');
  if (!tipo) throw new Error('No se encontró el tipo de competición "Competiciones Nacionales"');
  const id = Number(tipo.id);
  tipoCompeticionIdCache = { id, fetchedAt: Date.now() };
  return id;
}

let competicionesCache: { competiciones: LigaCompetition[]; fetchedAt: number } | null = null;

// Names and ids come straight from the API — no hardcoded competition list. Confirmed live
// that tipoCompeticionId "Competiciones Nacionales" returns exactly the leagues this app
// tracks and nothing else (unlike the getTodosGruposCompeticionTemporadaActual bulk endpoint,
// which also returns unrelated/stale entries) — see esvoley-ligas-nacionales-plan.md.
export async function fetchCompeticiones(forceRefresh = false): Promise<LigaCompetition[]> {
  if (!forceRefresh && competicionesCache && Date.now() - competicionesCache.fetchedAt < CACHE_TTL_MS) {
    return competicionesCache.competiciones;
  }
  const [tipoCompeticionId, logosByName] = await Promise.all([
    resolveTipoCompeticionId(forceRefresh),
    // Best-effort: if the logo page can't be scraped, fall back to an empty map rather than
    // block loading competitions over a missing logo.
    fetchCompetitionLogos(forceRefresh).catch(() => new Map<string, string>()),
  ]);
  const rows = await get<Array<{ id: string; nombre_comp: string }>>('getCompeticiones', { tipoCompeticionId });
  const competiciones: LigaCompetition[] = rows.map(row => {
    const label = row.nombre_comp.trim();
    return { competicionId: Number(row.id), label, logo: lookupCompetitionLogo(logosByName, label) };
  });
  competicionesCache = { competiciones, fetchedAt: Date.now() };
  return competiciones;
}

const faseCache = new Map<number, { fases: LigaFase[]; fetchedAt: number }>();

// A competition can gain phases mid-season (e.g. a promotion/relegation playoff seeded once
// the regular season ends) — always fetch the full fase list, never assume there's only one.
// Kept separate from resolveGrupos so callers can detect *new* fases appearing without
// necessarily having a group already selected.
export async function resolveFases(competicionId: number, forceRefresh = false): Promise<LigaFase[]> {
  const cached = faseCache.get(competicionId);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.fases;
  }

  const temporadas = await get<Array<{ id: string; nombre: string }>>('getCompeticionesTemporada', { competicionId });
  const temporadaId = temporadas[0]?.id;
  if (!temporadaId) return [];

  const fases = await get<LigaFase[]>('getFasesCompeticion', { competicionTemporadaId: temporadaId });
  faseCache.set(competicionId, { fases, fetchedAt: Date.now() });
  return fases;
}

const grupoCache = new Map<string, { grupos: LigaGrupo[]; fetchedAt: number }>(); // keyed by faseId

// Walks the same cascade MatchSelector.tsx uses against intranet.fmvoley.com — confirmed to
// return only real, current groups (no stale duplicates or unseeded playoff placeholders),
// unlike the getTodosGruposCompeticionTemporadaActual bulk endpoint.
export async function resolveGrupos(faseId: string, forceRefresh = false): Promise<LigaGrupo[]> {
  const cached = grupoCache.get(faseId);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.grupos;
  }

  const grupos = await get<LigaGrupo[]>('getGruposCompeticion', { faseId });
  grupoCache.set(faseId, { grupos, fetchedAt: Date.now() });
  return grupos;
}

interface JornadaCalendarioResponse {
  numero: string;
  partidos: Array<{
    id: number;
    fecha: string;
    hora: string;
    pabellon: string;
    equipo_local: string;
    equipo_visitante: string;
    img_local: string;
    img_visitante: string;
  }>;
}

function parseMatches(jornadas: JornadaCalendarioResponse[]): LigaMatch[] {
  return jornadas.flatMap(jornada =>
    jornada.partidos.map(partido => ({
      id: partido.id,
      homeTeam: partido.equipo_local,
      awayTeam: partido.equipo_visitante,
      homeLogo: partido.img_local,
      awayLogo: partido.img_visitante,
      date: partido.fecha,
      time: partido.hora,
      venue: partido.pabellon,
      jornadaNumero: jornada.numero,
    }))
  );
}

interface ClasificacionRow {
  nombre: string;
  imagen: string;
  posicion: string;
  puntos: string;
  jugados: string;
  ganados: string;
  ganados3: string;
  ganados2: string;
  perdidos: string;
  perdidos1: string;
  perdidos0: string;
  puntos_a_favor: string;
  puntos_en_contra: string;
}

function parseStandings(rows: ClasificacionRow[]): Record<string, LigaStanding> {
  const standings: Record<string, LigaStanding> = {};
  for (const row of rows) {
    const team = row.nombre.trim();
    standings[team.toLowerCase()] = {
      team,
      logo: row.imagen,
      stats: {
        ranking: Number(row.posicion),
        competitionPoints: Number(row.puntos),
        matchesPlayed: Number(row.jugados),
        totalMatchesWon: Number(row.ganados),
        won3Points: Number(row.ganados3),
        won2Points: Number(row.ganados2),
        totalMatchesLost: Number(row.perdidos),
        lost1Point: Number(row.perdidos1),
        lost0Points: Number(row.perdidos0),
        totalPointsScored: Number(row.puntos_a_favor),
        totalPointsReceived: Number(row.puntos_en_contra),
      },
    };
  }
  return standings;
}

const groupDataCache = new Map<string, { data: LigaGroupData; fetchedAt: number }>(); // keyed by grupoId

export async function fetchGroupData(grupo: LigaGrupo, fase: LigaFase, forceRefresh = false): Promise<LigaGroupData> {
  const cached = groupDataCache.get(grupo.id);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < GROUP_DATA_CACHE_TTL_MS) {
    return cached.data;
  }

  const [jornadas, clasificacion] = await Promise.all([
    get<JornadaCalendarioResponse[]>('getJornadasCalendario', { grupoId: grupo.id }),
    get<ClasificacionRow[]>('getClasificacionGrupo', { grupoId: grupo.id }),
  ]);

  const data: LigaGroupData = {
    grupo,
    fase,
    matches: parseMatches(jornadas),
    standings: parseStandings(clasificacion),
  };
  groupDataCache.set(grupo.id, { data, fetchedAt: Date.now() });
  return data;
}
