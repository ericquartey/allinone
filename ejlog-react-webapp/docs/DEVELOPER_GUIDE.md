# 🛠️ EjLog WMS - Developer Guide

**Version:** 1.0.0 (Phase 1 Complete)
**Last Updated:** 2025-11-27
**Target:** Developers, Architects, Technical Leads

---

## 📑 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Development Setup](#development-setup)
5. [Core Concepts](#core-concepts)
6. [API Integration](#api-integration)
7. [State Management](#state-management)
8. [Component Library](#component-library)
9. [Routing & Navigation](#routing--navigation)
10. [Performance Optimization](#performance-optimization)
11. [Testing](#testing)
12. [Code Patterns](#code-patterns)
13. [Contributing](#contributing)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│                   React 18 + Vite 5                      │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Pages    │  │  Components  │  │  State (Redux)  │ │
│  │ (Routes)   │  │   (UI/UX)    │  │   RTK Query     │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS (REST API)
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Java Backend (External)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ REST API     │  │ Host Vertimag│  │ Web Admin    │  │
│  │ Port 3077    │  │ Port 3079    │  │ Port 8080    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ JDBC
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Database (SQL Server)                       │
│              - promag (main database)                    │
└─────────────────────────────────────────────────────────┘
```

### Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  React Components + TailwindCSS + TypeScript             │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    State Management                      │
│  Redux Toolkit + RTK Query + Immer                       │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    API Integration                       │
│  Axios + RTK Query + Error Handling                      │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    External Backend                      │
│  Java REST API (Port 3077)                               │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
ejlog-react-webapp/
├── src/
│   ├── api/                    # API integration layer
│   │   ├── config/             # Axios configuration
│   │   ├── services/           # API service modules
│   │   │   ├── listsApi.ts
│   │   │   ├── locationsApi.ts
│   │   │   ├── itemsApi.ts
│   │   │   ├── stockApi.ts
│   │   │   ├── movementsApi.ts
│   │   │   ├── ordersApi.ts
│   │   │   ├── plcApi.ts
│   │   │   └── usersApi.ts
│   │   └── endpoints.ts        # API endpoint definitions
│   │
│   ├── components/             # React components
│   │   ├── common/             # Shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── LazyLoadBoundary.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AppLayout.tsx
│   │   ├── lists/              # Lists module components
│   │   ├── locations/          # Locations module components
│   │   ├── stock/              # Stock module components
│   │   ├── orders/             # Orders module components
│   │   └── plc/                # PLC module components
│   │
│   ├── pages/                  # Route pages
│   │   ├── auth/               # Authentication pages
│   │   │   ├── LoginPage.tsx
│   │   │   └── BadgeLoginPage.tsx
│   │   ├── DashboardPageEnhanced.tsx
│   │   ├── lists/              # 12 lists pages
│   │   ├── locations/          # 9 locations pages
│   │   ├── stock/              # 5 stock pages
│   │   ├── orders/             # 3 orders pages
│   │   └── plc/                # 5 PLC pages
│   │
│   ├── store/                  # Redux store
│   │   ├── index.ts            # Store configuration
│   │   ├── slices/             # Redux slices
│   │   │   ├── authSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   ├── listsSlice.ts
│   │   │   ├── locationsSlice.ts
│   │   │   └── ...
│   │   └── api/                # RTK Query APIs
│   │       ├── baseApi.ts
│   │       ├── listsApi.ts
│   │       └── ...
│   │
│   ├── routes/                 # Routing configuration
│   │   ├── AppRoutes.tsx       # Main route definitions
│   │   ├── lazyRoutes.ts       # Lazy loaded routes (40+)
│   │   ├── ProtectedRoute.tsx  # Auth guard
│   │   └── RouteGuard.tsx      # Permission guard
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── usePagination.ts
│   │   └── useWebSocket.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── format.ts           # Formatters
│   │   ├── validators.ts       # Input validation
│   │   ├── storage.ts          # LocalStorage wrapper
│   │   ├── webVitals.ts        # Performance monitoring
│   │   └── serviceWorkerRegistration.ts
│   │
│   ├── types/                  # TypeScript types
│   │   ├── api.ts              # API response types
│   │   ├── models.ts           # Domain models
│   │   └── common.ts           # Common types
│   │
│   ├── config/                 # Configuration
│   │   ├── api.ts              # API base URL
│   │   ├── constants.ts        # App constants
│   │   └── permissions.ts      # Permission definitions
│   │
│   ├── styles/                 # Global styles
│   │   ├── index.css           # TailwindCSS imports
│   │   └── tailwind.config.js
│   │
│   ├── assets/                 # Static assets
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── main.tsx                # Application entry point
│   └── App.tsx                 # Root component
│
├── public/                     # Public static files
│   ├── service-worker.js       # PWA service worker
│   ├── manifest.json           # PWA manifest
│   └── favicon.ico
│
├── tests/                      # Playwright E2E tests
│   ├── pages/                  # Page-specific tests
│   ├── api/                    # API integration tests
│   └── quick-health-check.spec.js
│
├── docs/                       # Documentation
│   ├── USER_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── DEVELOPER_GUIDE.md (this file)
│
├── package.json                # Dependencies
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # TailwindCSS configuration
├── playwright.config.ts        # Playwright configuration
└── README.md                   # Project README
```

---

## Tech Stack

### Core Framework

- **React 18.2.0** - UI library with Concurrent Features
- **TypeScript 5.x** - Static typing (strict mode)
- **Vite 5.x** - Build tool and dev server
- **React Router 6.x** - Client-side routing

### State Management

- **Redux Toolkit 2.x** - State management with slices
- **RTK Query 2.x** - Data fetching and caching
- **Immer** - Immutable state updates (included in RTK)

### UI & Styling

- **TailwindCSS 3.x** - Utility-first CSS framework
- **Headless UI 2.x** - Unstyled accessible components
- **Heroicons 2.x** - SVG icon library
- **React Hot Toast** - Toast notifications

### Data Fetching & API

- **Axios 1.x** - HTTP client
- **RTK Query** - API integration with caching
- **Zod** - Runtime type validation

### Forms & Validation

- **React Hook Form 7.x** - Form management
- **Zod** - Schema validation

### Testing

- **Playwright** - E2E testing
- **Vitest** - Unit testing (React Testing Library compatible)
- **@testing-library/react** - React component testing

### PWA & Performance

- **Workbox** - Service Worker tooling (custom implementation)
- **web-vitals** - Core Web Vitals monitoring
- **vite-plugin-pwa** - PWA plugin for Vite

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TS-specific linting
- **Husky** - Git hooks (optional)

---

## Development Setup

### Prerequisites

- **Node.js:** v18.x or v20.x (LTS)
- **npm:** v9.x or higher
- **Git:** Latest version
- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ejlog-react-webapp

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with backend URL
# VITE_API_BASE_URL=http://localhost:3077/api
```

### Development Server

```bash
# Start dev server (http://localhost:3005)
npm run dev

# Start dev server with specific port
PORT=3000 npm run dev

# Start dev server with HTTPS
npm run dev -- --https
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Build with source maps
npm run build -- --sourcemap

# Build with bundle analysis
npm run build -- --mode analyze
```

### Testing

```bash
# Run Playwright E2E tests
npm run test

# Run specific test file
npx playwright test tests/pages/lists.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in UI mode (interactive)
npx playwright test --ui

# Generate test report
npx playwright show-report
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Run Prettier
npm run format

# TypeScript type check
npm run type-check
```

---

## Core Concepts

### 1. API Integration with RTK Query

**Creating an API service:**

```typescript
// src/store/api/listsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@/config/api';

export const listsApi = createApi({
  reducerPath: 'listsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/lists`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['List', 'ListDetail'],
  endpoints: (builder) => ({
    // GET /api/lists
    getLists: builder.query<ListResponse, ListFilters>({
      query: (filters) => ({
        url: '/',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'List' as const, id })),
              { type: 'List', id: 'LIST' },
            ]
          : [{ type: 'List', id: 'LIST' }],
    }),

    // GET /api/lists/:id
    getListById: builder.query<List, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'ListDetail', id }],
    }),

    // POST /api/lists
    createList: builder.mutation<List, CreateListRequest>({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'List', id: 'LIST' }],
    }),

    // PUT /api/lists/:id
    updateList: builder.mutation<List, { id: number; data: UpdateListRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'List', id },
        { type: 'ListDetail', id },
      ],
    }),

    // DELETE /api/lists/:id
    deleteList: builder.mutation<void, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'List', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetListsQuery,
  useGetListByIdQuery,
  useCreateListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
} = listsApi;
```

**Using in component:**

```typescript
// src/pages/lists/ListsPageEnhanced.tsx
import { useGetListsQuery, useDeleteListMutation } from '@/store/api/listsApi';

export const ListsPageEnhanced: FC = () => {
  const [filters, setFilters] = useState<ListFilters>({});

  // Auto-refetch every 30s
  const { data, isLoading, error, refetch } = useGetListsQuery(filters, {
    pollingInterval: 30000,
  });

  const [deleteList, { isLoading: isDeleting }] = useDeleteListMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteList(id).unwrap();
      toast.success('Lista eliminata');
    } catch (error) {
      toast.error('Errore eliminazione');
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <DataTable data={data?.data ?? []} onDelete={handleDelete} />
    </div>
  );
};
```

### 2. Component Patterns

**Presentational vs Container Components:**

```typescript
// Container Component (Smart - handles data)
export const ListsContainer: FC = () => {
  const { data, isLoading } = useGetListsQuery({});
  const [selectedList, setSelectedList] = useState<List | null>(null);

  return (
    <ListsPresentation
      lists={data?.data ?? []}
      isLoading={isLoading}
      selectedList={selectedList}
      onSelectList={setSelectedList}
    />
  );
};

