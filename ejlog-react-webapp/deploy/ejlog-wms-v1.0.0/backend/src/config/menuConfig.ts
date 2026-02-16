// ============================================================================
// EJLOG WMS - Menu Configuration
// Configurazione menu dinamico con permessi e ruoli
// ============================================================================

import {
  Home,
  Package,
  PackageCheck,
  ClipboardList,
  Box,
  Activity,
  TrendingUp,
  BarChart3,
  MapPin,
  Tag,
  Monitor,
  Users,
  FileText,
  AlertTriangle,
  Settings,
  Boxes,
  Truck,
  Archive,
  Database,
  FolderKanban,
  FileStack,    // Per List Templates
  Image,        // Per Product Images
  ScrollText,   // Per Event Logs
  Sliders,      // Per Settings avanzate
  Layers,       // Per Drawers/Cassetti
  Video,        // Per Mappa Video
  Mic,          // Per Voice Pick
  Radio,        // Per Real-Time/Live
  Lightbulb,    // Per PTL System
  Smartphone,   // Per PWA
  PieChart,     // Per Analytics
  ScanLine,     // Per Barcode Scanner
  Clock,        // Per Scheduler
  type LucideIcon,
} from 'lucide-react';
import { UserAccessLevel } from '../types/models';

// ============================================================================
// TYPES
// ============================================================================

export interface MenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path?: string;
  badge?: string;
  children?: MenuItem[];
  // Permessi di accesso
  requiredAccessLevel?: UserAccessLevel;
  requiredPermissions?: string[]; // OR condition: almeno uno deve essere presente
  requireAllPermissions?: string[]; // AND condition: tutti devono essere presenti
  // Visibilità condizionale
  hideWhen?: (user: any) => boolean;
  showOnlyInTouchMode?: boolean; // Mostra solo quando touch mode è attivo
  hideInTouchMode?: boolean; // Nascondi quando touch mode è attivo
  // Moduli opzionali
  requiresModule?: string[]; // Moduli che devono essere attivi
}

// ============================================================================
// MENU CONFIGURATION
// ============================================================================

