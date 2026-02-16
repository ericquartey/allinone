// ============================================================================
// EJLOG WMS - Formatters Utilities
// Funzioni di formattazione
// ============================================================================

export const formatDate = (date: string | Date, includeTime = false): string => {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (includeTime) {
    return d.toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('it-IT');
};

export const formatTime = (date: string | Date): string => {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatNumber = (num: number, decimals = 0): string => {
  return num.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
  });
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatWeight = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${grams} g`;
};

export const formatBarcode = (barcode: string): string => {
  if (!barcode) return '-';

  // Formatta barcode con spazi ogni 4 caratteri per leggibilità
  return barcode.replace(/(.{4})/g, '$1 ').trim();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