// Presentational Component (Dumb - renders UI)
interface Props {
  lists: List[];
  isLoading: boolean;
  selectedList: List | null;
  onSelectList: (list: List) => void;
}

export const ListsPresentation: FC<Props> = ({
  lists,
  isLoading,
  selectedList,
  onSelectList,
}) => {
  if (isLoading) return <Spinner />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {lists.map((list) => (
        <ListCard
          key={list.id}
          list={list}
          isSelected={list.id === selectedList?.id}
          onClick={() => onSelectList(list)}
        />
      ))}
    </div>
  );
};
```

### 3. Custom Hooks

**Example: useDebounce**

```typescript
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in component
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

const { data } = useGetListsQuery({ search: debouncedSearch });
```

**Example: usePagination**

```typescript
// src/hooks/usePagination.ts
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1),
  };
}
```

### 4. Error Handling

**Global Error Boundary:**

```typescript
// src/components/common/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    if (import.meta.env.PROD) {
      // Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Errore Applicazione</h1>
            <p className="mt-2 text-gray-600">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Ricarica Pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## API Integration

### Backend Endpoints

**Base URL:** `http://localhost:3077/api`

### Lists Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lists` | Get all lists with filters |
| GET | `/lists/:id` | Get list by ID |
| GET | `/lists/:id/items` | Get list items |
| POST | `/lists` | Create new list |
| PUT | `/lists/:id` | Update list |
| DELETE | `/lists/:id` | Delete list |
| POST | `/lists/:id/execute` | Execute list |
| POST | `/lists/:id/pause` | Pause execution |
| POST | `/lists/:id/resume` | Resume execution |

