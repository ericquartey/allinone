// ============================================================================
// EJLOG WMS - ListsStatusBar Component
// STATUS ICONS BAR - Displays list type and status counters with colored badges
// ============================================================================

import { Package, RefreshCw, Eye, ClipboardList, Clock, Play, CheckCircle } from 'lucide-react';

// Component props interface
export interface ListsStatusBarProps {
  pickingCount?: number;
  refillingCount?: number;
  visionCount?: number;
  inventoryCount?: number;
  waitingCount?: number;
  inExecutionCount?: number;
  terminatedCount?: number;
  showAll?: boolean;
  onToggleShowAll?: (showAll: boolean) => void;
  onTerminateSelected?: () => void;
  selectedListType?: number | null;
  onFilterByType?: (type: number) => void;
  selectedListStatus?: number | null;
  onFilterByStatus?: (status: number) => void;
}

/**
 * STATUS ICONS BAR
 * Displays list type and status counters with colored badges
 *
 * Type Filters (clickable):
 * - Prelievo (yellow) - Picking lists
 * - Refilling (orange) - Refilling lists
 * - Visione (blue) - Vision/Inventory lists
 * - Inventario (gray) - Inventory lists
 *
 * Status Filters (clickable):
 * - In Attesa (yellow) - Waiting lists
 * - In Esecuzione (green) - Executing lists
 * - Terminate (blue) - Terminated lists
 *
 * Action Buttons:
 * - Single/Tutti toggle
 */
