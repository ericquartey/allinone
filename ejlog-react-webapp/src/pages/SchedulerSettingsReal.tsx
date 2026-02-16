/**
 * Scheduler Settings Page - REAL DATA
 * Monitors real Schedulazione table and Prenotazioni
 * Replicates Java WmsTaskSchedulerModule + WmsPrenotatoreModule UI
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Clock,
  PlayCircle,
  StopCircle,
  XCircle,
  Activity,
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Terminal,
  Network,
  Shield,
  Users,
  Download,
  Cpu,
  TrendingUp,
  Database,
} from 'lucide-react';
import logicCatalogJson from '../data/logic-catalog.json';
interface SchedulerStatus {
  schedulerExists: boolean;
  running: boolean;
  prenotatoreEnabled: boolean;
  schedulazioni: Schedulazione[];
  summary: {
    total: number;
    active: number;
    running: number;
    errors: number;
    prenotazioni: {
      totalPrenotazioni: number;
      abilitate: number;
      nonAbilitate: number;
    };
  };
}

interface Schedulazione {
  id: number;
  group: string;
  name: string;
  className: string;
  enabled: boolean;
  stopped: boolean;
  interval: number;
  cronExpression: string;
  params: string;
  error: string | null;
  errorRetries: number;
  maxRetries: number;
  lastExecution: string;
  nextExecution: string;
  schedulerId: string;
  lastDuration: number;
  executionGroup: string;
}

type LogicStep = {
  key: string;
  logics: string[];
};

type LogicConfigItem = {
  id: number;
  idTipoLista: number;
  descrizione: string;
  elencoLogiche: string;
  elencoFiltri?: string;
  format?: 'xstream' | 'legacy';
  steps: LogicStep[];
};

type LogicItem = {
  id: string;
  className: string;
};

type DragPayload = {
  itemId: number;
  logicId: string;
  sourceStepKey?: string;
};

type PrenotazioniStat = {
  listTypeId: number;
  listType: string;
  total: number;
  enabled: number;
  disabled: number;
  executing: number;
  active: number;
};

type CoordinatorStatus = {
  isLeader: boolean;
  javaSchedulerActive: boolean;
  lastJavaHeartbeat: string | null;
  lastOwnHeartbeat: string | null;
  mode: 'AUTO' | 'STANDALONE' | 'SLAVE';
  instanceId: string;
};

type SchedulerInstance = {
  instanceId: string;
  instanceType: 'JAVA' | 'NODE';
  hostname: string;
  port: number;
  pid: number;
  isLeader: boolean;
  lastHeartbeat: string;
  version: string;
  metadata: any;
  secondsSinceHeartbeat: number;
  isAlive: boolean;
};

type SchedulerServiceStatus = {
  active: boolean;
  fetcher: {
    running: boolean;
    intervalMs: number;
    batchSize: number;
    lastFetch: string | null;
  };
  processor: {
    running: boolean;
    workers: number;
    queueSize: number;
  };
  stats: {
    listsFetched: number;
    listsProcessed: number;
    listsFailed: number;
    prenotazioniCreated: number;
    startTime: string;
    uptime: number;
  };
  clients: {
    count: number;
    connected: any[];
  };
  registry: any;
};

type LogicCatalog = {
  picking: LogicItem[];
  refilling: LogicItem[];
};

const logicCatalog = logicCatalogJson as LogicCatalog;
const pickingLogics: LogicItem[] = logicCatalog.picking ?? [];
const refillingLogics: LogicItem[] = logicCatalog.refilling ?? [];

const pickingLogicById = Object.fromEntries(pickingLogics.map((item) => [item.id, item.className]));
const refillingLogicById = Object.fromEntries(refillingLogics.map((item) => [item.id, item.className]));

const coerceBoolean = (value: unknown): boolean =>
  value === true || value === 'true' || value === 1 || value === '1';

const buildSummaryFromSchedulazioni = (
  schedulazioni: Array<Record<string, unknown>>
): SchedulerStatus['summary'] => {
  const basePrenotazioni = {
    totalPrenotazioni: 0,
    abilitate: 0,
    nonAbilitate: 0,
  };

  let active = 0;
  let running = 0;
  let errors = 0;

  schedulazioni.forEach((item) => {
    const enabled = coerceBoolean((item as any).enabled ?? (item as any).abilitata);
    const stopped = coerceBoolean((item as any).stopped);
    if (enabled && !stopped) {
      active += 1;
    }

    const executing = coerceBoolean(
      (item as any).isExecuting ?? (item as any).isRunning ?? (item as any).running
    );
    if (executing) {
      running += 1;
    }

    const errorMessage = (item as any).error ?? (item as any).messaggioErrore;
    if (typeof errorMessage === 'string' && errorMessage.trim() !== '') {
      errors += 1;
    }
  });

  return {
    total: schedulazioni.length,
    active,
    running,
    errors,
    prenotazioni: basePrenotazioni,
  };
};

const normalizeSchedulerStatus = (payload: any): SchedulerStatus | null => {
  if (!payload || typeof payload !== 'object') return null;

  if (payload.success === false) return null;
  const raw = payload.success && payload.data ? payload.data : payload;

  const schedulazioni = Array.isArray(raw.schedulazioni) ? raw.schedulazioni : [];
  const computedSummary = buildSummaryFromSchedulazioni(schedulazioni);
  const summaryFromPayload = raw.summary ?? {};

  const summary = {
    ...computedSummary,
    ...summaryFromPayload,
    prenotazioni: {
      ...computedSummary.prenotazioni,
      ...(summaryFromPayload?.prenotazioni || {}),
    },
  };

  return {
    ...raw,
    schedulazioni,
    summary,
  };
};

const extractPrenotazioniSummary = (payload: any): SchedulerStatus['summary']['prenotazioni'] | null => {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.success === false) return null;

  const data = payload.data ?? payload;
  if (!Array.isArray(data)) return null;

  return data.reduce(
    (acc: SchedulerStatus['summary']['prenotazioni'], item: PrenotazioniStat) => ({
      totalPrenotazioni: acc.totalPrenotazioni + (item.total || 0),
      abilitate: acc.abilitate + (item.enabled || 0),
      nonAbilitate: acc.nonAbilitate + (item.disabled || 0),
    }),
    { totalPrenotazioni: 0, abilitate: 0, nonAbilitate: 0 }
  );
};

export const SchedulerSettingsReal: React.FC = () => {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [activeTab, setActiveTab] = useState('status');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logicItems, setLogicItems] = useState<LogicConfigItem[]>([]);
  const [logicLoading, setLogicLoading] = useState(false);
  const [logicSaving, setLogicSaving] = useState(false);
  const [logicError, setLogicError] = useState<string | null>(null);
  const [logicRefreshing, setLogicRefreshing] = useState(false);
  const [logicRefreshMessage, setLogicRefreshMessage] = useState<string | null>(null);
  const [logicRefreshStatus, setLogicRefreshStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [logicLoadAttempted, setLogicLoadAttempted] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [logicGroupTab, setLogicGroupTab] = useState<'all' | 'picking' | 'refilling'>('all');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [terminalConnected, setTerminalConnected] = useState(false);
  const [coordinatorStatus, setCoordinatorStatus] = useState<CoordinatorStatus | null>(null);
  const [schedulerInstances, setSchedulerInstances] = useState<SchedulerInstance[]>([]);
  const [schedulerServiceStatus, setSchedulerServiceStatus] = useState<SchedulerServiceStatus | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const [statusResponse, prenotazioniResponse, coordinatorResponse, instancesResponse, serviceStatusResponse] = await Promise.allSettled([
        fetch('/api/scheduler-status'),
        fetch('/api/scheduler-status/prenotazioni'),
        fetch('/api/scheduler/coordinator/status'),
        fetch('/api/scheduler/coordinator/instances'),
        fetch('/api/scheduler/status'),
      ]);

      let nextStatus: SchedulerStatus | null = null;

      if (statusResponse.status === 'fulfilled') {
        const statusPayload = await statusResponse.value.json().catch(() => null);
        if (statusResponse.value.ok) {
          nextStatus = normalizeSchedulerStatus(statusPayload);
        } else {
          console.error('Error loading scheduler status:', statusPayload);
        }
      } else {
        console.error('Error loading scheduler status:', statusResponse.reason);
      }

      if (nextStatus && prenotazioniResponse.status === 'fulfilled') {
        const prenPayload = await prenotazioniResponse.value.json().catch(() => null);
        const prenSummary = extractPrenotazioniSummary(prenPayload);
        if (prenSummary) {
          nextStatus = {
            ...nextStatus,
            summary: {
              ...nextStatus.summary,
              prenotazioni: prenSummary,
            },
          };
        }
      }

      // Load coordinator status
      if (coordinatorResponse.status === 'fulfilled') {
        const coordPayload = await coordinatorResponse.value.json().catch(() => null);
        if (coordinatorResponse.value.ok && coordPayload?.success) {
          setCoordinatorStatus(coordPayload.data);
        }
      }

      // Load scheduler instances
      if (instancesResponse.status === 'fulfilled') {
        const instancesPayload = await instancesResponse.value.json().catch(() => null);
        if (instancesResponse.value.ok && instancesPayload?.success) {
          setSchedulerInstances(instancesPayload.data || []);
        }
      }

      // Load scheduler service status (fetcher/processor stats)
      if (serviceStatusResponse.status === 'fulfilled') {
        const servicePayload = await serviceStatusResponse.value.json().catch(() => null);
        if (serviceStatusResponse.value.ok && servicePayload?.success) {
          setSchedulerServiceStatus(servicePayload.data);
        }
      }

      if (nextStatus) {
        setStatus(nextStatus);
      }
    } catch (error) {
      console.error('Error loading scheduler status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    if (activeTab === 'logiche' && !logicLoadAttempted && !logicLoading) {
      loadLogics();
    }
  }, [activeTab, logicLoadAttempted, logicLoading]);

  useEffect(() => {
    if (activeTab !== 'terminal') return undefined;

    let ws: WebSocket | null = null;
    let prenotazioniTimer: ReturnType<typeof setInterval> | null = null;

    const appendLine = (message: string) => {
      const timestamp = new Date().toISOString();
      setTerminalLines((prev) => {
        const next = [...prev, `[${timestamp}] ${message}`];
        return next.length > 300 ? next.slice(next.length - 300) : next;
      });
    };

    const openWebSocket = () => {
      try {
        const host = window.location.hostname || 'localhost';
        const url = `ws://${host}:3077/ws`;
        ws = new WebSocket(url);

        ws.onopen = () => {
          setTerminalConnected(true);
          appendLine('WebSocket connesso');
          ws?.send(JSON.stringify({ type: 'subscribe', channel: 'lists' }));
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'lists_update') {
              const changeCount = Array.isArray(payload.changes) ? payload.changes.length : 0;
              appendLine(`Liste update: ${changeCount}`);
              payload.changes?.slice(0, 5).forEach((change: any) => {
                const numLista = change?.data?.numLista ?? '-';
                appendLine(` - ${change.type} lista ${numLista}`);
              });
            } else if (payload.type === 'connection') {
              appendLine(payload.message || 'Connesso');
            } else {
              appendLine(`Evento: ${payload.type || 'unknown'}`);
            }
          } catch (error) {
            appendLine('Messaggio non valido');
          }
        };

        ws.onclose = () => {
          setTerminalConnected(false);
          appendLine('WebSocket disconnesso');
        };

        ws.onerror = () => {
          appendLine('Errore WebSocket');
        };
      } catch (error) {
        appendLine('Impossibile aprire WebSocket');
      }
    };

    const startPrenotazioniPolling = () => {
      const poll = async () => {
        try {
          // Poll prenotazioni
          const prenotazioniResponse = await fetch('/api/scheduler-status/prenotazioni');
          const prenotazioniData = await prenotazioniResponse.json();
          if (prenotazioniData.success && Array.isArray(prenotazioniData.data)) {
            const snapshot = (prenotazioniData.data as PrenotazioniStat[])
              .map((item) => `${item.listType}:${item.total}/${item.enabled}`)
              .join(' | ');
            appendLine(`📦 Prenotazioni: ${snapshot || 'n/a'}`);
          }

          // Poll scheduler service status (Fetcher/Processor)
          const schedulerResponse = await fetch('/api/scheduler/status');
          const schedulerData = await schedulerResponse.json();
          if (schedulerData.success && schedulerData.data) {
            const { fetcher, processor, stats } = schedulerData.data;
            appendLine(`⚙️  Fetcher: ${fetcher.running ? 'RUNNING' : 'STOPPED'} | Processor: ${processor.running ? 'RUNNING' : 'STOPPED'} | Queue: ${processor.queueSize || 0}`);
            if (stats && (stats.listsFetched > 0 || stats.listsProcessed > 0)) {
              appendLine(`📊 Stats: Fetched=${stats.listsFetched || 0} Processed=${stats.listsProcessed || 0} Failed=${stats.listsFailed || 0} Prenotazioni=${stats.prenotazioniCreated || 0}`);
            }
          }
        } catch (error) {
          appendLine('⚠️  Errore polling dati');
        }
      };

      poll();
      prenotazioniTimer = setInterval(poll, 5000);
    };

    openWebSocket();
    startPrenotazioniPolling();

    return () => {
      if (prenotazioniTimer) clearInterval(prenotazioniTimer);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', channel: 'lists' }));
        ws.close();
      }
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'terminal' && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines, activeTab]);

  const toggleSchedulazione = async (id: number, enable: boolean) => {
    const endpoint = enable ? 'enable' : 'disable';
    await fetch(`/api/scheduler-status/${endpoint}/${id}`, { method: 'POST' });
    loadStatus();
  };

  const clearError = async (id: number) => {
    await fetch(`/api/scheduler-status/clear-error/${id}`, { method: 'POST' });
    loadStatus();
  };

  const loadLogics = async () => {
    setLogicLoading(true);
    setLogicError(null);
    setLogicLoadAttempted(true);
    try {
      const response = await fetch('/api/scheduler-logics');
      if (!response.ok) {
        const fallback = await response.text();
        setLogicError(fallback || `Errore HTTP ${response.status}`);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setLogicItems(Array.isArray(data.data) ? data.data : []);
      } else {
        setLogicError(data.message || 'Errore durante il caricamento delle logiche');
      }
    } catch (error) {
      console.error('Error loading scheduler logics:', error);
      setLogicError('Errore durante il caricamento delle logiche');
    } finally {
      setLogicLoading(false);
    }
  };

  const refreshLogics = async (): Promise<boolean> => {
    setLogicRefreshing(true);
    setLogicRefreshMessage(null);
    setLogicRefreshStatus('idle');
    try {
      const response = await fetch('/api/scheduler-logics/refresh', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        const timestamp = data.timestamp || new Date().toISOString();
        setLogicRefreshMessage(`Refresh logiche registrato ${timestamp}`);
        setLogicRefreshStatus('success');
        return true;
      }
      const message =
        data.message || data.error || `Refresh logiche fallito (${response.status})`;
      setLogicRefreshMessage(message);
      setLogicRefreshStatus('error');
      return false;
    } catch (error) {
      console.error('Error refreshing scheduler logics:', error);
      setLogicRefreshMessage('Errore di rete durante la sincronizzazione');
      setLogicRefreshStatus('error');
      return false;
    } finally {
      setLogicRefreshing(false);
    }
  };

  const saveLogics = async () => {
    if (!logicItems.length) return;
    setLogicSaving(true);
    setLogicError(null);
    try {
      const response = await fetch('/api/scheduler-logics/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: logicItems.map((item) => ({
            id: item.id,
            idTipoLista: item.idTipoLista,
            steps: item.steps,
          })),
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setLogicError(data.message || 'Errore durante il salvataggio delle logiche');
      } else {
        await refreshLogics();
        await loadLogics();
      }
    } catch (error) {
      console.error('Error saving scheduler logics:', error);
      setLogicError('Errore durante il salvataggio delle logiche');
    } finally {
      setLogicSaving(false);
    }
  };

  const updateLogicItem = (itemId: number, updater: (item: LogicConfigItem) => LogicConfigItem) => {
    setLogicItems((prev) => prev.map((item) => (item.id === itemId ? updater(item) : item)));
  };

  const toggleLogicInStep = (itemId: number, stepKey: string, logicId: string) => {
    updateLogicItem(itemId, (item) => {
      const steps = item.steps.map((step) => {
        if (step.key !== stepKey) return step;
        const exists = step.logics.includes(logicId);
        const logics = exists
          ? step.logics.filter((logic) => logic !== logicId)
          : [...step.logics, logicId];
        return { ...step, logics };
      });
      return { ...item, steps };
    });
  };

  const setAllLogicsForStep = (itemId: number, stepKey: string, allLogics: string[]) => {
    updateLogicItem(itemId, (item) => {
      const steps = item.steps.map((step) => (step.key === stepKey ? { ...step, logics: allLogics } : step));
      return { ...item, steps };
    });
  };

  const buildLogicChoices = (item: LogicConfigItem) => {
    const base = item.idTipoLista === 1 ? pickingLogics : refillingLogics;
    const baseIds = new Set(base.map((logic) => logic.id));
    const configured = new Set(item.steps.flatMap((step) => step.logics));

    if (item.format === 'legacy') {
      const extra = Array.from(configured)
        .filter((logicId) => !baseIds.has(logicId))
        .map((logicId) => ({ id: logicId, className: logicId }));
      return [...base, ...extra];
    }

    const extra = Array.from(configured)
      .filter((className) => !base.some((logic) => logic.className === className))
      .map((className) => {
        const tail = className.split('.').pop() || className;
        const id = baseIds.has(tail) ? `${tail}_legacy` : tail;
        return { id, className };
      });

    return [...base, ...extra];
  };

  const pickingItems = logicItems.filter((item) => item.idTipoLista === 1);
  const refillingItems = logicItems.filter((item) => item.idTipoLista === 2);
  const activePickingLogics = new Set(
    pickingItems.flatMap((item) =>
      item.steps.flatMap((step) =>
        step.logics.map((logic) => (logic.includes('.') ? logic : pickingLogicById[logic] || logic))
      )
    )
  );
  const activeRefillingLogics = new Set(
    refillingItems.flatMap((item) =>
      item.steps.flatMap((step) =>
        step.logics.map((logic) => (logic.includes('.') ? logic : refillingLogicById[logic] || logic))
      )
    )
  );

  const clearTerminal = () => setTerminalLines([]);

  const getLogicValue = (item: LogicConfigItem, choice: LogicItem) =>
    item.format === 'legacy' ? choice.id : choice.className;

  const findLogicClassName = (item: LogicConfigItem, choices: LogicItem[], logicId: string) => {
    if (item.format === 'legacy') {
      return choices.find((choice) => choice.id === logicId)?.className || logicId;
    }
    if (logicId.includes('.')) return logicId;
    const match = choices.find((choice) => choice.id === logicId);
    return match ? match.className : logicId;
  };

  const getLogicLabel = (item: LogicConfigItem, choices: LogicItem[], logicId: string) => {
    if (item.format === 'legacy') return logicId;
    const match = choices.find((choice) => choice.className === logicId);
    if (match) return match.id;
    const tail = logicId.split('.').pop();
    return tail || logicId;
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    payload: DragPayload
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, key: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverKey(key);
  };

  const handleDropOnStep = (
    event: React.DragEvent<HTMLDivElement>,
    itemId: number,
    stepKey: string
  ) => {
    event.preventDefault();
    setDragOverKey(null);
    const raw = event.dataTransfer.getData('application/json');
    if (!raw) return;
    let payload: DragPayload | null = null;
    try {
      payload = JSON.parse(raw) as DragPayload;
    } catch {
      payload = null;
    }
    if (!payload || payload.itemId !== itemId) return;

    updateLogicItem(itemId, (item) => {
      const steps = item.steps.map((step) => {
        if (step.key === stepKey) {
          if (step.logics.includes(payload.logicId)) return step;
          return { ...step, logics: [...step.logics, payload.logicId] };
        }
        if (payload.sourceStepKey && step.key === payload.sourceStepKey) {
          return { ...step, logics: step.logics.filter((logic) => logic !== payload!.logicId) };
        }
        return step;
      });
      return { ...item, steps };
    });
  };

  const handleRemoveFromStep = (itemId: number, stepKey: string, logicId: string) => {
    updateLogicItem(itemId, (item) => {
      const steps = item.steps.map((step) =>
        step.key === stepKey ? { ...step, logics: step.logics.filter((logic) => logic !== logicId) } : step
      );
      return { ...item, steps };
    });
  };

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Caricamento Scheduler Settings</h2>
          <p className="text-gray-600">Recupero stato dello scheduler in corso...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <AlertTriangle className="w-20 h-20 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Errore Caricamento</h2>
          <p className="text-gray-600 mb-4">Impossibile caricare lo stato dello scheduler</p>
          <button
            onClick={loadStatus}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Scheduler Settings</h1>
                <p className="text-gray-600">Monitoraggio real-time schedulazione e prenotazioni</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium transition-all shadow-md ${
                  autoRefresh
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {autoRefresh ? '✓ Auto-Refresh (5s)' : 'Auto-Refresh OFF'}
              </button>
              <button
                onClick={loadStatus}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-md font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Aggiorna
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-2">
          <div className="flex gap-2">
            {[
              { id: 'status', label: 'Stato Sistema', icon: Activity },
              { id: 'schedulazioni', label: 'Schedulazioni', icon: Clock },
              { id: 'prenotazioni', label: 'Prenotazioni', icon: Package },
              { id: 'logiche', label: 'Logiche', icon: Settings },
              { id: 'terminal', label: 'Terminale', icon: Terminal }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium capitalize rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white"
                >
                  <Clock className="w-12 h-12 mb-3 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2 opacity-90">Schedulazioni</h3>
                  <p className="text-4xl font-bold mb-2">{status.summary?.total || 0}</p>
                  <p className="text-sm opacity-80">Totale configurate</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white"
                >
                  <PlayCircle className="w-12 h-12 mb-3 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2 opacity-90">Attive</h3>
                  <p className="text-4xl font-bold mb-2">{status.summary?.active || 0}</p>
                  <p className="text-sm opacity-80">Abilitate ora</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg text-white"
                >
                  <Package className="w-12 h-12 mb-3 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2 opacity-90">Prenotazioni</h3>
                  <p className="text-4xl font-bold mb-2">
                    {status.summary?.prenotazioni?.totalPrenotazioni || 0}
                  </p>
                  <p className="text-sm opacity-80">Ultime 24 ore</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`bg-gradient-to-br ${
                    (status.summary?.errors || 0) > 0
                      ? 'from-red-500 to-red-600'
                      : 'from-gray-400 to-gray-500'
                  } rounded-xl p-6 shadow-lg text-white`}
                >
                  <AlertTriangle className="w-12 h-12 mb-3 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2 opacity-90">Errori</h3>
                  <p className="text-4xl font-bold mb-2">{status.summary?.errors || 0}</p>
                  <p className="text-sm opacity-80">Schedulazioni in errore</p>
                </motion.div>
              </div>

              {/* System Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  Stato Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 mb-2">Scheduler Exists</span>
                    <span className={`text-2xl font-bold ${status.schedulerExists ? 'text-green-600' : 'text-red-600'}`}>
                      {status.schedulerExists ? '✓ SI' : '✗ NO'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 mb-2">Running</span>
                    <span className={`text-2xl font-bold ${status.running ? 'text-green-600' : 'text-orange-600'}`}>
                      {status.running ? '✓ ATTIVO' : '○ INATTIVO'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 mb-2">Prenotatore</span>
                    <span className={`text-2xl font-bold ${status.prenotatoreEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                      {status.prenotatoreEnabled ? '✓ ABILITATO' : '○ DISABILITATO'}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Coordinator Status */}
              {coordinatorStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl shadow-lg p-6 mt-6"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Network className="w-6 h-6 text-purple-600" />
                    Coordinator Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Leadership Status */}
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 mb-2">Leadership</span>
                      <div className="flex items-center gap-2">
                        <Shield className={`w-6 h-6 ${coordinatorStatus.isLeader ? 'text-green-600' : 'text-blue-600'}`} />
                        <span className={`text-2xl font-bold ${coordinatorStatus.isLeader ? 'text-green-600' : 'text-blue-600'}`}>
                          {coordinatorStatus.isLeader ? 'LEADER' : 'FOLLOWER'}
                        </span>
                      </div>
                    </div>

                    {/* Coordinator Mode */}
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 mb-2">Mode</span>
                      <span className="px-4 py-2 bg-purple-100 text-purple-800 text-lg font-bold rounded-full">
                        {coordinatorStatus.mode}
                      </span>
                    </div>

                    {/* Java Scheduler Status */}
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 mb-2">Java Scheduler</span>
                      <span className={`text-2xl font-bold ${coordinatorStatus.javaSchedulerActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {coordinatorStatus.javaSchedulerActive ? '✓ ACTIVE' : '○ INACTIVE'}
                      </span>
                    </div>

                    {/* Instance ID */}
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 mb-2">Instance ID</span>
                      <span className="text-sm font-mono font-bold text-gray-900 truncate max-w-full px-2">
                        {coordinatorStatus.instanceId}
                      </span>
                    </div>
                  </div>

                  {/* Alert for Java Active */}
                  {coordinatorStatus.javaSchedulerActive && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-900">Java Scheduler Detected</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Java scheduler is active. Node scheduler is operating in {coordinatorStatus.mode} mode
                          {!coordinatorStatus.isLeader && ' and will become leader if Java fails'}.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Active Instances */}
              {schedulerInstances.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-xl shadow-lg p-6 mt-6"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Active Scheduler Instances ({schedulerInstances.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Instance ID</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Host</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">PID</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Leader</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Last Heartbeat</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {schedulerInstances.map((instance, index) => (
                          <motion.tr
                            key={instance.instanceId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">
                              {instance.instanceId}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                instance.instanceType === 'JAVA'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {instance.instanceType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {instance.hostname}:{instance.port}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                              {instance.pid}
                            </td>
                            <td className="px-4 py-3">
                              {instance.isLeader ? (
                                <Shield className="w-5 h-5 text-green-600" />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>
                                {new Date(instance.lastHeartbeat).toLocaleTimeString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {instance.secondsSinceHeartbeat}s ago
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                instance.isAlive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {instance.isAlive ? 'ALIVE' : 'DEAD'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Service Statistics */}
              {schedulerServiceStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-xl shadow-lg p-6 mt-6"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                    Service Statistics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Fetcher Status */}
                    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <Download className="w-8 h-8 mb-2 text-blue-600" />
                      <span className="text-sm text-gray-600 mb-1">Fetcher</span>
                      <span className={`text-xl font-bold ${schedulerServiceStatus.fetcher.running ? 'text-green-600' : 'text-gray-400'}`}>
                        {schedulerServiceStatus.fetcher.running ? 'RUNNING' : 'STOPPED'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Interval: {schedulerServiceStatus.fetcher.intervalMs}ms
                      </span>
                    </div>

                    {/* Processor Status */}
                    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <Cpu className="w-8 h-8 mb-2 text-purple-600" />
                      <span className="text-sm text-gray-600 mb-1">Processor</span>
                      <span className={`text-xl font-bold ${schedulerServiceStatus.processor.running ? 'text-green-600' : 'text-gray-400'}`}>
                        {schedulerServiceStatus.processor.running ? 'RUNNING' : 'STOPPED'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Workers: {schedulerServiceStatus.processor.workers}
                      </span>
                    </div>

                    {/* Queue Size */}
                    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                      <Database className="w-8 h-8 mb-2 text-orange-600" />
                      <span className="text-sm text-gray-600 mb-1">Queue Size</span>
                      <span className="text-3xl font-bold text-orange-600">
                        {schedulerServiceStatus.processor.queueSize}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        In attesa
                      </span>
                    </div>

                    {/* Service Uptime */}
                    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <Activity className="w-8 h-8 mb-2 text-green-600" />
                      <span className="text-sm text-gray-600 mb-1">Uptime</span>
                      <span className="text-xl font-bold text-green-600">
                        {Math.floor((schedulerServiceStatus.stats.uptime || 0) / 1000 / 60)}m
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Minuti attivi
                      </span>
                    </div>
                  </div>

                  {/* Statistics Numbers */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {schedulerServiceStatus.stats.listsFetched || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Lists Fetched</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {schedulerServiceStatus.stats.listsProcessed || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Lists Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {schedulerServiceStatus.stats.listsFailed || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Lists Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {schedulerServiceStatus.stats.prenotazioniCreated || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Prenotazioni Created</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Schedulazioni Tab */}
          {activeTab === 'schedulazioni' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Schedulazioni Configurate ({status.schedulazioni?.length || 0})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gestisci e monitora tutte le schedulazioni del sistema
                </p>
              </div>

              {(status.schedulazioni?.length || 0) === 0 ? (
                <div className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Nessuna schedulazione configurata</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Gruppo</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Intervallo</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Stato</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Errore</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(status.schedulazioni || []).map((sch, index) => (
                        <motion.tr
                          key={sch.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">#{sch.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{sch.name}</div>
                            <div className="text-xs text-gray-500">{sch.className}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {sch.group}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {sch.interval ? `${sch.interval}ms` : sch.cronExpression || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {sch.enabled && !sch.stopped ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                <PlayCircle className="w-3 h-3" />
                                ATTIVA
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                                <StopCircle className="w-3 h-3" />
                                FERMATA
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            {sch.error ? (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <span className="text-red-600 text-xs line-clamp-2" title={sch.error}>
                                  {sch.error.substring(0, 60)}...
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                OK
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              {sch.enabled && !sch.stopped ? (
                                <button
                                  onClick={() => toggleSchedulazione(sch.id, false)}
                                  className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                                  title="Ferma schedulazione"
                                >
                                  <StopCircle className="w-5 h-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleSchedulazione(sch.id, true)}
                                  className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                                  title="Avvia schedulazione"
                                >
                                  <PlayCircle className="w-5 h-5" />
                                </button>
                              )}
                              {sch.error && (
                                <button
                                  onClick={() => clearError(sch.id)}
                                  className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                                  title="Pulisci errore"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Prenotazioni Tab */}
          {activeTab === 'prenotazioni' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Package className="w-7 h-7 text-purple-600" />
                  Statistiche Prenotazioni
                </h3>
                <p className="text-gray-600">Ultimi dati delle prenotazioni (24 ore)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Package className="w-10 h-10 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">
                      TOTALE
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-blue-900 mb-1">
                    {status.summary?.prenotazioni?.totalPrenotazioni || 0}
                  </p>
                  <p className="text-sm text-blue-700">Prenotazioni totali</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                    <span className="text-xs font-semibold text-green-700 bg-green-200 px-3 py-1 rounded-full">
                      ABILITATE
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-green-900 mb-1">
                    {status.summary?.prenotazioni?.abilitate || 0}
                  </p>
                  <p className="text-sm text-green-700">Prenotazioni attive</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200 shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <XCircle className="w-10 h-10 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
                      DISABILITATE
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-1">
                    {status.summary?.prenotazioni?.nonAbilitate || 0}
                  </p>
                  <p className="text-sm text-gray-700">Prenotazioni non attive</p>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Rapporto Abilitate/Totali</span>
                  <span className="text-sm font-bold text-blue-600">
                    {(status.summary?.prenotazioni?.totalPrenotazioni || 0) > 0
                      ? Math.round(((status.summary?.prenotazioni?.abilitate || 0) / (status.summary?.prenotazioni?.totalPrenotazioni || 1)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (status.summary?.prenotazioni?.totalPrenotazioni || 0) > 0
                          ? ((status.summary?.prenotazioni?.abilitate || 0) / (status.summary?.prenotazioni?.totalPrenotazioni || 1)) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Logiche Tab */}
          {activeTab === 'logiche' && (
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <Settings className="w-7 h-7 text-blue-600" />
                    Logiche Prenotatore
                  </h3>
                  <p className="text-gray-600">
                    Attiva/disattiva le logiche per ogni step. Le scelte vengono salvate su
                    TipoGestioneArticolo.elencoLogiche.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={loadLogics}
                    disabled={logicLoading}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                  >
                    Ricarica
                  </button>
                  <button
                    onClick={saveLogics}
                    disabled={logicSaving || !logicItems.length}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {logicSaving ? 'Salvataggio...' : 'Salva logiche'}
                  </button>
                  <button
                    onClick={refreshLogics}
                    disabled={logicRefreshing}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${logicRefreshing ? 'animate-spin text-blue-600' : 'text-gray-500'}`}
                    />
                    {logicRefreshing ? 'Sincronizzazione...' : 'Sincronizza scheduler'}
                  </button>
                </div>

                {logicRefreshMessage && (
                  <div
                    className={`mt-3 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                      logicRefreshStatus === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                  >
                    {logicRefreshStatus === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span className="flex-1">{logicRefreshMessage}</span>
                  </div>
                )}
              </div>

              {logicError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {logicError}
                </div>
              )}

              {logicLoading ? (
                <div className="text-sm text-gray-500">Caricamento logiche in corso...</div>
              ) : logicItems.length === 0 ? (
                <div className="text-sm text-gray-500">Nessuna configurazione logiche trovata.</div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'Tutte' },
                      { id: 'picking', label: 'Picking' },
                      { id: 'refilling', label: 'Refilling' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setLogicGroupTab(tab.id as 'all' | 'picking' | 'refilling')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          logicGroupTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {(logicGroupTab === 'all' || logicGroupTab === 'picking') && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Picking</h4>
                      {pickingItems.length === 0 && (
                        <div className="text-sm text-gray-500">Nessuna configurazione picking trovata.</div>
                      )}
                      {pickingItems.map((item) => {
                      const choices = buildLogicChoices(item);
                      const activeSet = new Set(item.steps.flatMap((step) => step.logics));
                      return (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-5 space-y-5">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <h5 className="text-lg font-semibold text-gray-900">{item.descrizione}</h5>
                              <p className="text-xs text-gray-500">Id {item.id} | TipoLista {item.idTipoLista}</p>
                            </div>
                            <span className="text-xs text-gray-500">{item.steps.length} step</span>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-800">Palette logiche</span>
                              <span className="text-xs text-gray-500">Drag and drop sui step</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {choices.map((choice) => {
                                const value = getLogicValue(item, choice);
                                const isActive = activeSet.has(value);
                                return (
                                  <div
                                    key={`${item.id}-palette-${choice.id}`}
                                    draggable
                                    onDragStart={(event) =>
                                      handleDragStart(event, { itemId: item.id, logicId: value })
                                    }
                                    onClick={() => {
                                      const defaultStep = item.steps[0]?.key;
                                      if (defaultStep) {
                                        toggleLogicInStep(item.id, defaultStep, value);
                                      }
                                    }}
                                    className={`px-3 py-2 rounded-lg border text-xs font-mono cursor-grab active:cursor-grabbing transition-colors ${
                                      isActive
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300'
                                    }`}
                                    title={choice.className}
                                  >
                                    {choice.id}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Click su una card per attivare nello step principale.
                            </div>
                          </div>

                          {item.steps.length === 0 && (
                            <div className="text-sm text-gray-500">Nessuno step configurato.</div>
                          )}

                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {item.steps.map((step) => {
                              const dropKey = `${item.id}-${step.key}`;
                              return (
                                <div
                                  key={dropKey}
                                  onDragOver={(event) => handleDragOver(event, dropKey)}
                                  onDragLeave={() => setDragOverKey(null)}
                                  onDrop={(event) => handleDropOnStep(event, item.id, step.key)}
                                  className={`rounded-xl border p-4 transition-colors ${
                                    dragOverKey === dropKey ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-semibold text-gray-800">{step.key}</div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <button
                                        onClick={() =>
                                          setAllLogicsForStep(item.id, step.key, choices.map((c) => getLogicValue(item, c)))
                                        }
                                        className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                                      >
                                        Tutti
                                      </button>
                                      <button
                                        onClick={() => setAllLogicsForStep(item.id, step.key, [])}
                                        className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                                      >
                                        Nessuno
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 min-h-[48px]">
                                    {step.logics.length === 0 && (
                                      <div className="text-xs text-gray-400">Trascina qui le logiche</div>
                                    )}
                                    {step.logics.map((logicId) => (
                                      <div
                                        key={`${item.id}-${step.key}-${logicId}`}
                                        draggable
                                        onDragStart={(event) =>
                                          handleDragStart(event, {
                                            itemId: item.id,
                                            logicId,
                                            sourceStepKey: step.key,
                                          })
                                        }
                                        onDoubleClick={() => handleRemoveFromStep(item.id, step.key, logicId)}
                                        className="px-3 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white text-xs font-mono cursor-grab active:cursor-grabbing"
                                        title={findLogicClassName(item, choices, logicId)}
                                      >
                                        {getLogicLabel(item, choices, logicId)}
                                      </div>
                                    ))}
                                  </div>
                                  {step.logics.length > 0 && (
                                    <div className="text-[11px] text-gray-500 mt-2">
                                      Doppio click per rimuovere una logica.
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}

                  {(logicGroupTab === 'all' || logicGroupTab === 'refilling') && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Refilling</h4>
                      {refillingItems.length === 0 && (
                        <div className="text-sm text-gray-500">Nessuna configurazione refilling trovata.</div>
                      )}
                      {refillingItems.map((item) => {
                      const choices = buildLogicChoices(item);
                      const activeSet = new Set(item.steps.flatMap((step) => step.logics));
                      return (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-5 space-y-5">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <h5 className="text-lg font-semibold text-gray-900">{item.descrizione}</h5>
                              <p className="text-xs text-gray-500">Id {item.id} | TipoLista {item.idTipoLista}</p>
                            </div>
                            <span className="text-xs text-gray-500">{item.steps.length} step</span>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-800">Palette logiche</span>
                              <span className="text-xs text-gray-500">Drag and drop sui step</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {choices.map((choice) => {
                                const value = getLogicValue(item, choice);
                                const isActive = activeSet.has(value);
                                return (
                                  <div
                                    key={`${item.id}-palette-${choice.id}`}
                                    draggable
                                    onDragStart={(event) =>
                                      handleDragStart(event, { itemId: item.id, logicId: value })
                                    }
                                    onClick={() => {
                                      const defaultStep = item.steps[0]?.key;
                                      if (defaultStep) {
                                        toggleLogicInStep(item.id, defaultStep, value);
                                      }
                                    }}
                                    className={`px-3 py-2 rounded-lg border text-xs font-mono cursor-grab active:cursor-grabbing transition-colors ${
                                      isActive
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300'
                                    }`}
                                    title={choice.className}
                                  >
                                    {choice.id}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Click su una card per attivare nello step principale.
                            </div>
                          </div>

                          {item.steps.length === 0 && (
                            <div className="text-sm text-gray-500">Nessuno step configurato.</div>
                          )}

                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {item.steps.map((step) => {
                              const dropKey = `${item.id}-${step.key}`;
                              return (
                                <div
                                  key={dropKey}
                                  onDragOver={(event) => handleDragOver(event, dropKey)}
                                  onDragLeave={() => setDragOverKey(null)}
                                  onDrop={(event) => handleDropOnStep(event, item.id, step.key)}
                                  className={`rounded-xl border p-4 transition-colors ${
                                    dragOverKey === dropKey ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-semibold text-gray-800">{step.key}</div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <button
                                        onClick={() =>
                                          setAllLogicsForStep(item.id, step.key, choices.map((c) => getLogicValue(item, c)))
                                        }
                                        className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                                      >
                                        Tutti
                                      </button>
                                      <button
                                        onClick={() => setAllLogicsForStep(item.id, step.key, [])}
                                        className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                                      >
                                        Nessuno
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 min-h-[48px]">
                                    {step.logics.length === 0 && (
                                      <div className="text-xs text-gray-400">Trascina qui le logiche</div>
                                    )}
                                    {step.logics.map((logicId) => (
                                      <div
                                        key={`${item.id}-${step.key}-${logicId}`}
                                        draggable
                                        onDragStart={(event) =>
                                          handleDragStart(event, {
                                            itemId: item.id,
                                            logicId,
                                            sourceStepKey: step.key,
                                          })
                                        }
                                        onDoubleClick={() => handleRemoveFromStep(item.id, step.key, logicId)}
                                        className="px-3 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white text-xs font-mono cursor-grab active:cursor-grabbing"
                                        title={findLogicClassName(item, choices, logicId)}
                                      >
                                        {getLogicLabel(item, choices, logicId)}
                                      </div>
                                    ))}
                                  </div>
                                  {step.logics.length > 0 && (
                                    <div className="text-[11px] text-gray-500 mt-2">
                                      Doppio click per rimuovere una logica.
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Catalogo completo logiche</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border border-gray-100 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Picking</h5>
                    <div className="space-y-2 text-xs max-h-72 overflow-auto pr-2">
                      {pickingLogics.map((item) => (
                        <div
                          key={`catalog-pick-${item.id}`}
                          className="rounded-md border border-gray-100 p-2 bg-gray-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-gray-900">{item.id}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                activePickingLogics.has(item.className)
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}
                            >
                              {activePickingLogics.has(item.className) ? 'Attiva' : 'Non attiva'}
                            </span>
                          </div>
                          <div className="font-mono text-gray-500 break-words whitespace-pre-wrap leading-snug mt-1 w-full max-w-full">
                            {item.className}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Refilling</h5>
                    <div className="space-y-2 text-xs max-h-72 overflow-auto pr-2">
                      {refillingLogics.map((item) => (
                        <div
                          key={`catalog-ref-${item.id}`}
                          className="rounded-md border border-gray-100 p-2 bg-gray-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-gray-900">{item.id}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                activeRefillingLogics.has(item.className)
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}
                            >
                              {activeRefillingLogics.has(item.className) ? 'Attiva' : 'Non attiva'}
                            </span>
                          </div>
                          <div className="font-mono text-gray-500 break-words whitespace-pre-wrap leading-snug mt-1 w-full max-w-full">
                            {item.className}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terminale Tab */}
          {activeTab === 'terminal' && (
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <Terminal className="w-7 h-7 text-gray-700" />
                    Terminale Realtime
                  </h3>
                  <p className="text-gray-600">
                    Stream eventi liste via WebSocket e riepilogo prenotazioni via polling.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                    WS: {terminalConnected ? 'ON' : 'OFF'}
                  </span>
                  <button
                    onClick={clearTerminal}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Pulisci
                  </button>
                </div>
              </div>

              <div
                ref={terminalRef}
                className="h-96 bg-gray-900 text-green-200 rounded-lg p-4 overflow-y-auto font-mono text-xs space-y-1"
              >
                {terminalLines.length === 0 ? (
                  <div className="text-gray-500">Nessun evento ancora.</div>
                ) : (
                  terminalLines.map((line, index) => (
                    <div key={`term-${index}`}>{line}</div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Database Connesso</p>
                <p className="text-sm font-semibold text-gray-900">
                  PROMAG.dbo.Schedulazione, Prenotazioni
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span>Auto-Refresh: <strong>{autoRefresh ? 'ON (5s)' : 'OFF'}</strong></span>
              </div>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Real-Time Data</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SchedulerSettingsReal;

