export const getContrastColor = (hexColor) => {
  if (!hexColor) return 'white';

  // Eliminar el # si existe
  const hex = hexColor.replace('#', '');
  
  // Convertir hex a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Fórmula de luminancia (estándar WCAG)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Retornar negro para fondos claros (>128) y blanco para oscuros
  return brightness > 128 ? '#000000' : '#ffffff';
};

export const isTooSimilar = (color1, color2, threshold = 20) => {
  const getLum = (hex) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114);
  };
  return Math.abs(getLum(color1) - getLum(color2)) < threshold;
};