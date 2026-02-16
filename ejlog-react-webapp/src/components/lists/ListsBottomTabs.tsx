// ============================================================================
// EJLOG WMS - ListsBottomTabs Component
// BOTTOM TABS Section - Displays detailed information in tabs
// ============================================================================

import { useState } from 'react';
import { Warehouse, List, Calendar, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Tab definition
interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

// List row interface (for type safety)
interface ListRow {
  rowNumber: number;
  item: string;
  lineDescription?: string;
  requestedQty: number;
  processedQty?: number;
  lot?: string;
  auxHostText01?: string;
}

// Selected list interface
export interface SelectedList {
  listRows?: ListRow[];
}

// Component props interface
export interface ListsBottomTabsProps {
  selectedList: SelectedList | null;
}

/**
 * BOTTOM TABS Section
 * Displays detailed information in tabs
 *
 * Tabs:
 * - Operazioni per magazzino - Warehouse operations
 * - Righe lista - List rows details
 * - Prenotazioni - Reservations
 * - Movimenti - Movements
 */
export const ListsBottomTabs = ({ selectedList }: ListsBottomTabsProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState<string>('rows');

  const tabs: Tab[] = [
    { id: 'warehouse', label: 'Operazioni per magazzino', icon: Warehouse },
    { id: 'rows', label: 'Righe lista', icon: List },
    { id: 'reservations', label: 'Prenotazioni', icon: Calendar },
    { id: 'movements', label: 'Movimenti', icon: TrendingUp }
  ];

  const renderRowsTab = (): JSX.Element => {
    if (!selectedList || !selectedList.listRows || selectedList.listRows.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-ferretto-gray-500">
          Nessuna riga disponibile
        </div>
      );
    }

    return (
      <div className="overflow-auto">
        <table className="table">
          <thead className="bg-ferretto-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-heading font-bold text-ferretto-dark uppercase">Riga</th>
              <th className="px-3 py-2 text-left text-xs font-heading font-bold text-ferretto-dark uppercase">Articolo</th>
              <th className="px-3 py-2 text-left text-xs font-heading font-bold text-ferretto-dark uppercase">Descrizione</th>
              <th className="px-3 py-2 text-right text-xs font-heading font-bold text-ferretto-dark uppercase">Qtà Richiesta</th>
              <th className="px-3 py-2 text-right text-xs font-heading font-bold text-ferretto-dark uppercase">Qtà Evasa</th>
              <th className="px-3 py-2 text-left text-xs font-heading font-bold text-ferretto-dark uppercase">Lotto</th>
              <th className="px-3 py-2 text-left text-xs font-heading font-bold text-ferretto-dark uppercase">Ubicazione</th>
              <th className="px-3 py-2 text-center text-xs font-heading font-bold text-ferretto-dark uppercase">Stato</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedList.listRows.map((row: ListRow, index: number) => {
              const completed = (row.processedQty || 0) >= row.requestedQty;
              const partial = (row.processedQty || 0) > 0 && (row.processedQty || 0) < row.requestedQty;

              return (
                <tr key={row.rowNumber || index} className={index % 2 === 0 ? 'bg-white' : 'bg-ferretto-gray-50'}>
                  <td className="px-3 py-2 text-sm text-ferretto-dark">{row.rowNumber}</td>
                  <td className="px-3 py-2 text-sm font-medium text-ferretto-dark">{row.item}</td>
                  <td className="px-3 py-2 text-sm text-ferretto-dark">{row.lineDescription || '-'}</td>
                  <td className="px-3 py-2 text-sm text-right text-ferretto-dark">{row.requestedQty}</td>
                  <td className="px-3 py-2 text-sm text-right font-medium text-ferretto-dark">
                    {row.processedQty || 0}
                  </td>
                  <td className="px-3 py-2 text-sm text-ferretto-dark">{row.lot || '-'}</td>
                  <td className="px-3 py-2 text-sm text-ferretto-dark">{row.auxHostText01 || '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`badge ${
                      completed
                        ? 'badge-success'
                        : partial
                        ? 'badge-warning'
                        : 'bg-ferretto-gray-100 text-ferretto-gray-800'
                    }`}>
                      {completed ? 'Completato' : partial ? 'Parziale' : 'In attesa'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWarehouseTab = (): JSX.Element => {
    return (
      <div className="p-4 text-center text-ferretto-gray-500">
        Operazioni per magazzino - Coming soon
      </div>
    );
  };

  const renderReservationsTab = (): JSX.Element => {
    return (
      <div className="p-4 text-center text-ferretto-gray-500">
        Prenotazioni - Coming soon
      </div>
    );
  };

  const renderMovementsTab = (): JSX.Element => {
    return (
      <div className="p-4 text-center text-ferretto-gray-500">
        Movimenti - Coming soon
      </div>
    );
  };

  const renderTabContent = (): JSX.Element | null => {
    switch (activeTab) {
      case 'warehouse':
        return renderWarehouseTab();
      case 'rows':
        return renderRowsTab();
      case 'reservations':
        return renderReservationsTab();
      case 'movements':
        return renderMovementsTab();
      default:
        return null;
    }
  };

  return (
    <div className="h-80 flex flex-col border-t-2 border-ferretto-gray-300 bg-white shadow-ferretto">
      {/* Tab Headers */}
      <div className="flex border-b-2 border-ferretto-gray-300 bg-gradient-to-r from-ferretto-gray-50 to-ferretto-gray-100">
        {tabs.map((tab: Tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-r border-ferretto-gray-300 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-ferretto-red border-b-4 border-b-ferretto-red'
                  : 'text-ferretto-dark hover:bg-ferretto-gray-200'
              }`}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};
