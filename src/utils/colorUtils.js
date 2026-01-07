export const getContrastColor = (hexColor) => {
  if (!hexColor) return 'white';
  // Retornar negro para fondos claros (>128) y blanco para oscuros
  return getLum(hexColor) > 128 ? '#000000' : '#ffffff';
};

export const isTooSimilar = (color1, color2, threshold = 0.6) => {
  return getPerceptualDifference(color1, color2) < threshold;
};

const getLum = (hexColor) => {
  // Eliminar el # si existe
  const hex = hexColor.replace('#', '');
  
  // Convertir hex a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Fórmula de luminancia (estándar WCAG)
  return (r * 299 + g * 587 + b * 114) / 1000;    
}

const getPerceptualDifference = (hex1, hex2) => {
  const parse = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const c1 = parse(hex1);
  const c2 = parse(hex2);

  // Calculamos la distancia en el espacio RGB pero ponderada 
  // (Fórmula "Redmean" que es un buen compromiso entre velocidad y percepción)
  const rMean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  
  return Math.sqrt(
    (2 + rMean) * dr * dr + 
    4 * dg * dg + 
    (3 - rMean) * db * db
  );
};