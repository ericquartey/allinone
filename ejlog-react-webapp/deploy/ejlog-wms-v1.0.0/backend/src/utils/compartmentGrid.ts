// src/utils/compartmentGrid.ts

/**
 * Grid Subdivision Utilities
 * Replicates Swing UI: UdcScompartazione subdivision algorithms
 */

export interface GridConfig {
  rows: number;
  columns: number;
  gridSnapX?: number; // Passo canotto X (mm)
  gridSnapY?: number; // Passo canotto Y (mm)
}

export interface Compartment {
  id?: number;
  xPosition: number;
  yPosition: number;
  width: number;
  depth: number;
  row?: number;
  column?: number;
  progressive?: number;
  fillPercentage?: number;
  barcode?: string;
  isNew?: boolean;
}

export interface LoadingUnit {
  id: number;
  code: string;
  width: number;  // mm
  depth: number;  // mm
  height: number; // mm
}

/**
 * Generate grid subdivision compartments
 * Based on: UdcScompartazione.dividiOrizzontalmenteVerticalmente()
 */
export function generateGridCompartments(
  loadingUnit: LoadingUnit,
  config: GridConfig
): Compartment[] {
  const { rows, columns, gridSnapX = 10, gridSnapY = 10 } = config;

  const compartments: Compartment[] = [];

  // Calculate raw dimensions
  const rawWidth = loadingUnit.width / columns;
  const rawDepth = loadingUnit.depth / rows;

  // Snap to grid (passo canotto)
  const snapToGrid = (value: number, gridSnap: number): number => {
    return Math.floor(value / gridSnap) * gridSnap;
  };

  // Calculate snapped dimensions for compartments
  const compartmentWidth = snapToGrid(rawWidth, gridSnapX);
  const compartmentDepth = snapToGrid(rawDepth, gridSnapY);

  // Error accumulation for better distribution
  let errorX = 0;
  let errorY = 0;
  let remainingWidth = loadingUnit.width;
  let remainingDepth = loadingUnit.depth;

  let progressive = 1;
  let posY = 0;

  // Rows (horizontal divisions - Y axis)
  for (let row = 0; row < rows; row++) {
    let posX = 0;
    remainingWidth = loadingUnit.width; // Reset for each row
    errorX = 0;

    // Calculate depth for this row
    let currentDepth: number;
    if (row === rows - 1) {
      // Last row gets all remaining depth
      currentDepth = remainingDepth;
    } else {
      // Calculate with error accumulation
      const targetDepth = rawDepth + errorY;
      currentDepth = snapToGrid(targetDepth, gridSnapY);
      errorY = targetDepth - currentDepth;
    }

    // Columns (vertical divisions - X axis)
    for (let col = 0; col < columns; col++) {
      let currentWidth: number;

      if (col === columns - 1) {
        // Last column gets all remaining width
        currentWidth = remainingWidth;
      } else {
        // Calculate with error accumulation
        const targetWidth = rawWidth + errorX;
        currentWidth = snapToGrid(targetWidth, gridSnapX);
        errorX = targetWidth - currentWidth;
      }

      // Create compartment
      compartments.push({
        xPosition: posX,
        yPosition: posY,
        width: currentWidth,
        depth: currentDepth,
        row: row + 1,
        column: col + 1,
        progressive: progressive++,
        fillPercentage: 0,
        barcode: `COMP-R${row + 1}C${col + 1}`,
        isNew: true
      });

      posX += currentWidth;
      remainingWidth -= currentWidth;
    }

    posY += currentDepth;
    remainingDepth -= currentDepth;
  }

  return compartments;
}

/**
 * Get compartment fill color based on percentage
 * Based on: ScompartoGraficoRendererDefault.getColor()
 */
export function getCompartmentFillColor(fillPercentage: number): string {
  // Empty: gray (#808080)
  // Full: red (#FF0000)
  // Interpolate between them

  const gray = { r: 128, g: 128, b: 128 };
  const red = { r: 255, g: 0, b: 0 };

  const ratio = fillPercentage / 100;

  const r = Math.round(red.r * ratio + gray.r * (1 - ratio));
  const g = Math.round(red.g * ratio + gray.g * (1 - ratio));
  const b = Math.round(red.b * ratio + gray.b * (1 - ratio));

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Validate grid configuration
 */
export function validateGridConfig(
  loadingUnit: LoadingUnit,
  config: GridConfig
): { valid: boolean; error?: string } {
  const { rows, columns, gridSnapX = 10, gridSnapY = 10 } = config;

  // Check minimum/maximum values
  if (rows < 1 || rows > 20) {
    return { valid: false, error: 'Righe deve essere tra 1 e 20' };
  }
  if (columns < 1 || columns > 20) {
    return { valid: false, error: 'Colonne deve essere tra 1 e 20' };
  }

  // Check minimum compartment size
  const minCompartmentSize = 50; // mm (as in Swing code)

  const compartmentWidth = loadingUnit.width / columns;
  const compartmentDepth = loadingUnit.depth / rows;

  if (compartmentWidth < minCompartmentSize) {
    return {
      valid: false,
      error: `Larghezza scomparto troppo piccola: ${Math.round(compartmentWidth)}mm (min ${minCompartmentSize}mm)`
    };
  }

  if (compartmentDepth < minCompartmentSize) {
    return {
      valid: false,
      error: `Profondità scomparto troppo piccola: ${Math.round(compartmentDepth)}mm (min ${minCompartmentSize}mm)`
    };
  }

  // Check grid snap compatibility
  if (compartmentWidth < gridSnapX) {
    return {
      valid: false,
      error: `Larghezza scomparto (${Math.round(compartmentWidth)}mm) < grid snap X (${gridSnapX}mm)`
    };
  }

  if (compartmentDepth < gridSnapY) {
    return {
      valid: false,
      error: `Profondità scomparto (${Math.round(compartmentDepth)}mm) < grid snap Y (${gridSnapY}mm)`
    };
  }

  return { valid: true };
}

/**
 * Check if a compartment is within loading unit bounds
 */
export function isCompartmentWithinBounds(
  compartment: Compartment,
  loadingUnit: LoadingUnit
): boolean {
  const { xPosition, yPosition, width, depth } = compartment;

  return (
    xPosition >= 0 &&
    yPosition >= 0 &&
    xPosition + width <= loadingUnit.width &&
    yPosition + depth <= loadingUnit.depth
  );
}