### Locations Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/locations` | Get all locations |
| GET | `/locations/:id` | Get location by ID |
| GET | `/locations/:id/stock` | Get location stock |
| GET | `/locations/:id/movements` | Get location movements |
| POST | `/locations` | Create location |
| PUT | `/locations/:id` | Update location |
| DELETE | `/locations/:id` | Delete location |
| POST | `/locations/:id/block` | Block location |
| POST | `/locations/:id/reserve` | Reserve location |

### Stock Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stock` | Get stock overview |
| GET | `/stock/by-item/:itemCode` | Get stock by item |
| GET | `/stock/movements` | Get stock movements |
| POST | `/stock/movements` | Create stock movement |
| GET | `/stock/analytics` | Get stock analytics |

### PLC Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plc/devices` | Get all PLC devices |
| GET | `/plc/devices/:id` | Get device by ID |
| GET | `/plc/devices/:id/databuffer` | Get device databuffer |
| GET | `/plc/devices/:id/signals` | Get device signals |
| POST | `/plc/devices/:id/commands` | Execute PLC command |
| GET | `/plc/commands/history` | Get command history |

### Request/Response Examples

**GET /api/lists**

Request:
```http
GET /api/lists?type=PICKING&status=PENDING&page=1&limit=20
Authorization: Bearer <token>
```

