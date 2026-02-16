// ============================================================================
// EJLOG WMS - Settings Page (Main Index)
// Pagina principale impostazioni con navigazione a sezioni
// ============================================================================

import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Cog6ToothIcon,
  ServerIcon,
  CircleStackIcon,
  ChartBarIcon,
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
  LinkIcon,
  BuildingOffice2Icon,
  ArrowsRightLeftIcon,
  CpuChipIcon,
  TruckIcon,
  ShoppingCartIcon,
  SignalIcon,
  InboxArrowDownIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

interface SettingsSection {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    label: 'Configurazione Generale',
    path: '/settings/general',
    icon: Cog6ToothIcon,
    description: 'Gestione configurazioni sistema (Sezione/Sottosezione/Chiave/Valore)',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/settings/dashboard',
    icon: ChartBarIcon,
    description: 'Configurazione widget e grafici della dashboard',
  },
  {
    id: 'host',
    label: 'Configurazione Host',
    path: '/settings/host',
    icon: ServerIcon,
    description: 'Impostazioni connessione server e endpoint API',
  },
  {
    id: 'sql-connection',
    label: 'Connessione SQL',
    path: '/settings/sql-connection',
    icon: CircleStackIcon,
    description: 'Configurazione connessione database EJLOG (host, istanza, credenziali)',
  },
  {
    id: 'integration-sap',
    label: 'Integrazione SAP',
    path: '/settings/integration-sap',
    icon: LinkIcon,
    description: 'Connessione SAP S/4HANA o ECC e scambio dati WMS',
  },
  {
    id: 'integration-status',
    label: 'Stato integrazioni',
    path: '/settings/integration-status',
    icon: SignalIcon,
    description: 'Monitoraggio log e sincronizzazioni integrazioni',
  },
  {
    id: 'integration-edi-inbox',
    label: 'EDI Inbox',
    path: '/settings/integration-edi-inbox',
    icon: InboxArrowDownIcon,
    description: 'Messaggi EDI ricevuti e importati',
  },
  {
    id: 'integration-item-mappings',
    label: 'Mapping Articoli',
    path: '/settings/integration-item-mappings',
    icon: TagIcon,
    description: 'Mapping codici esterni verso articoli WMS',
  },
  {
    id: 'integration-erp',
    label: 'Integrazione ERP',
    path: '/settings/integration-erp',
    icon: BuildingOffice2Icon,
    description: 'Integrazione ERP generici via REST, SOAP o file',
  },
  {
    id: 'integration-edi',
    label: 'Integrazione EDI/AS2',
    path: '/settings/integration-edi',
    icon: ArrowsRightLeftIcon,
    description: 'Flussi EDI, AS2 e file exchange con partner',
  },
  {
    id: 'integration-mes',
    label: 'Integrazione MES',
    path: '/settings/integration-mes',
    icon: CpuChipIcon,
    description: 'Collegamento con sistemi MES di produzione',
  },
  {
    id: 'integration-tms',
    label: 'Integrazione TMS',
    path: '/settings/integration-tms',
    icon: TruckIcon,
    description: 'Connessione TMS per spedizioni e tracking',
  },
  {
    id: 'integration-ecommerce',
    label: 'Integrazione eCommerce',
    path: '/settings/integration-ecommerce',
    icon: ShoppingCartIcon,
    description: 'Marketplace e store online (ordini e stock)',
  },
  {
    id: 'scheduler-prenotatore',
    label: 'Scheduler e Prenotatore',
    path: '/settings/scheduler-prenotatore',
    icon: ClockIcon,
    description: 'Mappa completa di scheduler, prenotatore, settings e tipologie',
  },
  {
    id: 'ai-config',
    label: 'AI Assistant (Admin)',
    path: '/settings/ai-config',
    icon: SparklesIcon,
    description: 'Configurazione API keys e parametri AI (solo amministratori)',
  },
  {
    id: 'profile',
    label: 'Profilo Utente',
    path: '/settings/profile',
    icon: UserCircleIcon,
    description: 'Gestione profilo personale e preferenze utente',
  },
  {
    id: 'notifications',
    label: 'Notifiche',
    path: '/settings/notifications',
    icon: BellIcon,
    description: 'Configurazione notifiche e avvisi di sistema',
  },
  {
    id: 'security',
    label: 'Sicurezza',
    path: '/settings/security',
    icon: ShieldCheckIcon,
    description: 'Gestione password, autenticazione e sicurezza',
  },
];

export default function SettingsPage() {
  const location = useLocation();

  // Se siamo esattamente su /settings, mostra la pagina index
  const isIndexPage = location.pathname === '/settings';

  return (
    <div>
      {isIndexPage ? (
        // Index Page - Mostra griglia delle sezioni disponibili
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Cog6ToothIcon className="h-12 w-12 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
                <p className="text-gray-600 mt-1">
                  Gestione configurazioni e preferenze di sistema
                </p>
              </div>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsSections.map((section) => (
              <NavLink
                key={section.id}
                to={section.path}
                className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <section.icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {section.label}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Arrow indicator on hover */}
                <div className="mt-4 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Apri</span>
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </NavLink>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  Gestione Configurazioni
                </h4>
                <p className="text-sm text-blue-800">
                  Le modifiche alle impostazioni vengono salvate automaticamente.
                  Alcune configurazioni potrebbero richiedere il riavvio dell'applicazione per essere applicate.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Sub-page - Mostra tab navigation + contenuto specifico
        <div>
          {/* Tabs Navigation */}
          <div className="bg-white border-b border-gray-200 -mx-4 -mt-6 mb-6">
            <div className="px-10">
              <nav className="flex space-x-1 overflow-x-auto py-4" aria-label="Settings navigation">
                {settingsSections.map((section) => {
                  const isActive = location.pathname === section.path;
                  return (
                    <NavLink
                      key={section.id}
                      to={section.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <section.icon className="w-5 h-5" />
                      <span>{section.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div>
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}
