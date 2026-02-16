// ============================================================================
// EJLOG WMS - ListsSidebar Component
// LEFT SIDEBAR - TaskPane Style replicating ALL buttons from Swing UI
// ============================================================================

import {
  RefreshCw,
  Eraser,
  Plus,
  Edit,
  Calendar,
  RotateCcw,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Layers,
  PackagePlus,
  Eye,
  ArrowUp,
  ArrowDown,
  Printer,
  FileText,
  ClipboardList,
  Repeat,
  Shuffle,
  Power,
  PowerOff,
  RotateCw,
  Send,
  LogOut,
  Settings
} from 'lucide-react';

// Component props interface
export interface ListsSidebarProps {
  onRefresh: () => void;
  onClear: () => void;
  onInsert: () => void;
  onEdit: () => void;
  onReserve: () => void;
  onRereserve: () => void;
  onExecute: () => void;
  onExecuteAll: () => void;
  onPause: () => void;
  onPauseAll: () => void;
  onWaiting: () => void;
  onTerminate: () => void;
  onUnprocessable: () => void;
  onMerge: () => void;
  onCreateDeposit: () => void;
  onCreateVision: () => void;
  onChangePriority: () => void;
  onChangeDestination: () => void;
  onAdvanceSequence: () => void;
  onDelaySequence: () => void;
  onPrintList: () => void;
  onPrintOperations: () => void;
  onPrintLog: () => void;
  onViewReservations: () => void;
  onSaveAsTemplate: () => void;
  onReactivateRows: () => void;
  onReviveList: () => void;
  onCopyTransform: () => void;
  onOpenSummary: () => void;
  onEnablePTL: () => void;
  onDisablePTL: () => void;
  onResetPTL: () => void;
  onResendPTL: () => void;
  onSetPtlContainerType: () => void;
  onSettings: () => void;
  onExit: () => void;
  disabled?: boolean;
}

/**
 * LEFT SIDEBAR - TaskPane Style
 * Replicates ALL buttons from Swing UI
 *
 * Sections:
 * 1. RICERCA - Search operations
 * 2. GESTIONE - List management (Create, Edit, Reserve)
 * 3. GESTIONE STATO - State management (Execute, Waiting, Terminate)
 * 4. PTL ON/OFF - PTL control buttons
 * 5. UTILITY - Exit button
 */
