// 1. Mockeamos el archivo de imágenes antes de importar la función
// jest.mock('../../components/badges', () => [
//   { name: 'Alcalá', url: 'http://link-alcala.png' },
//   { name: 'Real Madrid', url: 'http://link-madrid.png' }
// ]);

// 2. Ahora importamos la función (que internamente usará el mock de arriba)
import { getBestBadge } from '../badgeUtils';

describe('getBestBadge', () => {
  // Limpiamos la consola para que el output sea legible
//   beforeAll(() => {
//     jest.spyOn(console, 'log').mockImplementation(() => {});
//     jest.spyOn(console, 'group').mockImplementation(() => {});
//     jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
//   });

  test('debe retornar null si no se pasa un nombre', () => {
    expect(getBestBadge(null)).toBeNull();
  });

  test('debe normalizar y encontrar el escudo (ej: CV Alcalá -> Alcalá)', () => {
    const result = getBestBadge('ASSA ABLOY SANSE'); 
    expect(result).not.toBeNull();
  });

  test('debe ser flexible con errores (fuzzy search)', () => {
    const result = getBestBadge('Alcala'); // Sin tilde
    expect(result).toBe('http://localhost:3005/images/teams/cv-alcala.jpg');
  });

  test('debe retornar null si no hay coincidencia', () => {
    expect(getBestBadge('Equipo Inventado')).toBeNull();
  });
});
