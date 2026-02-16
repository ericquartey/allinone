/**
 * Utility functions for compartment colors
 * Each compartment gets a unique base color that darkens based on fill percentage
 */

// Base color palette - vibrant and distinct colors
const BASE_COLORS = [
  { name: 'blue', light: '#93c5fd', medium: '#3b82f6', dark: '#1e40af' },      // Blue
  { name: 'green', light: '#86efac', medium: '#10b981', dark: '#047857' },     // Green
  { name: 'purple', light: '#c4b5fd', medium: '#8b5cf6', dark: '#5b21b6' },    // Purple
  { name: 'orange', light: '#fdba74', medium: '#f97316', dark: '#c2410c' },    // Orange
  { name: 'pink', light: '#f9a8d4', medium: '#ec4899', dark: '#be185d' },      // Pink
  { name: 'cyan', light: '#67e8f9', medium: '#06b6d4', dark: '#0e7490' },      // Cyan
  { name: 'yellow', light: '#fde047', medium: '#eab308', dark: '#a16207' },    // Yellow
  { name: 'red', light: '#fca5a5', medium: '#ef4444', dark: '#b91c1c' },       // Red
  { name: 'indigo', light: '#a5b4fc', medium: '#6366f1', dark: '#3730a3' },    // Indigo
  { name: 'teal', light: '#5eead4', medium: '#14b8a6', dark: '#0f766e' },      // Teal
  { name: 'lime', light: '#bef264', medium: '#84cc16', dark: '#4d7c0f' },      // Lime
  { name: 'rose', light: '#fda4af', medium: '#f43f5e', dark: '#be123c' },      // Rose
];

/**
 * Get color for a compartment based on its index and fill percentage
 * @param compartmentIndex - The index of the compartment (0-based)
 * @param fillPercentage - Fill percentage (0-100)
 * @param hasArticles - Whether the compartment contains articles (default: true for backward compatibility)
 * @returns RGB color string
 */
export function getCompartmentColor(compartmentIndex: number, fillPercentage: number, hasArticles: boolean = true): string {
  // If compartment is empty (no articles), return gray color
  if (!hasArticles || fillPercentage === 0) {
    return '#f3f4f6'; // gray-100 (light gray for empty compartments)
  }

  // Select base color by cycling through palette
  const baseColor = BASE_COLORS[compartmentIndex % BASE_COLORS.length];

  // Determine intensity based on fill percentage
  // 1-30%: light color
  // 31-70%: medium color
  // 71-100%: dark color
  if (fillPercentage <= 30) {
    return baseColor.light;
  } else if (fillPercentage <= 70) {
    return baseColor.medium;
  } else {
    return baseColor.dark;
  }
}

/**
 * Get color with opacity for a compartment
 * @param compartmentIndex - The index of the compartment (0-based)
 * @param fillPercentage - Fill percentage (0-100)
 * @param opacity - Opacity value (0-1)
 * @returns RGBA color string
 */
export function getCompartmentColorWithOpacity(
  compartmentIndex: number,
  fillPercentage: number,
  opacity: number = 1
): string {
  const color = getCompartmentColor(compartmentIndex, fillPercentage);

  // Convert hex to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get border color for a compartment (always darker version)
 * @param compartmentIndex - The index of the compartment (0-based)
 * @returns RGB color string
 */
export function getCompartmentBorderColor(compartmentIndex: number): string {
  const baseColor = BASE_COLORS[compartmentIndex % BASE_COLORS.length];
  return baseColor.dark;
}

/**
 * Get a descriptive color name for UI display
 * @param compartmentIndex - The index of the compartment (0-based)
 * @returns Color name string
 */
export function getCompartmentColorName(compartmentIndex: number): string {
  const baseColor = BASE_COLORS[compartmentIndex % BASE_COLORS.length];
  return baseColor.name.charAt(0).toUpperCase() + baseColor.name.slice(1);
}

/**
 * Get text color (black or white) based on background brightness
 * @param backgroundColor - Background color in hex format
 * @returns 'white' or 'black'
 */
export function getContrastTextColor(backgroundColor: string): 'white' | 'black' {
  // Convert hex to RGB
  const r = parseInt(backgroundColor.slice(1, 3), 16);
  const g = parseInt(backgroundColor.slice(3, 5), 16);
  const b = parseInt(backgroundColor.slice(5, 7), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? 'black' : 'white';
}
