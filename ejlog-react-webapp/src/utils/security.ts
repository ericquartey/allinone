// ============================================================================
// EJLOG WMS - Security Utilities
// Input validation, XSS prevention, and security helpers
// ============================================================================

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onload, etc.)
    .trim();
}

/**
 * Sanitize HTML content - preserves safe HTML but removes dangerous elements
 * Use with caution - prefer sanitizeInput for most cases
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 * Only allows http and https protocols
 */
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate phone number (Italian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+39)?[\s]?[0-9]{2,4}[\s]?[0-9]{6,7}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate barcode format (EAN-13)
 */
export function isValidBarcode(barcode: string): boolean {
  const barcodeRegex = /^[0-9]{13}$/;
  return barcodeRegex.test(barcode);
}

/**
 * Validate item code (alphanumeric with optional dashes and underscores)
 */
export function isValidItemCode(code: string): boolean {
  const codeRegex = /^[A-Za-z0-9_-]{1,50}$/;
  return codeRegex.test(code);
}

/**
 * Validate numeric input within range
 */
export function isValidNumber(
  value: number | string,
  min?: number,
  max?: number
): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;

  return true;
}

/**
 * Validate string length
 */
export function isValidLength(
  str: string,
  minLength: number,
  maxLength?: number
): boolean {
  if (!str) return false;
  if (str.length < minLength) return false;
  if (maxLength && str.length > maxLength) return false;
  return true;
}

/**
 * Validate date format and range
 */
export function isValidDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValidDate(dateObj) && dateObj.getTime() > Date.now();
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValidDate(dateObj) && dateObj.getTime() < Date.now();
}

/**
 * Validate password strength
 * Returns object with validation status and strength score
 */
export function validatePassword(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  // Minimum length
  if (password.length < 8) {
    errors.push('La password deve essere di almeno 8 caratteri');
  } else {
    score += 1;
  }

  // Contains lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  } else {
    score += 1;
  }

  // Contains uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  } else {
    score += 1;
  }

  // Contains number
  if (!/[0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un numero');
  } else {
    score += 1;
  }

  // Contains special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un carattere speciale');
  } else {
    score += 1;
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    isValid: errors.length === 0,
    strength,
    errors,
  };
}

/**
 * Escape special characters for use in SQL queries
 * WARNING: This is NOT a replacement for parameterized queries!
 * Always use parameterized queries when available
 */
export function escapeSQLInput(input: string): string {
  if (!input) return '';
  return input.replace(/['";\\]/g, '\\$&');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256 (for client-side hashing only)
 * For passwords, always use server-side hashing with bcrypt/argon2
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem('csrf_token');
  return token === storedToken;
}

/**
 * Generate and store CSRF token
 */
export function generateCSRFToken(): string {
  const token = generateSecureToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
}

/**
 * Check if a value contains SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(;|\-\-|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /('.*OR.*'.*=.*')/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if a value contains XSS patterns
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive input validation
 * Returns sanitized input and validation errors
 */
export function validateInput(
  input: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowHTML?: boolean;
    checkXSS?: boolean;
    checkSQLInjection?: boolean;
  } = {}
): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} {
  const errors: string[] = [];
  let sanitized = input?.trim() || '';

  // Required validation
  if (options.required && !sanitized) {
    errors.push('Campo obbligatorio');
    return { isValid: false, sanitized: '', errors };
  }

  // Length validation
  if (options.minLength && sanitized.length < options.minLength) {
    errors.push(`Lunghezza minima: ${options.minLength} caratteri`);
  }

  if (options.maxLength && sanitized.length > options.maxLength) {
    errors.push(`Lunghezza massima: ${options.maxLength} caratteri`);
  }

  // Pattern validation
  if (options.pattern && !options.pattern.test(sanitized)) {
    errors.push('Formato non valido');
  }

  // XSS check
  if (options.checkXSS !== false && containsXSS(sanitized)) {
    errors.push('Input contiene contenuto non sicuro');
  }

  // SQL Injection check
  if (options.checkSQLInjection && containsSQLInjection(sanitized)) {
    errors.push('Input contiene caratteri non permessi');
  }

  // Sanitize
  if (!options.allowHTML) {
    sanitized = sanitizeInput(sanitized);
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Rate limiting helper for client-side
 * Prevents rapid form submissions
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if action is allowed based on rate limit
   * @param key Unique identifier for the action
   * @param maxAttempts Maximum attempts allowed
   * @param windowMs Time window in milliseconds
   * @returns true if action is allowed
   */
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return false;
    }

    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true;
  }

  /**
   * Reset attempts for a specific key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Secure localStorage wrapper with encryption
 * Note: This provides basic obfuscation, not true encryption
 * For sensitive data, use server-side encryption
 */
export const secureStorage = {
  /**
   * Store data with basic obfuscation
   */
  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encoded = btoa(serialized); // Base64 encoding
      localStorage.setItem(key, encoded);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },

  /**
   * Retrieve and decode data
   */
  getItem<T = any>(key: string): T | null {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;

      const decoded = atob(encoded);
      return JSON.parse(decoded) as T;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  /**
   * Remove item
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear all items
   */
  clear(): void {
    localStorage.clear();
  },
};

export default {
  sanitizeInput,
  sanitizeHTML,
  isValidEmail,
  isValidURL,
  isValidPhone,
  isValidBarcode,
  isValidItemCode,
  isValidNumber,
  isValidLength,
  isValidDate,
  isFutureDate,
  isPastDate,
  validatePassword,
  escapeSQLInput,
  generateSecureToken,
  hashString,
  validateCSRFToken,
  generateCSRFToken,
  containsSQLInjection,
  containsXSS,
  validateInput,
  rateLimiter,
  secureStorage,
};