export const ListsStatusBar = ({
  pickingCount = 0,
  refillingCount = 0,
  visionCount = 0,
  inventoryCount = 0,
  waitingCount = 0,
  inExecutionCount = 0,
  terminatedCount = 0,
  showAll = true,
  onToggleShowAll,
  onTerminateSelected,
  selectedListType = null,
  onFilterByType,
  selectedListStatus = null,
  onFilterByStatus
}: ListsStatusBarProps): JSX.Element => {
  return (
    <div className="bg-gradient-to-r from-ferretto-gray-50 to-ferretto-gray-100 border-b-2 border-ferretto-gray-300 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Status Icons with Counters */}
        <div className="flex items-center gap-6">
          {/* Prelievo - Picking (Yellow) - Cliccabile per filtrare */}
          <button
            onClick={() => onFilterByType && onFilterByType(1)}
            className={`flex items-center gap-2 px-3 py-2 rounded-ferretto transition-all duration-200 ${
              selectedListType === 1
                ? 'bg-warning/30 ring-2 ring-warning shadow-md'
                : 'hover:bg-ferretto-gray-200'
            }`}
            type="button"
          >
            <div className="relative">
              <div className="p-2 bg-warning/20 border-2 border-warning rounded-ferretto">
                <Package className="h-5 w-5 text-warning" />
              </div>
              {pickingCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-warning rounded-full border-2 border-white shadow-sm">
                  {pickingCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-ferretto-dark">Prelievo</span>
          </button>

          {/* Refilling (Orange) - Cliccabile per filtrare */}
          <button
            onClick={() => onFilterByType && onFilterByType(2)}
            className={`flex items-center gap-2 px-3 py-2 rounded-ferretto transition-all duration-200 ${
              selectedListType === 2
                ? 'bg-orange-100 ring-2 ring-orange-400 shadow-md'
                : 'hover:bg-ferretto-gray-200'
            }`}
            type="button"
          >
            <div className="relative">
              <div className="p-2 bg-orange-100 border-2 border-orange-400 rounded-ferretto">
                <RefreshCw className="h-5 w-5 text-orange-700" />
              </div>
              {refillingCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full border-2 border-white shadow-sm">
                  {refillingCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-ferretto-dark">Refilling</span>
          </button>

          {/* Visione (Blue) - Cliccabile per filtrare */}
          <button
            onClick={() => onFilterByType && onFilterByType(3)}
            className={`flex items-center gap-2 px-3 py-2 rounded-ferretto transition-all duration-200 ${
              selectedListType === 3
                ? 'bg-info/30 ring-2 ring-info shadow-md'
                : 'hover:bg-ferretto-gray-200'
            }`}
            type="button"
          >
            <div className="relative">
              <div className="p-2 bg-info/20 border-2 border-info rounded-ferretto">
                <Eye className="h-5 w-5 text-info" />
              </div>
              {visionCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-info rounded-full border-2 border-white shadow-sm">
                  {visionCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-ferretto-dark">Visione</span>
          </button>

          {/* Inventario (Gray) - Cliccabile per filtrare */}
          <button
            onClick={() => onFilterByType && onFilterByType(3)}
            className={`flex items-center gap-2 px-3 py-2 rounded-ferretto transition-all duration-200 ${
              selectedListType === 3
                ? 'bg-ferretto-gray-200 ring-2 ring-ferretto-gray-400 shadow-md'
                : 'hover:bg-ferretto-gray-200'
            }`}
            type="button"
          >
            <div className="relative">
              <div className="p-2 bg-ferretto-gray-100 border-2 border-ferretto-gray-400 rounded-ferretto">
                <ClipboardList className="h-5 w-5 text-ferretto-gray-700" />
              </div>
              {inventoryCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-ferretto-gray-500 rounded-full border-2 border-white shadow-sm">
                  {inventoryCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-ferretto-dark">Inventario</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Single / Tutti Toggle */}
          <div className="flex items-center bg-white border-2 border-ferretto-gray-300 rounded-ferretto overflow-hidden shadow-sm">
            <button
              onClick={() => onToggleShowAll && onToggleShowAll(false)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                !showAll
                  ? 'bg-ferretto-red text-white'
                  : 'bg-white text-ferretto-dark hover:bg-ferretto-gray-100'
              }`}
              type="button"
            >
              Single
            </button>
            <button
              onClick={() => onToggleShowAll && onToggleShowAll(true)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                showAll
                  ? 'bg-ferretto-red text-white'
                  : 'bg-white text-ferretto-dark hover:bg-ferretto-gray-100'
              }`}
              type="button"
            >
              Tutti
            </button>
          </div>

          {/* In Attesa - Clickable Status Filter */}
          <button
            onClick={() => onFilterByStatus && onFilterByStatus(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-ferretto shadow-sm transition-all duration-200 ${
              selectedListStatus === 1
                ? 'bg-warning/40 ring-2 ring-warning shadow-md'
                : 'bg-warning/20 border-2 border-warning hover:bg-warning/30'
            }`}
            type="button"
          >
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm font-bold text-warning">In Attesa</span>
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-bold text-white bg-warning rounded-full">
              {waitingCount}
            </span>
          </button>

          {/* In Esecuzione - Clickable Status Filter */}
          <button
            onClick={() => onFilterByStatus && onFilterByStatus(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-ferretto shadow-sm transition-all duration-200 ${
              selectedListStatus === 2
                ? 'bg-success/40 ring-2 ring-success shadow-md'
                : 'bg-success/20 border-2 border-success hover:bg-success/30'
            }`}
            type="button"
          >
            <Play className="h-4 w-4 text-success" />
            <span className="text-sm font-bold text-success">In Esecuzione</span>
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-bold text-white bg-success rounded-full">
              {inExecutionCount}
            </span>
          </button>

          {/* Terminate - Clickable Status Filter */}
          <button
            onClick={() => onFilterByStatus && onFilterByStatus(3)}
            className={`flex items-center gap-2 px-4 py-2 rounded-ferretto shadow-sm transition-all duration-200 ${
              selectedListStatus === 3
                ? 'bg-info/40 ring-2 ring-info shadow-md'
                : 'bg-info/20 border-2 border-info hover:bg-info/30'
            }`}
            type="button"
          >
            <CheckCircle className="h-4 w-4 text-info" />
            <span className="text-sm font-bold text-info">Terminate</span>
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-bold text-white bg-info rounded-full">
              {terminatedCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
