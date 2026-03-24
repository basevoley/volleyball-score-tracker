export const getContrastColor = (hexColor: string): string => {
  if (!hexColor) return 'white';
  return getLum(hexColor) > 128 ? '#000000' : '#ffffff';
};

export const isTooSimilar = (color1: string, color2: string, threshold = 0.6): boolean => {
  return getPerceptualDifference(color1, color2) < threshold;
};

const getLum = (hexColor: string): number => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
};

const getPerceptualDifference = (hex1: string, hex2: string): number => {
  const parse = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  });
  const c1 = parse(hex1);
  const c2 = parse(hex2);
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
