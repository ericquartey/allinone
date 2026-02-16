# Migration Checklist - UI Improvements

## Prerequisiti

- [ ] Backup del codice attuale
- [ ] Branch Git per testing: `git checkout -b feature/ui-improvements`
- [ ] Node modules aggiornati: `npm install`

---

## Step 1: Configurazione Base

### 1.1 Verificare Dependencies

Controllare che `package.json` contenga:

```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.11.0",
    "@tanstack/react-query": "^5.90.10",
    "lucide-react": "^0.323.0",
    "zustand": "^4.5.0"
  }
}
```

- [ ] Dependencies presenti
- [ ] Eseguire `npm install` se mancanti

### 1.2 Verificare Struttura File

Nuovi file creati:

```
src/
├── config/
│   └── menuConfig.ts                    ✓ Creato
├── components/shared/
│   ├── DynamicSidebar.tsx              ✓ Creato
│   ├── DataTable.tsx                    ✓ Creato
│   └── AppLayoutDynamic.tsx            ✓ Creato
├── hooks/
│   └── usePermissions.ts               ✓ Creato
├── pages/
│   ├── items/
│   │   └── ItemsPageEnhanced.tsx       ✓ Creato
│   └── examples/
│       └── ComponentsDemo.tsx          ✓ Creato
docs/
├── UI_IMPROVEMENTS_REPORT.md           ✓ Creato
├── INTEGRATION_GUIDE.md                ✓ Creato
└── MIGRATION_CHECKLIST.md              ✓ Creato
```

- [ ] Tutti i file presenti e leggibili

---

## Step 2: Configurare Menu Dinamico

### 2.1 Personalizzare Menu Config

**File**: `src/config/menuConfig.ts`

- [ ] Rivedere voci di menu per il progetto
- [ ] Aggiornare `requiredPermissions` per ogni voce
- [ ] Aggiungere/rimuovere moduli non necessari
- [ ] Verificare path corrispondano alle route

### 2.2 Configurare Permessi Backend

**Azione richiesta sul backend**:

```java
// Esempio Spring Boot
@GetMapping("/api/auth/me")
public UserDTO getCurrentUser() {
    User user = getCurrentUser();
    UserDTO dto = new UserDTO(user);

    // IMPORTANTE: Popolare permissions array
    dto.setPermissions(Arrays.asList(
        "items.view",
        "items.create",
        "lists.view",
        // ... altri permessi
    ));

    return dto;
}
```

- [ ] Backend restituisce `permissions` array
- [ ] Testare chiamata `/api/auth/me` o simile
- [ ] Verificare formato JSON risposta

### 2.3 Aggiornare AppLayout

**File**: `src/components/shared/AppLayout.tsx`

Opzione A - Sostituire completamente:
```typescript
import DynamicSidebar from './DynamicSidebar';
// Sostituire <Sidebar> con <DynamicSidebar>
```

Opzione B - Mantenere entrambi per test:
```typescript
import Sidebar from './Sidebar';
import DynamicSidebar from './DynamicSidebar';

const USE_DYNAMIC_MENU = true; // Flag per testing

return (
  <div>
    {USE_DYNAMIC_MENU ? (
      <DynamicSidebar isOpen={sidebarOpen} />
    ) : (
      <Sidebar isOpen={sidebarOpen} />
    )}
  </div>
);
```

- [ ] Modifiche applicate
- [ ] Compilazione senza errori

---

## Step 3: Integrare DataTable

### 3.1 Migrare Pagina Items

**File**: `src/App.tsx`

```typescript
// Aggiungere import
import ItemsPageEnhanced from './pages/items/ItemsPageEnhanced';

// Sostituire route
<Route path="items" element={<ItemsPageEnhanced />} />
```

- [ ] Import aggiunto
- [ ] Route aggiornata
- [ ] Testare navigazione a `/items`

### 3.2 (Opzionale) Aggiungere Route Demo

