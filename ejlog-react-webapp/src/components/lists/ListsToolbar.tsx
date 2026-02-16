/**
 * Lists Toolbar
 * Implements all button sections from Swing GestioneListePanelNew.java
 * Sections: RICERCA, GESTIONE, GESTIONE STATO, OPERAZIONI AVANZATE, PTL
 */

import React from 'react';
import {
  RefreshCw,
  XCircle,
  Plus,
  Edit,
  Copy,
  Trash2,
  Printer,
  FileText,
  Play,
  Pause,
  CheckCircle,
  BookOpen,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  MapPin,
  Settings,
  Zap,
  ZapOff,
  Send,
  RotateCcw
} from 'lucide-react';

interface ListsToolbarProps {
  selectedList: any | null;
  selectedListsCount: number;
  isLoading?: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
  onCreate: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDeleteAll?: () => void;
  onPrint: () => void;
  onViewLog: () => void;
  onBook: () => void;
  onRebook: () => void;
  onExecute: () => void;
  onPause: () => void;
  onTerminate: () => void;
  onManageUnavailable: () => void;
  onChangePriority: () => void;
  onChangeDestination: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEnablePTL: () => void;
  onDisablePTL: () => void;
  onResendPTL: () => void;
  onResetPTL: () => void;
}

export const ListsToolbar: React.FC<ListsToolbarProps> = ({
  selectedList,
  selectedListsCount,
  isLoading = false,
  onRefresh,
  onClearFilters,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onDeleteAll,
  onPrint,
  onViewLog,
  onBook,
  onRebook,
  onExecute,
  onPause,
  onTerminate,
  onManageUnavailable,
  onChangePriority,
  onChangeDestination,
  onMoveUp,
  onMoveDown,
  onEnablePTL,
  onDisablePTL,
  onResendPTL,
  onResetPTL
}) => {
  const hasSelection = selectedList !== null;
  const hasMultipleSelection = selectedListsCount > 1;

  // Button component for consistency
  const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
    requiresSelection?: boolean;
  }> = ({
    onClick,
    icon,
    label,
    disabled = false,
    variant = 'secondary',
    requiresSelection = false
  }) => {
    const isDisabled = disabled || isLoading || (requiresSelection && !hasSelection);

    const variantClasses = {
      primary: 'bg-ferretto-blue hover:bg-ferretto-dark text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      danger: 'bg-red-50 hover:bg-red-100 text-red-700',
      success: 'bg-green-50 hover:bg-green-100 text-green-700',
      warning: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
    };

    return (
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`
          flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded transition-colors
          ${variantClasses[variant]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={label}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
      {/* Selection Info */}
      {hasSelection && (
        <div className="mb-3 pb-3 border-b border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Selezionate:</span> {selectedListsCount} lista/e
            {selectedList && (
              <span className="ml-2">
                | <span className="font-medium">Lista:</span> {selectedList.listNumber || selectedList.id}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Toolbar Sections */}
      <div className="space-y-3">
        {/* SECTION 1: RICERCA (Search Actions) */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-gray-500 w-24">RICERCA</div>
          <div className="flex gap-2 flex-wrap">
            <ToolbarButton
              onClick={onRefresh}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              label="Aggiorna"
              variant="primary"
            />
            <ToolbarButton
              onClick={onClearFilters}
              icon={<XCircle className="w-3.5 h-3.5" />}
              label="Pulisci"
              variant="secondary"
            />
          </div>
        </div>

        {/* SECTION 2: GESTIONE (Management Actions) */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-gray-500 w-24">GESTIONE</div>
          <div className="flex gap-2 flex-wrap">
            <ToolbarButton
              onClick={onCreate}
              icon={<Plus className="w-3.5 h-3.5" />}
              label="Inserisci"
              variant="success"
            />
            <ToolbarButton
              onClick={onEdit}
              icon={<Edit className="w-3.5 h-3.5" />}
              label="Modifica"
              variant="secondary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onDuplicate}
              icon={<Copy className="w-3.5 h-3.5" />}
              label="Duplica"
              variant="secondary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onDelete}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              label="Elimina"
              variant="danger"
              requiresSelection
            />
            {onDeleteAll && (
              <ToolbarButton
                onClick={onDeleteAll}
                icon={<Trash2 className="w-3.5 h-3.5" />}
                label="Elimina TUTTO"
                variant="danger"
                requiresSelection={false}
                title="⚠️ Elimina TUTTE le liste - OPERAZIONE PERICOLOSA"
              />
            )}
            <ToolbarButton
              onClick={onPrint}
              icon={<Printer className="w-3.5 h-3.5" />}
              label="Stampa"
              variant="secondary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onViewLog}
              icon={<FileText className="w-3.5 h-3.5" />}
              label="Log"
              variant="secondary"
              requiresSelection
            />
          </div>
        </div>

        {/* SECTION 3: GESTIONE STATO (State Management) */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-gray-500 w-24">STATO</div>
          <div className="flex gap-2 flex-wrap">
            <ToolbarButton
              onClick={onBook}
              icon={<BookOpen className="w-3.5 h-3.5" />}
              label="Prenota"
              variant="primary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onRebook}
              icon={<BookOpen className="w-3.5 h-3.5" />}
              label="Riprenota"
              variant="secondary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onExecute}
              icon={<Play className="w-3.5 h-3.5" />}
              label="Esegui"
              variant="success"
              requiresSelection
            />
            <ToolbarButton
              onClick={onPause}
              icon={<Pause className="w-3.5 h-3.5" />}
              label="Pausa"
              variant="warning"
              requiresSelection
            />
            <ToolbarButton
              onClick={onTerminate}
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              label="Termina"
              variant="danger"
              requiresSelection
            />
          </div>
        </div>

        {/* SECTION 4: OPERAZIONI AVANZATE (Advanced Operations) */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-gray-500 w-24">AVANZATE</div>
          <div className="flex gap-2 flex-wrap">
            <ToolbarButton
              onClick={onManageUnavailable}
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              label="Inevadibilità"
              variant="warning"
              requiresSelection
            />
            <ToolbarButton
              onClick={onChangePriority}
              icon={<Settings className="w-3.5 h-3.5" />}
              label="Priorità"
              variant="secondary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onChangeDestination}
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Destinazione"
              variant="secondary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onMoveUp}
              icon={<ArrowUpCircle className="w-3.5 h-3.5" />}
              label="Anticipa"
              variant="secondary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onMoveDown}
              icon={<ArrowDownCircle className="w-3.5 h-3.5" />}
              label="Posticipa"
              variant="secondary"
              requiresSelection
            />
          </div>
        </div>

        {/* SECTION 5: PTL INTEGRATION */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-gray-500 w-24">PTL</div>
          <div className="flex gap-2 flex-wrap">
            <ToolbarButton
              onClick={onEnablePTL}
              icon={<Zap className="w-3.5 h-3.5" />}
              label="Abilita PTL"
              variant="success"
              requiresSelection
            />
            <ToolbarButton
              onClick={onDisablePTL}
              icon={<ZapOff className="w-3.5 h-3.5" />}
              label="Disabilita PTL"
              variant="secondary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onResendPTL}
              icon={<Send className="w-3.5 h-3.5" />}
              label="Reinvia PTL"
              variant="primary"
              requiresSelection
            />
            <ToolbarButton
              onClick={onResetPTL}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              label="Reset PTL"
              variant="warning"
              requiresSelection
            />
          </div>
        </div>
      </div>
    </div>
  );
};
