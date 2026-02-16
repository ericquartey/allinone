# Dashboard Components - Usage Guide

Componenti modulari per la dashboard EjLog WMS con design Ferretto Group.

## Quick Start

```typescript
import {
  HeroBanner,
  QuickStatsGrid,
  ChartsSection,
  QuickActionsGrid,
  RecentActivityTimeline,
  AlertsPanel,
} from '@/components/dashboard';
```

---

## Components

### 1. HeroBanner

Banner hero con gradiente Ferretto, nome utente e orologio live.

**Usage:**
```tsx
<HeroBanner userName="Mario Rossi" />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| userName | string | "Operatore" | Nome utente da visualizzare |

**Features:**
- Clock live (update ogni secondo)
- Gradiente Ferretto rosso
- Pattern decorativo SVG
- Responsive layout

---

### 2. QuickStatsGrid

Griglia di KPI cards con icone, valori e trend.

**Usage:**
```tsx
const stats: StatCardData[] = [
  {
    title: 'Articoli Totali',
    value: 12458,
    icon: Package,
    color: 'blue',
    trend: { value: 12.5, label: 'vs. mese scorso' },
    onClick: () => navigate('/items'),
  },
  // ... more stats
];

<QuickStatsGrid stats={stats} loading={false} />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| stats | StatCardData[] | required | Array di KPI cards |
| loading | boolean | false | Mostra skeleton loaders |

**StatCardData Type:**
```typescript
interface StatCardData {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  trend?: {
    value: number;      // Percentuale (es: 12.5)
    label: string;      // Label descrittivo
  };
  onClick?: () => void;
}
```

**Animazioni:**
- Hover translate-y
- Hover shadow upgrade
- Stagger entrance (50ms per card)
- Icon scale on hover

---

### 3. ChartsSection

Due grafici side-by-side: Bar Chart e Line Chart.

**Usage:**
```tsx
const listTypeData: ListTypeData[] = [
  { type: 'Picking', count: 45, color: '#3B82F6' },
  { type: 'Stoccaggio', count: 28, color: '#10B981' },
  { type: 'Inventario', count: 12, color: '#8B5CF6' },
  { type: 'Trasferimento', count: 8, color: '#F59E0B' },
];

const monthlyData: MonthlyCompletionData[] = [
  { month: 'Lug', completed: 145, pending: 23 },
  { month: 'Ago', completed: 168, pending: 18 },
  // ... more months
];

<ChartsSection
  listTypeData={listTypeData}
  monthlyData={monthlyData}
  loading={false}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| listTypeData | ListTypeData[] | required | Dati per bar chart |
| monthlyData | MonthlyCompletionData[] | required | Dati per line chart |
| loading | boolean | false | Mostra skeleton loaders |

**Types:**
```typescript
interface ListTypeData {
  type: string;
  count: number;
  color: string;  // Hex color
}

interface MonthlyCompletionData {
  month: string;  // Abbreviazione (es: "Lug")
  completed: number;
  pending: number;
}
```

**Features:**
- Recharts integration
- Custom tooltips
- Legends colorati
- Summary stats cards
- Responsive container

---

### 4. QuickActionsGrid

Griglia di pulsanti per azioni rapide con icone e descrizioni.

**Usage:**
```tsx
const actions: QuickAction[] = [
  {
    label: 'Nuova Lista',
    description: 'Crea una nuova lista di picking o stoccaggio',
    icon: Plus,
    color: 'blue',
    onClick: () => navigate('/lists/create'),
  },
  // ... more actions
];

<QuickActionsGrid actions={actions} />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| actions | QuickAction[] | required | Array di azioni rapide |

**QuickAction Type:**
```typescript
interface QuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  onClick: () => void;
}
```

**Animazioni:**
- Hover scale (105%)
- Arrow slide-in
- Stagger entrance

---

### 5. RecentActivityTimeline

Timeline verticale di attività recenti con icone e timestamps.

**Usage:**
```tsx
const activities: Activity[] = [
  {
    id: '1',
    title: 'Lista completata',
    description: 'Lista picking PK-2024-1205 completata con successo',
    timestamp: new Date(Date.now() - 5 * 60000),
    icon: ListChecks,
    color: 'green',
    user: 'Mario Rossi',
  },
  // ... more activities
];

<RecentActivityTimeline
  activities={activities}
  maxItems={5}
  loading={false}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| activities | Activity[] | required | Array di attività |
| maxItems | number | 5 | Numero massimo items visualizzati |
| loading | boolean | false | Mostra skeleton loaders |

**Activity Type:**
```typescript
interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  user?: string;
}
```

**Features:**
- Timestamps relativi (es: "5 minuti fa")
- Vertical connecting line
- Empty state elegante
- Scroll overflow

---

### 6. AlertsPanel

Pannello allarmi con filtro per severity e badge colorati.

**Usage:**
```tsx
const alerts: Alert[] = [
  {
    id: '1',
    title: 'Allarme zona A',
    message: 'Temperatura fuori range in zona A1',
    severity: 'error',
    timestamp: new Date(),
    source: 'Sensore T-01',
    isRead: false,
  },
  // ... more alerts
];

