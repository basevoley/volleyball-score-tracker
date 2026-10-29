import staticImages from './badges';
import { Badge } from '../../types';

/** Minimum weighted similarity (0..1) for a badge to be accepted. */
const MIN_SCORE = 0.5;
/** Minimum per-token similarity for a fuzzy (non-exact) token match. */
const MIN_TOKEN_SIMILARITY = 0.75;
/** Tokens shorter than this must match exactly (typo tolerance would be noise). */
const MIN_FUZZY_LENGTH = 4;

/** Legal forms, glue words, sport words and category words that carry no identity. */
const NOISE_TOKENS = new Set([
  'cv', 'cd', 'cde', 'cdb', 'cdev', 'ad', 'ade', 'sad', 'ud', 'club',
  'voleibol', 'voley', 'volley', 'volleyball',
  'de', 'del', 'la', 'las', 'los', 'el', 'y',
  // Category / level words appended by federation data ("... ALEVIN CIRCUITO MINIVOLEY FEMENINO")
  'femenino', 'masculino', 'fem', 'mas', 'masc',
  'prebenjamin', 'benjamin', 'benj', 'ben', 'alevin', 'ale', 'infantil', 'inf', 'cadete', 'cad',
  'juvenil', 'juv', 'junior', 'senior', 'pro', 'pre', 'ini', 'ava', 'liga', 'primavera',
  'circuito', 'minivoley', 'formacion', 'bis',
  // Team colours used to tell squads of the same club apart
  'blanco', 'negro', 'azul', 'rojo', 'verde', 'amarillo', 'naranja', 'morado', 'rosa',
  'celeste', 'marino', 'coral', 'purpura',
]);

/** Federation abbreviations expanded to the words used in badge names. */
const TOKEN_ALIASES: Record<string, string[]> = {
  cuv: ['cuva', 'unificado', 'alcorcon'],
  cuva: ['cuva', 'unificado', 'alcorcon'],
  avp: ['avp', 'academia', 'parla'],
  gdlr: ['grupo', 'deportivo', 'las', 'rozas'],
  mbva: ['madrid', 'beach', 'academy'],
  mirasur: ['mirasur', 'school', 'pinto'],
  gsd: ['gredos', 'san', 'diego'],
  bulldogs: ['villanueva', 'pardillo'],
  chamberi: ['madrid', 'ciudad'],
  sacochamartin: ['saco', 'chamartin'],
  nut: ['saint', 'louis', 'francais'],
  morillon: ['saint', 'louis', 'francais'],
  vp: ['playa'],
  vpmadrid: ['playa', 'madrid'],
  intr: ['international'],
  chv1995: ['chamartin', 'vergara', '1995'],
};

/** Sponsors that get prepended to team names in federation data. */
const SPONSOR_PHRASES = ['glauka viajes', 'scolatrip', 'assa abloy', 'cluber'];

/** Teams of these leagues must never get a badge from the folder (e.g. the "LMVP - ..." beach teams). */
const EXCLUDED_TOKENS = new Set(['lmvp']);

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function rawTokens(name: string): string[] {
  let text = stripAccents(name.toLowerCase());
  for (const sponsor of SPONSOR_PHRASES) text = text.replace(sponsor, ' ');
  return text.split(/[^a-z0-9]+/).filter(Boolean).flatMap(t => TOKEN_ALIASES[t] ?? [t]);
}

/** Identity tokens of a team name; falls back to all tokens if everything was noise. */
export function tokenize(name: string): string[] {
  const all = [...new Set(rawTokens(name))];
  // Single letters are category suffixes ("CV Alcalá B"), except digits.
  const meaningful = all.filter(t => !NOISE_TOKENS.has(t) && (t.length > 1 || /\d/.test(t)));
  return meaningful.length > 0 ? meaningful : all;
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return prev[b.length];
}

function tokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (Math.min(a.length, b.length) < MIN_FUZZY_LENGTH) return 0;
  const similarity = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  return similarity >= MIN_TOKEN_SIMILARITY ? similarity : 0;
}

interface BadgeIndex {
  entries: { badge: Badge; tokens: string[] }[];
  weightOf: (token: string) => number;
}

const indexCache = new WeakMap<Badge[], BadgeIndex>();

/** Tokens are weighted by rarity across all badges, so "san" counts less than "vallecas". */
function buildIndex(badges: Badge[]): BadgeIndex {
  const entries = badges.map(badge => ({ badge, tokens: tokenize(badge.name) }));
  const docFrequency = new Map<string, number>();
  for (const { tokens } of entries) {
    for (const token of new Set(tokens)) {
      docFrequency.set(token, (docFrequency.get(token) ?? 0) + 1);
    }
  }
  const weightOf = (token: string) =>
    Math.log(1 + badges.length / (1 + (docFrequency.get(token) ?? 0)));
  return { entries, weightOf };
}

function getIndex(badges: Badge[]): BadgeIndex {
  let index = indexCache.get(badges);
  if (!index) {
    index = buildIndex(badges);
    indexCache.set(badges, index);
  }
  return index;
}

/**
 * Similarity between a team name and a badge name, with typo-tolerant token matching.
 * Averages a weighted Dice coefficient with how much of the badge name is covered, so
 * extra words in the team name (sponsors, school names) don't discard an otherwise full match.
 */
function scoreTokens(query: string[], candidate: string[], weightOf: (t: string) => number): number {
  const candidateTotal = candidate.reduce((s, t) => s + weightOf(t), 0);
  const total = query.reduce((s, t) => s + weightOf(t), 0) + candidateTotal;
  if (total === 0) return 0;

  const used = new Set<number>();
  let matched = 0;
  for (const q of query) {
    let best = 0;
    let bestIdx = -1;
    candidate.forEach((c, idx) => {
      if (used.has(idx)) return;
      const sim = tokenSimilarity(q, c);
      if (sim > best) { best = sim; bestIdx = idx; }
    });
    if (bestIdx >= 0) {
      used.add(bestIdx);
      matched += best * Math.sqrt(weightOf(q) * weightOf(candidate[bestIdx]));
    }
  }
  const dice = (2 * matched) / total;
  const coverage = Math.min(1, matched / candidateTotal);
  return (dice + coverage) / 2;
}

/** Highest-scoring badge for a team name, regardless of the acceptance threshold. */
export function rankBadge(teamName: string, badges: Badge[] = staticImages): { badge: Badge; score: number } | null {
  const query = tokenize(teamName);
  if (query.length === 0) return null;

  const { entries, weightOf } = getIndex(badges);
  let best: { badge: Badge; score: number } | null = null;
  for (const { badge, tokens } of entries) {
    const score = scoreTokens(query, tokens, weightOf);
    if (score > (best?.score ?? 0)) best = { badge, score };
  }
  return best;
}

export const getBestBadge = (
  teamName: string | null,
  badges: Badge[] = staticImages,
): string | null => {
  if (!teamName || rawTokens(teamName).some(t => EXCLUDED_TOKENS.has(t))) return null;
  const best = rankBadge(teamName, badges);

  if (best && best.score >= MIN_SCORE) {
    console.debug(`Badge match: "${teamName}" -> "${best.badge.name}" (${best.score.toFixed(2)})`);
    return best.badge.url;
  }
  console.debug(`Badge match: no result for "${teamName}"`);
  return null;
};