```typescript
import ComponentsDemo from './pages/examples/ComponentsDemo';

// Nelle route protette
<Route path="demo-components" element={<ComponentsDemo />} />
```

- [ ] Route demo aggiunta
- [ ] Accessibile da `/demo-components`

---

## Step 4: Testing Funzionalità

### 4.1 Test Menu Dinamico

**Test Case 1: Operatore (accessLevel = 1)**

Mock user in localStorage:
```json
{
  "id": 1,
  "userName": "operatore1",
  "displayName": "Mario Rossi",
  "accessLevel": 1,
  "permissions": ["items.view", "lists.view"]
}
```

- [ ] Login come operatore
- [ ] Verificare menu mostra solo voci autorizzate
- [ ] Verificare "Configurazione" è nascosta
- [ ] Verificare sottomenu funzionano

**Test Case 2: Amministratore (accessLevel = 3)**

- [ ] Login come admin
- [ ] Verificare tutte le voci menu visibili
- [ ] Verificare sottomenu "Configurazione" accessibile
- [ ] Testare espansione/chiusura menu

### 4.2 Test Pagina Items Enhanced

- [ ] Aprire `/items`
- [ ] Verificare caricamento dati
- [ ] Testare search bar
- [ ] Aprire pannello "Filtri Avanzati"
- [ ] Applicare filtri (categoria, tipo gestione)
- [ ] Testare reset filtri
- [ ] Click "Esporta CSV"
- [ ] Verificare file scaricato
- [ ] Selezionare 2-3 articoli
- [ ] Verificare contatore selezione
- [ ] Click su riga per dettagli

### 4.3 Test DataTable

- [ ] Testare sorting su colonne
- [ ] Cambiare page size (10, 25, 50)
- [ ] Navigare tra pagine
- [ ] Verificare contatori corretti
- [ ] Testare search con Enter
- [ ] Testare clear search (X)

### 4.4 Test Permessi

- [ ] Aprire `/demo-components`
- [ ] Verificare info utente corrette
- [ ] Verificare permessi visualizzati
- [ ] Testare button condizionali
- [ ] Verificare PermissionGuard funziona

---

## Step 5: Migrare Altre Pagine (Opzionale)

### 5.1 Liste

**File**: Creare `src/pages/lists/ListsPageEnhanced.tsx`

Template base:
```typescript
import DataTable from '../../components/shared/DataTable';
import { useGetListsQuery } from '../../services/api/listsApi';

// Copiare struttura da ItemsPageEnhanced.tsx
// Adattare columns e filters per ItemList
```

- [ ] File creato
- [ ] Columns definite
- [ ] Query hook connesso
- [ ] Testato rendering

### 5.2 UDC (Unità di Carico)

- [ ] Creare `UDCPageEnhanced.tsx`
- [ ] Adattare columns per LoadingUnit
- [ ] Testare

### 5.3 Movimenti

- [ ] Creare `MovementsPageEnhanced.tsx`
- [ ] Adattare per Movement model
- [ ] Testare

---

## Step 6: Ottimizzazioni Performance

### 6.1 Memoizzare Columns

In ogni pagina con DataTable:

```typescript
const columns = useMemo<ColumnDef<Item>[]>(
  () => [/* ... */],
  [/* dependencies */]
);
```

- [ ] ItemsPageEnhanced: columns memoized
- [ ] Altre pagine: verificare memoization

### 6.2 Debounce Search

