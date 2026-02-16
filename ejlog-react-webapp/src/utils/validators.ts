// ============================================================================
// EJLOG WMS - Validators Utilities
// Funzioni di validazione
// ============================================================================

export const validateRequired = (value: any): string | undefined => {
  if (value === null || value === undefined || value === '') {
    return 'Campo obbligatorio';
  }
  return undefined;
};

export const validateEmail = (email: string): string | undefined => {
  if (!email) return undefined;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email non valida';
  }
  return undefined;
};

export const validateMinLength = (value: string, minLength: number): string | undefined => {
  if (!value) return undefined;

  if (value.length < minLength) {
    return `Minimo ${minLength} caratteri`;
  }
  return undefined;
};

export const validateMaxLength = (value: string, maxLength: number): string | undefined => {
  if (!value) return undefined;

  if (value.length > maxLength) {
    return `Massimo ${maxLength} caratteri`;
  }
  return undefined;
};

export const validateNumeric = (value: any): string | undefined => {
  if (value === null || value === undefined || value === '') return undefined;

  if (isNaN(Number(value))) {
    return 'Deve essere un numero';
  }
  return undefined;
};

export const validatePositive = (value: number): string | undefined => {
  if (value === null || value === undefined) return undefined;

  if (value < 0) {
    return 'Deve essere un valore positivo';
  }
  return undefined;
};

export const validateRange = (value: number, min: number, max: number): string | undefined => {
  if (value === null || value === undefined) return undefined;

  if (value < min || value > max) {
    return `Deve essere compreso tra ${min} e ${max}`;
  }
  return undefined;
};

export const validateBarcode = (barcode: string): string | undefined => {
  if (!barcode) return undefined;

  // Barcode deve essere alfanumerico
  const barcodeRegex = /^[A-Z0-9]+$/;
  if (!barcodeRegex.test(barcode)) {
    return 'Barcode non valido (solo caratteri alfanumerici maiuscoli)';
  }
  return undefined;
};