export const ListsSidebar = ({
  onRefresh,
  onClear,
  onInsert,
  onEdit,
  onReserve,
  onRereserve,
  onExecute,
  onExecuteAll,
  onPause,
  onPauseAll,
  onWaiting,
  onTerminate,
  onUnprocessable,
  onMerge,
  onCreateDeposit,
  onCreateVision,
  onChangePriority,
  onChangeDestination,
  onAdvanceSequence,
  onDelaySequence,
  onPrintList,
  onPrintOperations,
  onPrintLog,
  onViewReservations,
  onSaveAsTemplate,
  onReactivateRows,
  onReviveList,
  onCopyTransform,
  onOpenSummary,
  onEnablePTL,
  onDisablePTL,
  onResetPTL,
  onResendPTL,
  onSetPtlContainerType,
  onSettings,
  onExit,
  disabled = false
}: ListsSidebarProps): JSX.Element => {
  return (
    <div data-testid="lists-sidebar" className="w-64 bg-gradient-to-b from-ferretto-gray-50 to-ferretto-gray-100 border-r-2 border-ferretto-gray-300 flex flex-col overflow-y-auto shadow-ferretto">
      {/* RICERCA Section */}
      <div className="p-3 border-b-2 border-ferretto-gray-300">
        <div className="text-xs font-heading font-bold text-ferretto-red uppercase tracking-wide mb-2 px-2">
          RICERCA
        </div>
        <div className="space-y-1">
          <button
            onClick={onRefresh}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Aggiorna (F5)"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="flex-1 text-left">Aggiorna</span>
            <span className="text-xs text-ferretto-gray-500">F5</span>
          </button>
          <button
            onClick={onClear}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Pulisci (F6)"
            type="button"
          >
            <Eraser className="h-4 w-4" />
            <span className="flex-1 text-left">Pulisci</span>
            <span className="text-xs text-ferretto-gray-500">F6</span>
          </button>
        </div>
      </div>

      {/* GESTIONE Section */}
      <div className="p-3 border-b-2 border-ferretto-gray-300">
        <div className="text-xs font-heading font-bold text-ferretto-red uppercase tracking-wide mb-2 px-2">
          GESTIONE
        </div>
        <div className="space-y-1">
          <button
            onClick={onInsert}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Inserisci nuova lista"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span className="flex-1 text-left">Inserisci</span>
          </button>
          <button
            onClick={onEdit}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Modifica lista selezionata"
            type="button"
          >
            <Edit className="h-4 w-4" />
            <span className="flex-1 text-left">Modifica</span>
          </button>
          <button
            onClick={onReserve}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Prenota lista"
            type="button"
          >
            <Calendar className="h-4 w-4" />
            <span className="flex-1 text-left">Prenota</span>
          </button>
          <button
            onClick={onRereserve}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Riprenta lista"
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="flex-1 text-left">Riprenta</span>
          </button>
        </div>
      </div>

      {/* GESTIONE AVANZATA Section */}
      <div className="p-3 border-b-2 border-ferretto-gray-300">
        <div className="text-xs font-heading font-bold text-ferretto-red uppercase tracking-wide mb-2 px-2">
          GESTIONE AVANZATA
        </div>
        <div className="space-y-1">
          <button
            onClick={onMerge}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Accorpa liste"
            type="button"
          >
            <Layers className="h-4 w-4" />
            <span className="flex-1 text-left">Accorpa</span>
          </button>
          <button
            onClick={onCreateDeposit}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Crea lista deposito"
            type="button"
          >
            <PackagePlus className="h-4 w-4" />
            <span className="flex-1 text-left">Crea Lista Dep.</span>
          </button>
          <button
            onClick={onCreateVision}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Crea lista visione"
            type="button"
          >
            <Eye className="h-4 w-4" />
            <span className="flex-1 text-left">Crea Lista Vis.</span>
          </button>
          <button
            onClick={onSaveAsTemplate}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Salva come modello"
            type="button"
          >
            <FileText className="h-4 w-4" />
            <span className="flex-1 text-left">Salva Modello</span>
          </button>
          <button
            onClick={onCopyTransform}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copia e trasforma lista"
            type="button"
          >
            <Shuffle className="h-4 w-4" />
            <span className="flex-1 text-left">Copia/Trasforma</span>
          </button>
          <button
            onClick={onOpenSummary}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Apri riepilogo lista"
            type="button"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="flex-1 text-left">Riepilogo Lista</span>
          </button>
        </div>
      </div>

      {/* GESTIONE STATO Section */}
      <div className="p-3 border-b-2 border-ferretto-gray-300">
        <div className="text-xs font-heading font-bold text-ferretto-red uppercase tracking-wide mb-2 px-2">
          GESTIONE STATO
        </div>
        <div className="space-y-1">
          <button
            onClick={onExecute}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 border border-success rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Esegui lista"
            type="button"
          >
            <Play className="h-4 w-4" />
            <span className="flex-1 text-left">Esegui</span>
          </button>
          <button
            onClick={onExecuteAll}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-success/80 hover:bg-success/90 border border-success rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Esegui tutte le liste filtrate"
            type="button"
          >
            <Repeat className="h-4 w-4" />
            <span className="flex-1 text-left">Esegui Tutte</span>
          </button>
          <button
            onClick={onPause}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-warning/20 hover:bg-warning/30 border border-warning rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Metti in pausa"
            type="button"
          >
            <Clock className="h-4 w-4 text-warning" />
            <span className="flex-1 text-left">Pausa</span>
          </button>
          <button
            onClick={onPauseAll}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-warning/20 hover:bg-warning/30 border border-warning rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Metti in pausa tutte le liste filtrate"
            type="button"
          >
            <Clock className="h-4 w-4 text-warning" />
            <span className="flex-1 text-left">Pausa Tutte</span>
          </button>
          <button
            onClick={onWaiting}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-warning/20 hover:bg-warning/30 border border-warning rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Metti in attesa"
            type="button"
          >
            <Clock className="h-4 w-4 text-warning" />
            <span className="flex-1 text-left">Attesa</span>
          </button>
          <button
            onClick={onTerminate}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-info hover:bg-info/90 border border-info rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Termina lista"
            type="button"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="flex-1 text-left">Termina</span>
          </button>
          <button
            onClick={onUnprocessable}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-ferretto-red hover:bg-ferretto-red-dark border border-ferretto-red-dark rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Marca come inesedibili"
            type="button"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="flex-1 text-left">Inesedibili</span>
          </button>
          <button
            onClick={onReactivateRows}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Riattiva tutte le righe sospese"
            type="button"
          >
            <RotateCw className="h-4 w-4" />
            <span className="flex-1 text-left">Riattiva Righe</span>
          </button>
          <button
            onClick={onReviveList}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Riesuma lista terminata"
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="flex-1 text-left">Riesuma Lista</span>
          </button>
        </div>
      </div>

      {/* PRIORITA / DESTINAZIONE Section */}
      <div className="p-3 border-b-2 border-ferretto-gray-300">
        <div className="text-xs font-heading font-bold text-ferretto-red uppercase tracking-wide mb-2 px-2">
          PRIORITA / DESTINAZIONE
        </div>
        <div className="space-y-1">
          <button
            onClick={onChangePriority}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cambia priorita"
            type="button"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="flex-1 text-left">Cambio Priorita</span>
          </button>
          <button
            onClick={onChangeDestination}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cambia destinazione"
            type="button"
          >
            <ArrowDown className="h-4 w-4" />
            <span className="flex-1 text-left">Cambia Dest.</span>
          </button>
          <button
            onClick={onAdvanceSequence}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Anticipa sequenza"
            type="button"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="flex-1 text-left">Anticipa</span>
          </button>
          <button
            onClick={onDelaySequence}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Posticipa sequenza"
            type="button"
          >
            <ArrowDown className="h-4 w-4" />
            <span className="flex-1 text-left">Posticipa</span>
          </button>
        </div>
      </div>

      {/* STAMPE / LOG Section */}
      <div className="p-3 border-b-2 border-ferretto-gray-300">
        <div className="text-xs font-heading font-bold text-ferretto-red uppercase tracking-wide mb-2 px-2">
          STAMPE / LOG
        </div>
        <div className="space-y-1">
          <button
            onClick={onPrintList}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stampa lista"
            type="button"
          >
            <Printer className="h-4 w-4" />
            <span className="flex-1 text-left">Stampa</span>
          </button>
          <button
            onClick={onPrintOperations}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stampa operazioni"
            type="button"
          >
            <Printer className="h-4 w-4" />
            <span className="flex-1 text-left">Stampa Operazioni</span>
          </button>
          <button
            onClick={onPrintLog}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stampa log"
            type="button"
          >
            <FileText className="h-4 w-4" />
            <span className="flex-1 text-left">Stampa Log</span>
          </button>
          <button
            onClick={onViewReservations}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Visualizza prenotazioni"
            type="button"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="flex-1 text-left">Prenotazioni</span>
          </button>
        </div>
      </div>

      {/* PTL ON/OFF Section */}
      <div className="p-3 border-b-2 border-ferretto-gray-300">
        <div className="text-xs font-heading font-bold text-ferretto-red uppercase tracking-wide mb-2 px-2">
          PTL ON/OFF
        </div>
        <div className="space-y-1">
          <button
            onClick={onEnablePTL}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 border border-success rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Abilita PTL"
            type="button"
          >
            <Power className="h-4 w-4" />
            <span className="flex-1 text-left">Abilita PTL</span>
          </button>
          <button
            onClick={onDisablePTL}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-ferretto-red hover:bg-ferretto-red-dark border border-ferretto-red-dark rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Disabilita PTL"
            type="button"
          >
            <PowerOff className="h-4 w-4" />
            <span className="flex-1 text-left">Disabilita PTL</span>
          </button>
          <button
            onClick={onResetPTL}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset PTL"
            type="button"
          >
            <RotateCw className="h-4 w-4" />
            <span className="flex-1 text-left">Reset PTL</span>
          </button>
          <button
            onClick={onResendPTL}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Re-invia PTL"
            type="button"
          >
            <Send className="h-4 w-4" />
            <span className="flex-1 text-left">Re-invia PTL</span>
          </button>
          <button
            onClick={onSetPtlContainerType}
            disabled={disabled}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tipo contenitore PTL"
            type="button"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="flex-1 text-left">Tipo Contenitore</span>
          </button>
        </div>
      </div>

      {/* UTILITY Section */}
      <div className="p-3 mt-auto">
        <div className="text-xs font-heading font-bold text-ferretto-red uppercase tracking-wide mb-2 px-2">
          UTILITY
        </div>
        <div className="space-y-1">
          <button
            onClick={onSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-red/10 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Configura colonne tabella"
            type="button"
          >
            <Settings className="h-4 w-4" />
            <span className="flex-1 text-left">Impostazioni</span>
          </button>
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ferretto-dark bg-white hover:bg-ferretto-gray-200 border border-ferretto-gray-300 rounded-ferretto shadow-sm transition-all duration-200 hover:shadow-ferretto"
            title="Esci dalla gestione liste"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            <span className="flex-1 text-left">Uscita</span>
          </button>
        </div>
      </div>
    </div>
  );
};
