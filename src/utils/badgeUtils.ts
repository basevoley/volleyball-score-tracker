import Fuse from 'fuse.js';
import staticImages from '../components/badges';
import { Badge } from '../types';

const fuse = new Fuse<Badge>(staticImages, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
});

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/cv |cde |cd |ad |ade |club |voleibol | a | b | c /g, '')
    .replace(/\.-/g, '')
    .replace(/glauka viajes|scolatrip|assa abloy|cluber/g, '')
    .trim();
}

export const getBestBadge = (teamName: string | null): string | null => {
    if (!teamName) return null;
    const normalized = normalize(teamName);
    console.group(`Fuzzy Match: ${teamName}`);
    console.log(`Nombre normalizado: ${normalized}`);
    const results = fuse.search(normalized);

    if (results.length > 0) {
        const bestMatch = results[0];
        console.log(`%cEncontrado: ${bestMatch.item.name}`, 'color: #4CAF50; font-weight: bold;');
        console.log(`Score: ${bestMatch.score!.toFixed(4)} (0 es perfecto)`);
        console.groupEnd();
        return bestMatch.item.url;
    }

    console.warn(`%cNo se encontró coincidencia para: ${teamName}`, 'color: #FF5722;');
    console.groupEnd();
    return null;
};
