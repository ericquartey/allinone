# Dashboard Avanzata EjLog WMS

Sistema di dashboard modulare con widget configurabili e grafici intelligenti per il monitoraggio real-time del sistema EjLog WMS.

## Caratteristiche

- **Widget Modulari**: 5 widget configurabili (KPI Cards, Products Overview, Items Analytics, Movements Realtime, Locations Heatmap)
- **Auto-refresh**: Aggiornamento automatico dei dati configurabile
- **Responsive**: Layout adattivo per desktop, tablet e mobile
- **Configurabile**: Attiva/disattiva widget dalle impostazioni
- **Grafici Avanzati**: Utilizzo di Recharts per visualizzazioni interattive
- **TypeScript Strict**: Tipizzazione completa per sicurezza del codice
- **Performance**: Lazy loading, memoization, React Query caching

## Struttura File

```
src/features/dashboard/
├── types/
│   └── dashboard.types.ts          # Tipi TypeScript
├── context/
│   └── DashboardConfigContext.tsx  # Context configurazione
├── hooks/
│   └── useDashboardData.ts         # Hook per data fetching
├── components/
│   ├── WidgetContainer.tsx         # Container riutilizzabile
│   ├── EmptyWidget.tsx             # Stato vuoto
│   └── ChartLegend.tsx             # Legenda grafici
├── widgets/
│   ├── KPICardsWidget.tsx          # Metriche chiave
│   ├── ProductsOverviewWidget.tsx  # Distribuzione prodotti
│   ├── ItemsAnalyticsWidget.tsx    # Analisi articoli
│   ├── MovementsRealtimeWidget.tsx # Movimenti real-time
│   └── LocationsHeatmapWidget.tsx  # Heatmap ubicazioni
└── README.md
```

## Routes

- `/dashboard-advanced` - Dashboard principale con widget
- `/settings/dashboard` - Configurazione widget e preferenze

## Utilizzo

### 1. Accesso alla Dashboard

Naviga su `/dashboard-advanced` per visualizzare la dashboard con i widget abilitati.

### 2. Configurazione Widget

1. Clicca sul pulsante "Configurazione" in alto a destra
2. Attiva/disattiva i widget desiderati
3. Configura auto-refresh e intervallo di aggiornamento
4. Salva e torna alla dashboard

### 3. Widget Disponibili

#### KPI Cards
Visualizza metriche chiave:
- Totale prodotti
- Movimenti oggi
- Efficienza operativa
- Alert attivi

Con trend comparativo rispetto ai periodi precedenti.

#### Products Overview
Grafico a torta/donut con:
- Distribuzione prodotti per categoria
- Valore totale inventario
- Top 10 prodotti più presenti

#### Items Analytics
Grafici a barre e linee con:
- Articoli per stato (disponibili, in transito, riservati, bloccati)
- Trend settimanale/mensile
- Giacenza media

#### Movements Realtime
Grafici area/linee con:
- Movimenti in entrata/uscita
- Velocità di rotazione (oraria, giornaliera, settimanale)
- Picchi di attività

#### Locations Heatmap
Mappa di calore con:
- Utilizzo ubicazioni per zona
- Occupancy rate
- Zone più/meno attive
- Heatmap grid interattiva

## Configurazione

La configurazione è salvata in `localStorage` con chiave `ejlog_dashboard_config`.

### Struttura Configurazione

```typescript
{
  widgets: [
    {
      id: 'kpi_cards',
      name: 'KPI Cards',
      description: 'Metriche chiave del sistema',
      enabled: true,
      order: 1,
      refreshInterval: 30 // secondi
    },
    // ... altri widget
  ],
  layout: 'grid', // 'grid' | 'list'
  autoRefresh: true,
  refreshInterval: 60 // secondi
}
```

## API Integration

### Endpoints (attualmente con mock data)

```typescript
GET /api/dashboard/products-overview
GET /api/dashboard/items-analytics
GET /api/dashboard/movements-realtime
GET /api/dashboard/locations-heatmap
GET /api/dashboard/kpis
```

### Passare a Backend Reale