Response:
```json
{
  "data": [
    {
      "id": 123,
      "code": "PICK-20251127-001",
      "type": "PICKING",
      "status": "PENDING",
      "priority": 1,
      "totalItems": 15,
      "completedItems": 0,
      "assignedUser": null,
      "createdAt": "2025-11-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**POST /api/lists/:id/execute**

Request:
```http
POST /api/lists/123/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 5,
  "notes": "Starting picking operation"
}
```

Response:
```json
{
  "id": 123,
  "status": "IN_PROGRESS",
  "assignedUser": {
    "id": 5,
    "name": "Mario Rossi"
  },
  "startedAt": "2025-11-27T10:05:00Z"
}
```

---

## State Management

### Redux Store Structure

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { listsApi } from './api/listsApi';
import { locationsApi } from './api/locationsApi';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    // Regular slices
    auth: authReducer,
    ui: uiReducer,

    // RTK Query APIs
    [listsApi.reducerPath]: listsApi.reducer,
    [locationsApi.reducerPath]: locationsApi.reducer,
    // ... other APIs
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      listsApi.middleware,
      locationsApi.middleware,
      // ... other API middlewares
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Slice Example

```typescript
// src/store/slices/uiSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
  },
});

export const { toggleSidebar, setTheme, addNotification, removeNotification } =
  uiSlice.actions;
export default uiSlice.reducer;
```

---

## Component Library

### Common Components

**Button Component:**

```typescript
// src/components/common/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
```

**DataTable Component:**

```typescript
// src/components/common/DataTable.tsx
interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  loading,
  onRowClick,
  onSort,
}: DataTableProps<T>): JSX.Element {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && <SortIcon active={sortKey === column.key} direction={sortDirection} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={clsx(
                'hover:bg-gray-50 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(item) : String(item[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Routing & Navigation

### Route Configuration

```typescript
// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { LazyLoadBoundary } from '@/components/common/LazyLoadBoundary';
import { ProtectedRoute } from './ProtectedRoute';
import {
  LoginPage,
  DashboardPageEnhanced,
  ListsManagementPageNew,
  LocationBrowserPage,
  // ... lazy imports from lazyRoutes.ts
} from './lazyRoutes';

export const AppRoutes: FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LazyLoadBoundary><LoginPage /></LazyLoadBoundary>} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <LazyLoadBoundary routeName="Dashboard">
            <DashboardPageEnhanced />
          </LazyLoadBoundary>
        } />

        {/* Lists module */}
        <Route path="/lists-management" element={
          <LazyLoadBoundary routeName="Lists Management">
            <ListsManagementPageNew />
          </LazyLoadBoundary>
        } />

        {/* ... 40+ more routes */}
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
```

### Protected Route Guard

```typescript
// src/routes/ProtectedRoute.tsx
export const ProtectedRoute: FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
```

---

## Performance Optimization

### Code Splitting

All 40+ pages are lazy loaded using React.lazy():

```typescript
// src/routes/lazyRoutes.ts
export const DashboardPageEnhanced = lazy(() => import('../pages/DashboardPageEnhanced'));
export const ListsManagementPageNew = lazy(() => import('../pages/lists/ListsManagementPageNew'));
// ... 40+ more lazy imports

// Preload critical routes on app load
export const preloadCriticalRoutes = () => {
  import('../pages/DashboardPageEnhanced');
  import('../pages/lists/ListsManagementPageNew');
  import('../pages/locations/LocationBrowserPage');
};
```

### Memoization

```typescript
// Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.priority - b.priority);
}, [items]);

// Memoize callback functions
const handleClick = useCallback((id: number) => {
  dispatch(selectItem(id));
}, [dispatch]);

// Memoize components
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  // ... expensive render logic
});
```

### Virtual Scrolling

For large lists (1000+ items):

```typescript
// Using react-window
import { FixedSizeList } from 'react-window';

export const VirtualizedList: FC<Props> = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

---

## Testing

### E2E Testing with Playwright

```typescript
// tests/pages/lists.spec.js
import { test, expect } from '@playwright/test';

test.describe('Lists Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005/lists-management');
    await page.waitForLoadState('networkidle');
  });

  test('should display lists table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(10, { timeout: 5000 });
  });

  test('should filter lists by status', async ({ page }) => {
    await page.click('button:has-text("PENDING")');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to list detail', async ({ page }) => {
    await page.click('tbody tr:first-child');
    await expect(page).toHaveURL(/\/lists-management\/\d+/);
    await expect(page.locator('h1')).toContainText('Dettaglio Lista');
  });
});
```

### Unit Testing Example

```typescript
// src/utils/__tests__/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency } from '../format';

