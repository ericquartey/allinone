/**
 * Scheduler Management Page
 * Complete replacement of Java Swing TaskSchedulerPanelTouch
 *
 * Features:
 * - Full CRUD operations for schedulazioni
 * - 13 actions (Execute, Enable, Disable, Interrupt, etc.)
 * - Color-coded rows (7 visual states)
 * - Real-time updates (auto-refresh every 5s)
 * - Multi-selection support
 * - Batch operations
 * - Job-specific configuration
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  RefreshCw,
  Play,
  Square,
  PlayCircle,
  StopCircle,
  Plus,
  Edit,
  Trash2,
  Settings,
  Eraser,
  Calendar,
  Server,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';

// API
import {
  getSchedulerStatus,
  executeNow,
  enableSchedulazione,
  disableSchedulazione,
  interruptSchedulazione,
  clearErrorMessage,
  deleteSchedulazione,
  enableMultipleSchedulazioni,
  disableMultipleSchedulazioni,
  clearMultipleErrors,
  restoreDefaultJobs,
} from '../api/scheduler';

// Types
import type {
  Schedulazione,
  SchedulerStatus,
  SchedulerSummary,
} from '../types/scheduler';

import {
  canExecuteNow,
  canEnable,
  canDisable,
  canInterrupt,
  canEdit,
  canDelete,
  canConfigure,
  getSchedulazioneRowColor,
  formatCronExpression,
  formatIntervallo,
} from '../types/scheduler';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SchedulerManagement: React.FC = () => {
  const queryClient = useQueryClient();

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedRows, setSelectedRows] = useState<Schedulazione[]>([]);
  const [showAllSchedulers, setShowAllSchedulers] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSchedulerId, setFilterSchedulerId] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useQuery<SchedulerStatus>({
    queryKey: ['scheduler-status', showAllSchedulers, filterSchedulerId],
    queryFn: getSchedulerStatus,
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 3000,
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const executeNowMutation = useMutation({
    mutationFn: (id: number) => executeNow(id, false),
    onSuccess: (_, id) => {
      const schedulazione = selectedRows.find(s => s.id === id);
      toast.success(`Job "${schedulazione?.nome}" execution started`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to execute job');
    },
  });

  const enableMutation = useMutation({
    mutationFn: (id: number) => enableSchedulazione(id),
    onSuccess: (_, id) => {
      const schedulazione = selectedRows.find(s => s.id === id);
      toast.success(`Job "${schedulazione?.nome}" enabled`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enable job');
    },
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => disableSchedulazione(id),
    onSuccess: (_, id) => {
      const schedulazione = selectedRows.find(s => s.id === id);
      toast.success(`Job "${schedulazione?.nome}" disabled`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disable job');
    },
  });

  const interruptMutation = useMutation({
    mutationFn: (id: number) => interruptSchedulazione(id),
    onSuccess: (_, id) => {
      const schedulazione = selectedRows.find(s => s.id === id);
      toast.success(`Interrupt signal sent to "${schedulazione?.nome}"`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to interrupt job');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSchedulazione(id),
    onSuccess: (_, id) => {
      const schedulazione = selectedRows.find(s => s.id === id);
      toast.success(`Job "${schedulazione?.nome}" deleted`);
      setSelectedRows([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete job');
    },
  });

  const clearErrorMutation = useMutation({
    mutationFn: (id: number) => clearErrorMessage(id),
    onSuccess: () => {
      toast.success('Error message cleared');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear error');
    },
  });

  const restoreDefaultsMutation = useMutation({
    mutationFn: restoreDefaultJobs,
    onSuccess: () => {
      toast.success('Default jobs restored');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore defaults');
    },
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const schedulazioni = useMemo(() => {
    if (!status?.schedulazioni) return [];

    let filtered = status.schedulazioni;

    // Filter by scheduler ID
    if (filterSchedulerId && !showAllSchedulers) {
      filtered = filtered.filter(s => s.idSchedulatore === filterSchedulerId);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.nome.toLowerCase().includes(query) ||
          s.descrizione?.toLowerCase().includes(query) ||
          s.classe.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [status?.schedulazioni, filterSchedulerId, showAllSchedulers, searchQuery]);

  const summary = status?.summary || {
    total: 0,
    active: 0,
    running: 0,
    errors: 0,
    stopped: 0,
    modified: 0,
    prenotazioni: {
      totalPrenotazioni: 0,
      abilitate: 0,
      nonAbilitate: 0,
    },
  };

  const isSingleSelected = selectedRows.length === 1;
  const hasStoppedJobs = selectedRows.some(s => s.stopped);
  const hasActiveJobs = selectedRows.some(s => !s.stopped && s.abilitata);
  const hasErrors = selectedRows.some(s => s.messaggioErrore);
  const isConfigurable = isSingleSelected && selectedRows[0]?.configurable;

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleExecuteNow = async () => {
    if (!isSingleSelected) return;

    const schedulazione = selectedRows[0];

    if (schedulazione.stopped) {
      const confirmed = window.confirm(
        `Job "${schedulazione.nome}" is stopped. Execute anyway?`
      );
      if (!confirmed) return;
    }

    executeNowMutation.mutate(schedulazione.id);
  };

  const handleEnable = async () => {
    const stoppedJobs = selectedRows.filter(s => s.stopped);

    for (const job of stoppedJobs) {
      await enableMutation.mutateAsync(job.id);
    }
  };

  const handleDisable = async () => {
    const activeJobs = selectedRows.filter(s => !s.stopped && s.abilitata);

    for (const job of activeJobs) {
      await disableMutation.mutateAsync(job.id);
    }
  };

  const handleInterrupt = () => {
    if (!isSingleSelected) return;

    const schedulazione = selectedRows[0];

    if (!schedulazione.interruptible) {
      toast.error('This job cannot be interrupted');
      return;
    }

    interruptMutation.mutate(schedulazione.id);
  };

  const handleDelete = () => {
    if (!isSingleSelected) return;

    const schedulazione = selectedRows[0];

    if (!schedulazione.stopped && schedulazione.abilitata) {
      toast.error('Cannot delete active job. Disable it first.');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!isSingleSelected) return;
    deleteMutation.mutate(selectedRows[0].id);
    setShowDeleteConfirm(false);
  };

  const handleClearError = async () => {
    const jobsWithErrors = selectedRows.filter(s => s.messaggioErrore);

    for (const job of jobsWithErrors) {
      await clearErrorMutation.mutateAsync(job.id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows([...schedulazioni]);
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (schedulazione: Schedulazione) => {
    setSelectedRows(prev => {
      const isSelected = prev.some(s => s.id === schedulazione.id);
      if (isSelected) {
        return prev.filter(s => s.id !== schedulazione.id);
      } else {
        return [...prev, schedulazione];
      }
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Scheduler</h2>
            <p className="text-red-300">{(error as Error).message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Scheduler Management
            </h1>
            <p className="text-gray-400 mt-1">
              Manage scheduled jobs and monitor execution status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              Auto-Refresh (5s)
            </label>

            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* STATS CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            title="Total Schedulazioni"
            value={summary.total}
            color="blue"
            icon={<Calendar className="w-6 h-6" />}
          />
          <StatCard
            title="Active"
            value={summary.active}
            color="green"
            icon={<PlayCircle className="w-6 h-6" />}
          />
          <StatCard
            title="Running"
            value={summary.running}
            color="purple"
            icon={<Play className="w-6 h-6" />}
          />
          <StatCard
            title="Errors"
            value={summary.errors}
            color={summary.errors > 0 ? 'red' : 'gray'}
            icon={<StopCircle className="w-6 h-6" />}
          />
        </motion.div>

        {/* TOOLBAR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4"
        >
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, description, or class..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg">
              <input
                type="checkbox"
                checked={showAllSchedulers}
                onChange={e => setShowAllSchedulers(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-600 border-gray-500"
              />
              <span className="text-sm">Show All Schedulers</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <ActionButton
              icon={<Play />}
              label="Execute"
              onClick={handleExecuteNow}
              disabled={!isSingleSelected || !canExecuteNow(selectedRows[0])}
              variant="success"
            />
            <ActionButton
              icon={<Square />}
              label="Interrupt"
              onClick={handleInterrupt}
              disabled={!isSingleSelected || !canInterrupt(selectedRows[0])}
              variant="warning"
            />
            <ActionButton
              icon={<PlayCircle />}
              label="Enable"
              onClick={handleEnable}
              disabled={!hasStoppedJobs}
              variant="success"
            />
            <ActionButton
              icon={<StopCircle />}
              label="Disable"
              onClick={handleDisable}
              disabled={!hasActiveJobs}
              variant="danger"
            />
            <ActionButton
              icon={<Plus />}
              label="Add"
              onClick={() => setShowAddModal(true)}
              variant="primary"
            />
            <ActionButton
              icon={<Edit />}
              label="Edit"
              onClick={() => setShowEditModal(true)}
              disabled={!isSingleSelected || !canEdit(selectedRows[0])}
              variant="primary"
            />
            <ActionButton
              icon={<Trash2 />}
              label="Delete"
              onClick={handleDelete}
              disabled={!isSingleSelected || !canDelete(selectedRows[0])}
              variant="danger"
            />
            <ActionButton
              icon={<Settings />}
              label="Configure"
              onClick={() => setShowConfigModal(true)}
              disabled={!isConfigurable}
              variant="primary"
            />
            <ActionButton
              icon={<Eraser />}
              label="Clear Error"
              onClick={handleClearError}
              disabled={!hasErrors}
              variant="warning"
            />
            <ActionButton
              icon={<Calendar />}
              label="History"
              onClick={() => setShowHistoryModal(true)}
              variant="secondary"
            />
            <ActionButton
              icon={<Server />}
              label="Host Jobs"
              onClick={() => setShowHostModal(true)}
              variant="secondary"
            />
            <ActionButton
              icon={<RotateCcw />}
              label="Restore"
              onClick={() => restoreDefaultsMutation.mutate()}
              variant="secondary"
            />
          </div>

          {/* Selection Info */}
          {selectedRows.length > 0 && (
            <div className="mt-4 text-sm text-gray-400">
              {selectedRows.length} job{selectedRows.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </motion.div>

        {/* DATA GRID */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === schedulazioni.length && schedulazioni.length > 0}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                    />
                  </th>
                  <th className="p-3 text-left font-semibold">Name</th>
                  <th className="p-3 text-left font-semibold">Description</th>
                  <th className="p-3 text-left font-semibold">Scheduler ID</th>
                  <th className="p-3 text-left font-semibold">Schedule</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Loading schedulazioni...
                    </td>
                  </tr>
                ) : schedulazioni.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      No schedulazioni found
                    </td>
                  </tr>
                ) : (
                  schedulazioni.map(schedulazione => (
                    <SchedulerRow
                      key={schedulazione.id}
                      schedulazione={schedulazione}
                      isSelected={selectedRows.some(s => s.id === schedulazione.id)}
                      onSelect={() => handleRowSelect(schedulazione)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ERROR PANEL */}
        {isSingleSelected && selectedRows[0].messaggioErrore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-500 rounded-lg p-4"
          >
            <h3 className="font-semibold text-red-400 mb-2">Error Message:</h3>
            <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono">
              {selectedRows[0].messaggioErrore}
            </pre>
          </motion.div>
        )}

        {/* TODO: Add Modals */}
        {/* AddSchedulerModal, EditSchedulerModal, ConfigureJobModal, etc. */}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'red' | 'gray';
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-4xl font-bold mb-1">{value}</p>
      <p className="text-gray-400 text-sm">{title}</p>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  variant,
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-orange-600 hover:bg-orange-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 px-3 py-2 rounded-lg
        transition-colors text-sm font-medium
        ${disabled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : variantClasses[variant]}
      `}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
};

interface SchedulerRowProps {
  schedulazione: Schedulazione;
  isSelected: boolean;
  onSelect: () => void;
}

const SchedulerRow: React.FC<SchedulerRowProps> = ({
  schedulazione,
  isSelected,
  onSelect,
}) => {
  const colorConfig = getSchedulazioneRowColor(schedulazione);

  const schedule = schedulazione.cronExpression
    ? formatCronExpression(schedulazione.cronExpression)
    : formatIntervallo(schedulazione.intervallo, schedulazione.ripetizioni);

  return (
    <tr
      className={`
        border-t border-gray-700 hover:bg-gray-700/30 transition-colors cursor-pointer
        ${colorConfig.backgroundColor} ${colorConfig.textColor}
      `}
      onClick={onSelect}
    >
      <td className="p-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded bg-gray-700 border-gray-600"
        />
      </td>
      <td className="p-3 font-medium">{schedulazione.nome}</td>
      <td className="p-3 text-sm">{schedulazione.descrizione || '-'}</td>
      <td className="p-3 text-sm">{schedulazione.idSchedulatore}</td>
      <td className="p-3 text-sm font-mono">{schedule}</td>
      <td className="p-3">
        <div className="flex flex-col gap-1">
          {schedulazione.isExecuting && (
            <span className="inline-flex items-center gap-1 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Running
              {schedulazione.progress !== undefined && (
                <span className="ml-1">({schedulazione.progress}%)</span>
              )}
            </span>
          )}
          {schedulazione.stopped && (
            <span className="text-xs px-2 py-0.5 bg-orange-900/50 rounded">Stopped</span>
          )}
          {!schedulazione.stopped && !schedulazione.isExecuting && schedulazione.abilitata && (
            <span className="text-xs px-2 py-0.5 bg-green-900/50 rounded">Enabled</span>
          )}
          {schedulazione.modificata && (
            <span className="text-xs px-2 py-0.5 bg-yellow-900/50 rounded">Modified</span>
          )}
        </div>
      </td>
      <td className="p-3">
        {schedulazione.messaggioErrore && (
          <span className="text-xs text-red-400 truncate max-w-xs block">
            {schedulazione.messaggioErrore.substring(0, 50)}...
          </span>
        )}
      </td>
    </tr>
  );
};

export default SchedulerManagement;
