import Fuse from 'fuse.js';
import staticImages from '../components/badges';

const fuse = new Fuse(staticImages, {
    keys: ['name'],
    threshold: 0.4,      // Ajusta este valor: < 0.4 es más estricto, > 0.4 es más permisivo
    includeScore: true,  // Necesario para ver la puntuación en el log
    ignoreLocation: true
});

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/cv |cde |cd |ad |ade |club |voleibol | a | b | c /g, "")
    .replace(/\.-/g, "")
    .replace(/glauka viajes|scolatrip|assa abloy|cluber/g, "")
    .trim();
}

export const getBestBadge = (teamName) => {
    if (!teamName) return null;
    const normalized = normalize(teamName);
    console.group(`Fuzzy Match: ${teamName}`);
    console.log(`Nombre normalizado: ${normalized}`)
    const results = fuse.search(normalized);

    if (results.length > 0) {
        const bestMatch = results[0];
        
        // Logging detallado para consola
        console.log(`%cEncontrado: ${bestMatch.item.name}`, "color: #4CAF50; font-weight: bold;");
        console.log(`Score: ${bestMatch.score.toFixed(4)} (0 es perfecto)`);
        console.groupEnd();
        
        return bestMatch.item.url;
    }
    
    console.warn(`%cNo se encontró coincidencia para: ${teamName}`, "color: #FF5722;");
    console.groupEnd();
    return null;
};