describe('format utils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = '2025-11-27T10:00:00Z';
      expect(formatDate(date)).toBe('27/11/2025');
    });

    it('handles invalid date', () => {
      expect(formatDate('invalid')).toBe('-');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency with symbol', () => {
      expect(formatCurrency(1234.56)).toBe('€ 1.234,56');
    });
  });
});
```

---

## Code Patterns

### 1. Error Handling Pattern

```typescript
try {
  const result = await createList(data).unwrap();
  toast.success('Lista creata con successo');
  navigate(`/lists/${result.id}`);
} catch (error) {
  if (error.status === 409) {
    toast.error('Lista già esistente');
  } else if (error.status === 422) {
    toast.error('Dati non validi');
  } else {
    toast.error('Errore durante la creazione');
  }
  console.error('[CreateList]', error);
}
```

### 2. Loading State Pattern

```typescript
const { data, isLoading, isFetching, error } = useGetListsQuery(filters);

if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;

return (
  <div>
    {isFetching && <RefreshIndicator />}
    <DataTable data={data?.data ?? []} />
  </div>
);
```

### 3. Form Validation Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  code: z.string().min(3, 'Minimo 3 caratteri'),
  type: z.enum(['PICKING', 'REFILLING', 'INVENTORY']),
  priority: z.number().min(1).max(10),
});

type FormData = z.infer<typeof schema>;

export const CreateListForm: FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [createList] = useCreateListMutation();

  const onSubmit = async (data: FormData) => {
    await createList(data).unwrap();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('code')} />
      {errors.code && <span>{errors.code.message}</span>}

      <button type="submit">Create</button>
    </form>
  );
};
```

---

## Contributing

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub/GitLab
```

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Build/tooling changes

### Code Review Checklist

- [ ] Code follows TypeScript strict mode
- [ ] All props/functions are properly typed
- [ ] No `any` types (use `unknown` if needed)
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design tested
- [ ] E2E tests added/updated
- [ ] No console.logs in production code
- [ ] Performance optimized (memoization where needed)
- [ ] Accessibility attributes added (aria-*)

---

## Support & Resources

**Documentation:**
- User Guide: `docs/USER_GUIDE.md`
- Deployment Guide: `docs/DEPLOYMENT_GUIDE.md`
- Developer Guide: `docs/DEVELOPER_GUIDE.md` (this file)

**External Resources:**
- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [TailwindCSS](https://tailwindcss.com)
- [Playwright](https://playwright.dev)
- [TypeScript](https://www.typescriptlang.org)

**Support:**
- 📧 Email: dev-team@ejlog.com
- 💬 Slack: #ejlog-development
- 📚 Wiki: https://wiki.ejlog.com/development

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-27
**Maintained by:** EjLog Development Team