<AlertsPanel
  alerts={alerts}
  maxItems={5}
  onAlertClick={(alert) => console.log('Clicked:', alert)}
  loading={false}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| alerts | Alert[] | required | Array di allarmi |
| maxItems | number | 5 | Numero massimo allarmi visualizzati |
| onAlertClick | (alert: Alert) => void | undefined | Callback su click allarme |
| loading | boolean | false | Mostra skeleton loaders |

**Types:**
```typescript
type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  source?: string;
  isRead?: boolean;
}
```

**Features:**
- Filter dropdown per severity
- Severity count badges
- Read/unread indicators
- Empty state (tutto ok)
- Color-coded severity

**Severity Colors:**
| Severity | Color | Icon |
|----------|-------|------|
| info | Blue | AlertCircle |
| success | Green | CheckCircle |
| warning | Orange | AlertTriangle |
| error | Red | XCircle |

---

## Design Tokens

### Colors
```typescript
const colorVariants = {
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444',
  cyan: '#06B6D4',
};
```

### Ferretto Brand Colors
```typescript
const ferrrettoColors = {
  red: '#E30613',
  redDark: '#B10510',
  redLight: '#FF3B47',
  dark: '#32373c',
};
```

### Shadows
```css
shadow-ferretto-sm: 0 1px 4px rgba(0,0,0,0.08)
shadow-ferretto-md: 0 4px 12px rgba(0,0,0,0.1)
shadow-ferretto-lg: 0 4px 16px rgba(0,0,0,0.15)
shadow-ferretto-xl: 0 8px 24px rgba(0,0,0,0.15)
shadow-ferretto-2xl: 0 12px 40px rgba(0,0,0,0.2)
```

### Border Radius
```css
rounded-xl: 12px (cards)
rounded-2xl: 16px (hero banner)
rounded-full: 50% (badges, icons)
```

### Animation Timings
```typescript
const timings = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  stagger: '50ms',
};
```

---

## Best Practices

### 1. Memoization
Usa `useMemo` per dati complessi:
```tsx
const stats = useMemo(() => {
  // Calcolo pesante
  return computedStats;
}, [dependencies]);
```

### 2. Loading States
Tutti i componenti supportano skeleton loaders:
```tsx
<QuickStatsGrid stats={stats} loading={isLoading} />
```

### 3. Empty States
Gestisci array vuoti:
```tsx
if (activities.length === 0) {
  return <EmptyState />;
}
```

### 4. Error Boundaries
Wrappa componenti in ErrorBoundary:
```tsx
<ErrorBoundary fallback={<ErrorMessage />}>
  <ChartsSection {...props} />
</ErrorBoundary>
```

### 5. Responsive Design
Usa Tailwind breakpoints:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

---

## Testing

### Unit Tests (Vitest)
```bash
npm run test src/components/dashboard/
```

### E2E Tests (Playwright)
```bash
npm run test:e2e tests/e2e/dashboard-refactored.spec.ts
```

### Visual Regression
```bash
npm run test:e2e -- --update-snapshots
```

---

## Accessibility

Tutti i componenti seguono WCAG 2.1 AA:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast > 4.5:1
- ✅ Focus indicators
- ✅ Semantic HTML
- ✅ ARIA labels

---

## Performance Tips

### Code Splitting
```tsx
// Lazy load heavy components
const ChartsSection = lazy(() => import('./ChartsSection'));
```

### Virtual Scrolling
Per liste lunghe (>100 items):
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Debounce Filters
```tsx
const debouncedFilter = useDebounce(filterValue, 300);
```

---

## Troubleshooting

### Icons non visibili
Verifica import da `lucide-react`:
```tsx
import { Package } from 'lucide-react';
```

### Animazioni stutter
Abilita GPU acceleration:
```css
.animated-element {
  will-change: transform;
  transform: translateZ(0);
}
```

### Chart non responsive
Usa `ResponsiveContainer`:
```tsx
<ResponsiveContainer width="100%" height={320}>
  <BarChart data={data}>
    {/* ... */}
  </BarChart>
</ResponsiveContainer>
```

---

## Migration Guide

### Da versione 1.0 a 2.0

**Before:**
```tsx
// Old dashboard component
<div className="dashboard">
  <KPICard title="Items" value={123} />
  <SimpleChart data={data} />
</div>
```

**After:**
```tsx
// New modular components
import { QuickStatsGrid, ChartsSection } from '@/components/dashboard';

<div className="dashboard">
  <QuickStatsGrid stats={stats} />
  <ChartsSection listTypeData={data} monthlyData={monthly} />
</div>
```

**Benefits:**
- ✅ Type-safe props
- ✅ Skeleton loaders
- ✅ Responsive out-of-box
- ✅ Consistent animations
- ✅ Accessibility compliant

---

## Contributing

Per aggiungere nuovi componenti dashboard:

1. Crea file in `src/components/dashboard/`
2. Esporta da `index.ts`
3. Aggiungi TypeScript types
4. Scrivi test Playwright
5. Aggiorna questa documentazione

---

## License

Proprietary - Ferretto Group