```typescript
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

- [ ] Search input usa debounce
- [ ] Testare che non chiama API ad ogni keystroke

### 6.3 Server-Side Pagination

Verificare che backend supporti:
- `?page=0&pageSize=25`
- `?orderBy=code&sortDirection=asc`

- [ ] Backend supporta parametri
- [ ] Frontend passa parametri corretti
- [ ] Response include `totalPages` e `total`

---

## Step 7: Accessibilità

### 7.1 Aria Labels

- [ ] Sidebar: aria-label su navigation
- [ ] DataTable: aria-label su sort buttons
- [ ] Buttons: aria-label su icon-only buttons
- [ ] Modals: aria-labelledby e role="dialog"

### 7.2 Keyboard Navigation

- [ ] Tab naviga tra elementi interattivi
- [ ] Enter/Space attiva buttons
- [ ] Arrow keys in table (opzionale)
- [ ] ESC chiude modals

### 7.3 Screen Reader

- [ ] Testare con screen reader (NVDA/JAWS)
- [ ] Verificare annunci corretti
- [ ] Verificare live regions per feedback

---

## Step 8: Documentazione

### 8.1 README Update

**File**: `README.md`

Aggiungere sezione:
```markdown
## Nuove Funzionalità

- Menu dinamico basato su permessi utente
- DataTable avanzata con filtri e export
- Sistema di autorizzazione granulare
- Pagina articoli con filtri avanzati

Vedi [docs/UI_IMPROVEMENTS_REPORT.md](docs/UI_IMPROVEMENTS_REPORT.md) per dettagli.
```

- [ ] README aggiornato

### 8.2 Team Training

- [ ] Condividere `INTEGRATION_GUIDE.md` con team
- [ ] Demo live dei nuovi componenti
- [ ] Q&A session
- [ ] Documentare decisioni in wiki

---

## Step 9: Deployment

### 9.1 Pre-Deploy Checks

- [ ] Tutti i test passano: `npm run test`
- [ ] Build production ok: `npm run build`
- [ ] Nessun console.error in produzione
- [ ] Environment variables configurate

### 9.2 Staging Deploy

- [ ] Deploy su staging
- [ ] Smoke test funzionalità critiche
- [ ] Testare con dati reali (non mock)
- [ ] Performance test (Lighthouse)

### 9.3 Production Deploy

- [ ] Backup database
- [ ] Deploy codice
- [ ] Verificare health checks
- [ ] Monitor errori (Sentry/LogRocket)
- [ ] Rollback plan ready

---

## Step 10: Post-Deploy

### 10.1 Monitoring

Settimana 1:
- [ ] Monitor crash rates
- [ ] Check performance metrics
- [ ] Raccogliere feedback utenti
- [ ] Fix bug critici

### 10.2 Iterazione

- [ ] Analizzare usage patterns
- [ ] Identificare bottleneck
- [ ] Pianificare miglioramenti v2
- [ ] Documentare lessons learned

---

## Rollback Plan

Se necessario rollback:

### Quick Rollback
```bash
# Ripristinare vecchio AppLayout
git checkout main -- src/components/shared/AppLayout.tsx

# Ripristinare vecchia Items page
git checkout main -- src/pages/items/ItemsPage.tsx

# Rebuild e redeploy
npm run build
```

### Full Rollback
```bash
git revert <commit-hash>
npm install
npm run build
# Deploy
```

---

## Supporto e Contatti

**Problemi durante migrazione?**

1. Consultare `INTEGRATION_GUIDE.md`
2. Verificare console errors
3. Controllare Network tab per API errors
4. Aprire issue su repository

---

## Sign-off

### Development
- [ ] Codice sviluppato e testato
- [ ] Code review completata
- [ ] Tests unitari passano
- **Developer**: _______________ **Data**: ___/___/______

### QA
- [ ] Test manuali completati
- [ ] Test automatici passano
- [ ] Performance accettabile
- **QA Lead**: _______________ **Data**: ___/___/______

### Product
- [ ] Funzionalità validata
- [ ] UX approvata
- [ ] Documentazione ok
- **Product Owner**: _______________ **Data**: ___/___/______

### Operations
- [ ] Deploy completato
- [ ] Monitoring attivo
- [ ] No critical errors
- **DevOps**: _______________ **Data**: ___/___/______

---

**Fine Checklist**