Nel file `src/services/api/dashboardApi.ts`, sostituire le `queryFn` con chiamate reali:

```typescript
// Da mock
queryFn: async () => {
  await simulateNetworkDelay();
  return { data: mockData };
}

// A reale (rimuovere commento)
query: (filters) => ({
  url: '/dashboard/products-overview',
  params: filters
})
```

Assicurarsi che il backend risponda con il formato:

```typescript
{
  success: boolean;
  data: <WidgetData>;
  timestamp: string; // ISO
}
```

## Customizzazione

### Aggiungere Nuovo Widget

1. **Creare tipo in `dashboard.types.ts`:**
```typescript
export interface MyWidgetData {
  // ... campi dati
  lastUpdate: string;
}
```

2. **Aggiungere enum in `WidgetType`:**
```typescript
export enum WidgetType {
  // ... esistenti
  MY_WIDGET = 'my_widget',
}
```

3. **Creare widget in `widgets/MyWidget.tsx`:**
```typescript
import { useMyWidgetData } from '../hooks/useDashboardData';
import WidgetContainer from '../components/WidgetContainer';

export const MyWidget: React.FC = () => {
  const { data, isLoading, error } = useMyWidgetData();
  // ... render
};
```

4. **Aggiungere hook in `useDashboardData.ts`:**
```typescript
export const useMyWidgetData = (enabled: boolean = true) => {
  const { config } = useDashboardConfig();
  // ... implementazione
};
```

5. **Aggiungere endpoint in `dashboardApi.ts`:**
```typescript
getMyWidget: builder.query<...>({
  // ... implementazione
})
```

6. **Aggiungere al context default in `DashboardConfigContext.tsx`:**
```typescript
const DEFAULT_CONFIG = {
  widgets: [
    // ... esistenti
    {
      id: 'my_widget',
      name: 'My Widget',
      description: 'Description',
      enabled: true,
      order: 6,
      refreshInterval: 60,
    },
  ],
  // ...
};
```

7. **Aggiungere render in `AdvancedDashboardPage.tsx`:**
```typescript
case 'my_widget':
  return <MyWidget />;
```

## Performance

### Ottimizzazioni Implementate

- **React Query**: Caching automatico con `staleTime` di 5 minuti
- **Polling**: Configurabile per widget, default disabilitato in sviluppo
- **Lazy Loading**: Widget caricati solo quando abilitati
- **Memoization**: Componenti grafici memoizzati
- **Debouncing**: Filtri e input debounced

### Best Practices

- Usa `skip: !enabled` nelle query per evitare chiamate inutili
- Configura `refreshInterval` appropriato per ogni widget (30-120s)
- Disabilita widget non utilizzati dalle impostazioni
- Monitora Network tab per verificare chiamate API

## Testing

### Unit Tests (da implementare)

```bash
npm run test
```

### E2E Tests (da implementare)

```bash
npm run test:e2e
```

## Troubleshooting

### Widget non si aggiorna

1. Verifica che auto-refresh sia abilitato
2. Controlla console browser per errori API
3. Verifica che il widget sia abilitato in configurazione

### Dati non caricano

1. Apri DevTools > Network per vedere chiamate API
2. Verifica che backend sia raggiungibile su porta 3077
3. Controlla CORS configuration

### Configurazione persa

1. Verifica localStorage nel browser
2. Chiave: `ejlog_dashboard_config`
3. Usa "Reset Configurazione" per ripristinare default

### Performance lenta

1. Disabilita widget non necessari
2. Aumenta refresh interval
3. Disabilita auto-refresh se non necessario
4. Verifica browser DevTools > Performance

## Roadmap Future

- [ ] Drag & drop per riordinare widget
- [ ] Export dati in CSV/Excel
- [ ] Grafici stampabili
- [ ] Dashboard personalizzate multiple
- [ ] Condivisione configurazione tra utenti
- [ ] Widget custom tramite plugin system
- [ ] Notifiche push per alert
- [ ] Integrazione WebSocket per real-time

## Contatti

Per supporto o domande contattare il team di sviluppo EjLog.

