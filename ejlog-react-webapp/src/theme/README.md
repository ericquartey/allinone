# Ferretto Theme System

Complete design system for EJLOG WMS with Ferretto Group branding.

## Quick Start

```tsx
import { ferrettoTheme } from './ferretto.theme';

// Access theme tokens
const primaryColor = ferrettoTheme.colors.ferretto.red;
const spacing = ferrettoTheme.spacing[4];
const shadow = ferrettoTheme.shadows.ferretto;
```

## Usage with Styled Components

```tsx
import styled from '@emotion/styled';
import { ferrettoTheme } from '@/theme/ferretto.theme';

const Button = styled.button`
  background: ${ferrettoTheme.colors.ferretto.red};
  padding: ${ferrettoTheme.spacing[4]} ${ferrettoTheme.spacing[6]};
  border-radius: ${ferrettoTheme.borderRadius.default};
  box-shadow: ${ferrettoTheme.shadows.ferretto};
  transition: ${ferrettoTheme.transitions.presets.default};

  &:hover {
    background: ${ferrettoTheme.colors.ferretto.redDark};
  }
`;
```

## Usage with Tailwind

Theme tokens are automatically available via TailwindCSS:

```tsx
<button className="bg-ferretto-red text-white px-4 py-2 rounded-ferretto shadow-ferretto hover:bg-ferretto-red-dark transition-all">
  Click Me
</button>
```

## Color Palette

### Ferretto Red
- `ferretto.red` - #E30613 (Primary)
- `ferretto.redDark` - #B10510 (Hover)
- `ferretto.redLight` - #FF3B47 (Accent)
- `ferretto.redLighter` - #FF8A8F (Highlight)
- `ferretto.redPale` - #FFE5E7 (Background)

### Gray Scale
- `gray[50-900]` - Complete professional gray scale

### Semantic
- `semantic.success` - #10B981
- `semantic.warning` - #F59E0B
- `semantic.error` - #EF4444
- `semantic.info` - #3B82F6

## Typography

```tsx
// Font families
ferrettoTheme.typography.fontFamily.primary  // Inter
ferrettoTheme.typography.fontFamily.heading  // Inter
ferrettoTheme.typography.fontFamily.mono     // JetBrains Mono

// Font sizes
ferrettoTheme.typography.fontSize.sm   // 0.875rem
ferrettoTheme.typography.fontSize.base // 1rem
ferrettoTheme.typography.fontSize.xl   // 1.25rem
```

## Spacing

```tsx
// Access spacing tokens
ferrettoTheme.spacing[1]  // 0.25rem (4px)
ferrettoTheme.spacing[4]  // 1rem (16px)
ferrettoTheme.spacing[8]  // 2rem (32px)
```

## Shadows

```tsx
ferrettoTheme.shadows.sm           // Subtle
ferrettoTheme.shadows.ferretto     // Standard
ferrettoTheme.shadows.ferrettoLg   // Large
ferrettoTheme.shadows.redGlow      // Red glow effect
```

## TypeScript

Full type definitions:

```tsx
import type {
  FerrettoTheme,
  ThemeColors,
  ThemeTypography
} from './ferretto.theme';

const myTheme: FerrettoTheme = ferrettoTheme;
```

## Documentation

See `THEME_REDESIGN_REPORT.md` for complete documentation.
