# Ferretto Brand Components

Brand assets for EJLOG WMS with Ferretto Group identity.

## FerrettoLogo Component

Professional SVG logo component with multiple variants.

### Basic Usage

```tsx
import FerrettoLogo from '@/components/brand/FerrettoLogo';

// Full logo (icon + text)
<FerrettoLogo />

// Icon only
<FerrettoLogo variant="icon" />

// Text only
<FerrettoLogo variant="text" />
```

### Props

```tsx
interface FerrettoLogoProps {
  variant?: 'full' | 'icon' | 'text';  // Default: 'full'
  size?: 'sm' | 'md' | 'lg' | 'xl';    // Default: 'md'
  className?: string;
  color?: 'default' | 'white' | 'red'; // Default: 'default'
}
```

### Variants

**Full** - Icon + Text + Tagline
```tsx
<FerrettoLogo variant="full" size="md" />
```

**Icon** - Logo mark only (circular F with gear)
```tsx
<FerrettoLogo variant="icon" size="sm" />
```

**Text** - "FERRETTO" text only
```tsx
<FerrettoLogo variant="text" size="lg" />
```

### Sizes

| Size | Height | Use Case |
|------|--------|----------|
| `sm` | 32px | Headers, compact spaces |
| `md` | 40px | Standard usage |
| `lg` | 56px | Hero sections |
| `xl` | 72px | Landing pages |

### Colors

**Default** - Red + Black (primary brand colors)
```tsx
<FerrettoLogo color="default" />
```

**White** - All white (for dark backgrounds)
```tsx
<div className="bg-gray-900">
  <FerrettoLogo color="white" />
</div>
```

**Red** - All red (monochrome accent)
```tsx
<FerrettoLogo color="red" />
```

### Examples

#### Header Usage
```tsx
<header className="bg-white">
  <FerrettoLogo variant="full" size="sm" />
</header>
```

#### Sidebar Usage
```tsx
<aside className="bg-ferretto-dark">
  <FerrettoLogo variant="icon" size="md" color="white" />
</aside>
```

#### Footer Usage
```tsx
<footer className="bg-gray-900">
  <FerrettoLogo variant="full" size="lg" color="white" />
</footer>
```

#### Login Page
```tsx
<div className="flex justify-center">
  <FerrettoLogo variant="full" size="xl" />
</div>
```

### Accessibility

- Proper ARIA labels included
- Semantic SVG structure
- Screen reader friendly
- Keyboard navigation support

### Notes

- SVG-based (scalable, crisp at any size)
- Industrial design with gear accent
- Placeholder - replace with actual Ferretto logo when available