export const menuConfig: MenuItem[] = [
  // ========================================
  // DASHBOARD
  // ========================================
  {
    id: 'dashboard',
    icon: Home,
    label: 'Dashboard',
    path: '/',
    requiredAccessLevel: UserAccessLevel.OPERATORE,
  },

  // ========================================
  // OPERAZIONI
  // ========================================
  {
    id: 'operations',
    icon: Activity,
    label: 'Operazioni',
    requiredAccessLevel: UserAccessLevel.OPERATORE,
    children: [
      {
        id: 'operations-lists',
        icon: ClipboardList,
        label: 'Gestione Liste',
        path: '/lists',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['lists.view', 'operations.execute'],
      },
      {
        id: 'operations-list-operations',
        icon: Activity,
        label: 'Operazioni Liste',
        path: '/operations/lists',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['lists.view', 'operations.execute'],
        badge: 'NEW',
        hideInTouchMode: true, // Nasconde in touch mode (usa versione touch)
      },
      {
        id: 'operations-list-operations-touch',
        icon: Smartphone,
        label: 'Liste Touch',
        path: '/operations/lists/touch',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['lists.view', 'operations.execute'],
        showOnlyInTouchMode: true, // Mostra solo in touch mode
        badge: 'TOUCH',
      },
      {
        id: 'operations-list-create-touch',
        icon: Smartphone,
        label: 'Crea Lista Touch',
        path: '/operations/lists/touch/create',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['lists.view', 'operations.execute'],
        showOnlyInTouchMode: true, // Mostra solo in touch mode
      },
      {
        id: 'operations-list-templates',
        icon: FileStack,
        label: 'Modelli Liste',
        path: '/list-templates',
        requiredAccessLevel: UserAccessLevel.SUPERVISORE,
        requiredPermissions: ['lists.manage'],
      },
      {
        id: 'operations-picking',
        icon: Activity,
        label: 'Esecuzione Picking',
        path: '/picking',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['picking.execute'],
      },
      {
        id: 'operations-refilling',
        icon: TrendingUp,
        label: 'Esecuzione Refilling',
        path: '/refilling',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['refilling.execute'],
      },
      {
        id: 'operations-inventory',
        icon: Archive,
        label: 'Inventario',
        path: '/inventory',
        requiredAccessLevel: UserAccessLevel.SUPERVISORE,
        requiredPermissions: ['inventory.execute'],
      },
    ],
  },

  // ========================================
  // RF OPERATIONS
  // ========================================
  {
    id: 'rf-operations',
    icon: Monitor,
    label: 'RF Operations',
    requiredAccessLevel: UserAccessLevel.OPERATORE,
    children: [
      {
        id: 'rf-picking',
        icon: Activity,
        label: 'Picking RF',
        path: '/rf/picking',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['picking.execute'],
        badge: 'NEW',
      },
      {
        id: 'rf-putaway',
        icon: PackageCheck,
        label: 'Putaway RF',
        path: '/rf/putaway',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['putaway.execute'],
        badge: 'NEW',
      },
      {
        id: 'rf-inventory',
        icon: Archive,
        label: 'Inventario RF',
        path: '/rf/inventory',
        requiredAccessLevel: UserAccessLevel.SUPERVISORE,
        requiredPermissions: ['inventory.execute'],
        badge: 'NEW',
      },
      {
        id: 'voice-pick-demo',
        icon: Mic,
        label: 'Voice Pick Demo',
        path: '/voice-pick-demo',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['picking.execute'],
        badge: 'I/ML',
      },
      {
        id: 'voice-pick-real',
        icon: Mic,
        label: 'Voice Pick',
        path: '/voice-pick',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['picking.execute'],
        badge: 'I/ML',
      },
    ],
  },

  // ========================================
  // I/ML INTEGRATIONS
  // ========================================
  {
    id: 'iml-integrations',
    icon: Activity,
    label: 'I/ML Features',
    requiredAccessLevel: UserAccessLevel.OPERATORE,
    children: [
      {
        id: 'iml-voice-pick-demo',
        icon: Mic,
        label: 'Voice Pick Demo',
        path: '/voice-pick-demo',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['picking.execute'],
        badge: 'A',
      },
      {
        id: 'iml-voice-pick-real',
        icon: Mic,
        label: 'Voice Pick Real',
        path: '/voice-pick',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['picking.execute'],
        badge: 'A',
      },
      {
        id: 'iml-dashboard-realtime',
        icon: Radio,
        label: 'Dashboard Real-Time',
        path: '/',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        badge: 'B',
      },
      {
        id: 'iml-ptl-system',
        icon: Lightbulb,
        label: 'PTL Simulator',
        path: '/ptl-demo',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        badge: 'C',
      },
      {
        id: 'iml-pwa-info',
        icon: Smartphone,
        label: 'PWA Info',
        path: '/pwa-info',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        badge: 'D',
      },
      {
        id: 'iml-analytics',
        icon: PieChart,
        label: 'Analytics Avanzati',
        path: '/analytics',
        requiredAccessLevel: UserAccessLevel.SUPERVISORE,
        requiredPermissions: ['reports.view'],
        badge: 'E',
      },
      {
        id: 'iml-barcode-scanner',
        icon: ScanLine,
        label: 'Barcode Scanner Demo',
        path: '/barcode-demo',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        badge: 'F',
      },
    ],
  },

  // ========================================
  // GESTIONE MAGAZZINO
  // ========================================
  {
    id: 'warehouse',
    icon: Boxes,
    label: 'Magazzino',
    requiredAccessLevel: UserAccessLevel.OPERATORE,
    children: [
      {
        id: 'warehouse-items',
        icon: Package,
        label: 'Articoli',
        path: '/items',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['items.view'],
      },
      {
        id: 'warehouse-items-enhanced',
        icon: Package,
        label: 'Articoli (Enhanced)',
        path: '/items-enhanced',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['items.view'],
        badge: 'NEW',
      },
      {
        id: 'warehouse-product-images',
        icon: Image,
        label: 'Foto Articoli',
        path: '/product-images',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['items.view'],
      },
      {
        id: 'warehouse-stock',
        icon: Database,
        label: 'Giacenze',
        path: '/stock',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['stock.view'],
      },
      {
        id: 'warehouse-movements',
        icon: BarChart3,
        label: 'Movimenti',
        path: '/movements',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['movements.view'],
      },
      {
        id: 'warehouse-locations',
        icon: MapPin,
        label: 'Ubicazioni',
        path: '/locations',
        requiredAccessLevel: UserAccessLevel.SUPERVISORE,
        requiredPermissions: ['locations.view'],
      },
      {
        id: 'warehouse-udc',
        icon: Box,
        label: 'UDC',
        path: '/udc',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['udc.view'],
      },
      {
        id: 'warehouse-drawers',
        icon: Layers,
        label: 'Gestione Cassetti',
        path: '/drawers',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['items.view'],
      },
      {
        id: 'warehouse-mappa-video',
        icon: Video,
        label: 'Mappa Video',
        path: '/mappa-video',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['items.view'],
      },
    ],
  },

  // ========================================
  // SPEDIZIONI
  // ========================================
  {
    id: 'shipping',
    icon: Truck,
    label: 'Spedizioni',
    requiredAccessLevel: UserAccessLevel.OPERATORE,
    requiredPermissions: ['shipping.view'],
    children: [
      {
        id: 'shipping-receiving',
        icon: Tag,
        label: 'Ricevimento',
        path: '/receiving',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['receiving.execute'],
      },
      {
        id: 'shipping-dispatch',
        icon: Truck,
        label: 'Spedizione',
        path: '/shipping',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
        requiredPermissions: ['shipping.execute'],
      },
    ],
  },

  // ========================================
  // MACCHINE E ALLARMI
  // ========================================
  {
    id: 'machines',
    icon: Monitor,
    label: 'Macchine',
    requiredAccessLevel: UserAccessLevel.SUPERVISORE,
    requiredPermissions: ['machines.view'],
    children: [
      {
        id: 'machines-list',
        icon: Monitor,
        label: 'Lista Macchine',
        path: '/machines',
        requiredAccessLevel: UserAccessLevel.SUPERVISORE,
        requiredPermissions: ['machines.view'],
      },
      {
        id: 'warehouse-management',
        icon: Boxes,
        label: 'Gestione Magazzini',
        path: '/warehouse-management',
        requiredAccessLevel: UserAccessLevel.SUPERVISORE,
        requiredPermissions: ['machines.view', 'warehouse.manage'],
        badge: 'NEW',
      },
    ],
  },
  {
    id: 'alarms',
    icon: AlertTriangle,
    label: 'Allarmi',
    path: '/alarms',
    requiredAccessLevel: UserAccessLevel.SUPERVISORE,
    requiredPermissions: ['alarms.view'],
  },
  {
    id: 'event-logs',
    icon: ScrollText,
    label: 'Log Eventi',
    path: '/event-logs',
    requiredAccessLevel: UserAccessLevel.SUPERVISORE,
    requiredPermissions: ['logs.view'],
  },

  // ========================================
  // REPORT
  // ========================================
  {
    id: 'reports',
    icon: FileText,
    label: 'Report',
    path: '/reports',
    requiredAccessLevel: UserAccessLevel.SUPERVISORE,
    requiredPermissions: ['reports.view'],
  },

  // ========================================
  // IMPOSTAZIONI
  // ========================================
  {
    id: 'settings',
    icon: Settings,
    label: 'Impostazioni',
    requiredAccessLevel: UserAccessLevel.OPERATORE,
    children: [
      {
        id: 'settings-general',
        icon: Sliders,
        label: 'Generali',
        path: '/settings/general',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
      },
      {
        id: 'settings-profile',
        icon: Users,
        label: 'Profilo Utente',
        path: '/settings/profile',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
      },
      {
        id: 'settings-notifications',
        icon: Activity,
        label: 'Notifiche',
        path: '/settings/notifications',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
      },
      {
        id: 'settings-security',
        icon: AlertTriangle,
        label: 'Sicurezza',
        path: '/settings/security',
        requiredAccessLevel: UserAccessLevel.OPERATORE,
      },
      {
        id: 'settings-host',
        icon: Monitor,
        label: 'Configurazione Host',
        path: '/settings/host',
        requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
        requireAllPermissions: ['config.manage'],
      },
      {
        id: 'settings-dashboard',
        icon: Home,
        label: 'Dashboard',
        path: '/settings/dashboard',
        requiredAccessLevel: UserAccessLevel.SUPERVISORE,
        requiredPermissions: ['config.manage'],
      },
      {
        id: 'settings-scheduler',
        icon: Clock,
        label: 'Scheduler Prenotatore',
        path: '/settings/scheduler-prenotatore',
        requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
        requireAllPermissions: ['config.manage'],
      },
    ],
  },

  // ========================================
  // CONFIGURAZIONE
  // ========================================
  {
    id: 'config',
    icon: Settings,
    label: 'Configurazione',
    requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
    children: [
      {
        id: 'config-users',
        icon: Users,
        label: 'Utenti',
        path: '/config/users',
        requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
        requireAllPermissions: ['users.manage'],
      },
      {
        id: 'config-areas',
        icon: FolderKanban,
        label: 'Zone',
        path: '/config/areas',
        requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
        requireAllPermissions: ['config.manage'],
      },
      {
        id: 'config-printers',
        icon: Monitor,
        label: 'Stampanti',
        path: '/config/printers',
        requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
        requireAllPermissions: ['config.manage'],
      },
      {
        id: 'config-settings',
        icon: Sliders,
        label: 'Impostazioni Avanzate',
        path: '/config/settings',
        requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
        requireAllPermissions: ['config.manage'],
      },
      {
        id: 'config-scheduler',
        icon: Clock,
        label: 'Scheduler',
        path: '/scheduler-settings',
        requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
        requireAllPermissions: ['config.manage'],
      },
      {
        id: 'config-system',
        icon: Settings,
        label: 'Sistema',
        path: '/config',
        requiredAccessLevel: UserAccessLevel.AMMINISTRATORE,
        requireAllPermissions: ['config.manage'],
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se l'utente ha i permessi necessari per accedere a una voce di menu
 */
export function hasMenuAccess(
  menuItem: MenuItem,
  user: {
    accessLevel: UserAccessLevel;
    permissions?: string[];
  } | null
): boolean {
  // Nessun utente = nessun accesso
  if (!user) return false;

  // Check access level
  if (menuItem.requiredAccessLevel !== undefined) {
    if (user.accessLevel < menuItem.requiredAccessLevel) {
      return false;
    }
  }

  // Check required permissions (OR condition)
  if (menuItem.requiredPermissions && menuItem.requiredPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    const hasAnyPermission = menuItem.requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );
    if (!hasAnyPermission) {
      return false;
    }
  }

  // Check required all permissions (AND condition)
  if (menuItem.requireAllPermissions && menuItem.requireAllPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    const hasAllPermissions = menuItem.requireAllPermissions.every((perm) =>
      userPermissions.includes(perm)
    );
    if (!hasAllPermissions) {
      return false;
    }
  }

  // Check hideWhen function
  if (menuItem.hideWhen && menuItem.hideWhen(user)) {
    return false;
  }

  return true;
}

/**
 * Filtra il menu in base ai permessi dell'utente
 */
export function filterMenuByPermissions(
  menu: MenuItem[],
  user: {
    accessLevel: UserAccessLevel;
    permissions?: string[];
  } | null
): MenuItem[] {
  if (!user) return [];

  return menu
    .filter((item) => hasMenuAccess(item, user))
    .map((item) => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByPermissions(item.children, user);
        // Se il menu ha figli ma nessuno è accessibile, nasconde il parent
        if (filteredChildren.length === 0) {
          return null;
        }
        return {
          ...item,
          children: filteredChildren,
        };
      }
      return item;
    })
    .filter((item): item is MenuItem => item !== null);
}

/**
 * Ottiene un menu item per ID
 */
export function getMenuItemById(id: string, menu: MenuItem[] = menuConfig): MenuItem | null {
  for (const item of menu) {
    if (item.id === id) return item;
    if (item.children) {
      const found = getMenuItemById(id, item.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Ottiene tutti i path accessibili dall'utente
 */
export function getAccessiblePaths(
  user: {
    accessLevel: UserAccessLevel;
    permissions?: string[];
  } | null
): string[] {
  const filteredMenu = filterMenuByPermissions(menuConfig, user);
  const paths: string[] = [];

  const extractPaths = (items: MenuItem[]) => {
    items.forEach((item) => {
      if (item.path) paths.push(item.path);
      if (item.children) extractPaths(item.children);
    });
  };

  extractPaths(filteredMenu);
  return paths;
}
