/**
 * ============================================================================
 * EJLOG WMS - Ferretto Theme System
 * Complete design system with Ferretto Group branding
 * ============================================================================
 *
 * Ferretto Group - Industrial Automation Company
 * Brand Colors: Red (#E30613), Dark Gray (#1A1A1A), Professional & Modern
 *
 * This theme system provides:
 * - Color palette with semantic naming
 * - Typography scale and font families
 * - Spacing system
 * - Border radius values
 * - Shadow definitions
 * - Transition and animation presets
 * - Component-specific tokens
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary - Ferretto Red
  ferretto: {
    red: '#E30613',           // Primary brand color
    redDark: '#B10510',       // Hover states, pressed
    redLight: '#FF3B47',      // Accents, highlights
    redLighter: '#FF8A8F',    // Subtle backgrounds
    redPale: '#FFE5E7',       // Very light backgrounds
  },

  // Gray Scale - Industrial, Professional
  gray: {
    50: '#FAFAFA',            // Page background
    100: '#F5F5F5',           // Cards, surfaces
    200: '#E5E5E5',           // Backgrounds light
    300: '#D4D4D4',           // Dividers
    400: '#A3A3A3',           // Placeholders
    500: '#737373',           // Disabled
    600: '#525252',           // Text secondary
    700: '#404040',           // Borders
    800: '#2D2D2D',           // Backgrounds dark
    900: '#1A1A1A',           // Text primary
  },

  // Dark Theme Colors (for sidebar, header, etc.)
  dark: {
    primary: '#32373c',       // Main dark bg
    secondary: '#4A5056',     // Lighter dark
    tertiary: '#23282d',      // Darker variant
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',       // Success states (green)
    warning: '#F59E0B',       // Warning states (amber)
    error: '#EF4444',         // Error states (red)
    info: '#3B82F6',          // Info states (blue)
  },

  // Status Colors (for badges, indicators)
  status: {
    active: '#10B981',
    inactive: '#6B7280',
    pending: '#F59E0B',
    completed: '#3B82F6',
    error: '#EF4444',
    cancelled: '#9CA3AF',
  },

  // Backgrounds
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
    dark: '#32373c',
    lightGray: '#F5F5F5',
  },

  // Text
  text: {
    primary: '#1A1A1A',
    secondary: '#525252',
    disabled: '#A3A3A3',
    inverse: '#FFFFFF',
  },

  // Borders
  border: {
    light: '#E5E5E5',
    default: '#D4D4D4',
    dark: '#404040',
    focus: '#E30613',
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: '"Inter", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
    // Legacy (già in uso)
    sans: '"Roboto", system-ui, sans-serif',
    barlow: '"Barlow Semi Condensed", sans-serif',
  },

  // Font Sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  default: '0.25rem', // 4px (Ferretto standard)
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 2px 8px rgba(0, 0, 0, 0.1)',
  md: '0 4px 12px rgba(0, 0, 0, 0.1)',
  lg: '0 4px 16px rgba(0, 0, 0, 0.15)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.15)',
  '2xl': '0 12px 40px rgba(0, 0, 0, 0.2)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Ferretto specific shadows
  ferretto: '0 2px 8px rgba(0, 0, 0, 0.1)',
  ferrettoLg: '0 4px 16px rgba(0, 0, 0, 0.15)',
  ferrettoXl: '0 8px 32px rgba(227, 6, 19, 0.1)',

  // Colored shadows (for buttons, active states)
  redGlow: '0 0 20px rgba(227, 6, 19, 0.3)',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  timing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },

  // Common presets
  presets: {
    default: 'all 200ms ease-in-out',
    fast: 'all 150ms ease-out',
    slow: 'all 300ms ease-in-out',
    colors: 'color 200ms ease-in-out, background-color 200ms ease-in-out, border-color 200ms ease-in-out',
    transform: 'transform 200ms ease-in-out',
    opacity: 'opacity 200ms ease-in-out',
  },
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const components = {
  // Button sizes
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
    padding: {
      sm: '0.5rem 1rem',
      md: '0.625rem 1.5rem',
      lg: '0.75rem 2rem',
    },
    fontSize: {
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
  },

  // Input sizes
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
    padding: {
      sm: '0.375rem 0.75rem',
      md: '0.5rem 1rem',
      lg: '0.75rem 1.25rem',
    },
  },

  // Card
  card: {
    padding: {
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[8],
    },
    borderRadius: borderRadius.default,
    shadow: shadows.default,
  },

  // Header
  header: {
    height: '4rem',      // 64px
    background: colors.background.paper,
    borderColor: colors.border.light,
  },

  // Sidebar
  sidebar: {
    widthExpanded: '16rem',   // 256px
    widthCollapsed: '4rem',    // 64px
    background: colors.dark.primary,
    borderColor: colors.gray[700],
  },

  // Table
  table: {
    headerBackground: colors.gray[100],
    rowHoverBackground: colors.gray[50],
    borderColor: colors.border.light,
  },
} as const;

// ============================================================================
// BREAKPOINTS (Responsive Design)
// ============================================================================

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// EXPORT DEFAULT THEME
// ============================================================================

export const ferrettoTheme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  components,
  breakpoints,
} as const;

// Type exports for TypeScript
export type FerrettoTheme = typeof ferrettoTheme;
export type ThemeColors = typeof colors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;

export default ferrettoTheme;
