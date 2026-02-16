/**
 * Scheduler Settings Page - Complete Configuration UI
 * Configurazione completa dello Scheduler (Prenotatore) EjLog
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RotateCcw, Download, CheckCircle, Clock, Zap, Users } from 'lucide-react';

type LogicItem = {
  id: string;
  className: string;
};

const pickingLogics: LogicItem[] = [
  {
    id: 'PickProdottoIdCorrispondente',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoIdCorrispondente',
  },
  {
    id: 'PickArticoloCorrispondente',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoArticoloCorrispondente',
  },
  {
    id: 'PickLocazioneAbilitataPrelievo',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoInLocazioneAbilitataPrelievo',
  },
  {
    id: 'PickInMagazzinoAmmissibile',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoInMagazzinoAmmissibile',
  },
  {
    id: 'PickQtaDisponibileOut',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoQtaDisponibileOut',
  },
  {
    id: 'PickQtaPrenotataZero',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoQtaPrenotataOutZero',
  },
  {
    id: 'PickLottoCompatibile',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoLottoCorrispondente',
  },
  {
    id: 'PickMatricolaCompatibile',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoMatricolaCorrispondente',
  },
  {
    id: 'PickProdottoNonBloccato',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.prodotto.HqlFilterProdottoNonBloccato',
  },
  {
    id: 'PickVicinanzaPrimoPrelievo',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoVicinanzaWPrimoPrelievo',
  },
  {
    id: 'PickQtaMinore',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoQtaMinore',
  },
  {
    id: 'PickVicinanzaDestinazione',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoVicinanzaDestinazione',
  },
  {
    id: 'PickQtaMassimaInsufficiente',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoQtaMassimaInsufficiente',
  },
  {
    id: 'PickQtaMinimaSufficiente',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoQtaMinimaSufficiente',
  },
  {
    id: 'PickQtaEsatta',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoQtaEsattaPicking',
  },
  {
    id: 'PickFifoDataProduzione',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoDataProduzioneFifo',
  },
  {
    id: 'PickFifoDataScadenza',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoDataScadenzaFifo',
  },
  {
    id: 'PickUdcGiaPrevistaEstrazione',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoGiaPrevistaEstrazioneUdc',
  },
  {
    id: 'PickUdcInBaia',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoInBaiaVertimag',
  },
  {
    id: 'PickInMagazzinoPreferenziale',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoInMagazzinoPreferenziale',
  },
  {
    id: 'PickInMagazzinoAutomatico',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoInMagazzinoAutomatico',
  },
  {
    id: 'PickInMagazzinoATerra',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoInMagazzinoATerra',
  },
  {
    id: 'PickUdcMinore',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoUdcMinore',
  },
  {
    id: 'PickSupportoTopLeftHorizontal',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoPosizioneInSupportoTopLeftHorizontal',
  },
  {
    id: 'PickSupportoTopLeftVertical',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoPosizioneInSupportoTopLeftVertical',
  },
  {
    id: 'PickSupportoTopRightHorizontal',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoPosizioneInSupportoTopRightHorizontal',
  },
  {
    id: 'PickSupportoTopRightVertical',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoPosizioneInSupportoTopRightVertical',
  },
  {
    id: 'PickSupportoBottomLeftHorizontal',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoPosizioneInSupportoBottomLeftHorizontal',
  },
  {
    id: 'PickSupportoBottomLeftVertical',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoPosizioneInSupportoBottomLeftVertical',
  },
  {
    id: 'PickSupportoBottomRightHorizontal',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoPosizioneInSupportoBottomRightHorizontal',
  },
  {
    id: 'PickSupportoBottomRightVertical',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoPosizioneInSupportoBottomRightVertical',
  },
  {
    id: 'PickBilanciaCorridoi',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoBilanciaPrenotatiPerMagazzino',
  },
  {
    id: 'PickCanaleConMenoUdc',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoInCanaleConMenoUdc',
  },
  {
    id: 'PickCanaleUdcGiaPrenotateStessaRiga',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.prodotto.LogicProdottoInCanaleConUdcPrenotateStessaRiga',
  },
];

const refillingLogics: LogicItem[] = [
  {
    id: 'RefilSupportoVuoto',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoVuoto',
  },
  {
    id: 'RefilSupportoNonPieno',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoNonPieno',
  },
  {
    id: 'RefilArticoloPresente',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoRefillingArticoloPresente',
  },
  {
    id: 'RefilLocazioneAbilitataPrelievo',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoInLocazioneAbilitataPrelievo',
  },
  {
    id: 'RefilMagazzinoAmmissibile',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoInMagazzinoAmmissibile',
  },
  {
    id: 'RefilNoSupportiStatici',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoSenzaAssociazioniStatiche',
  },
  {
    id: 'RefilLarghezzaCompatibileArticolo',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoRefillingLarghezzaCompatibileArticolo',
  },
  {
    id: 'RefilProfonditaCompatibileArticolo',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoRefillingProfonditaCompatibileArticolo',
  },
  {
    id: 'RefilSupportiStatici',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.HqlFilterLogicSupportoConAssociazioneStatica',
  },
  {
    id: 'RefilClasseAltezzaArticolo',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.HqlFilterLogicSupportoClasseAltezzaCompatibileArticolo',
  },
  {
    id: 'RefilGestioneLotto',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.HqlFilterLogicSupportoRefillingGestioneLotto',
  },
  {
    id: 'RefilGestioneMatricola',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.hqlfilter.supporto.HqlFilterSupportoRefillingGestioneMatricola',
  },
  {
    id: 'RefilInMagazzinoAutomatico',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoInMagazzinoAutomatico',
  },
  {
    id: 'RefilInMagazzinoATerra',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoInMagazzinoATerra',
  },
  {
    id: 'RefilSupportoBottomToTop',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoPosizioneBottomToTop',
  },
  {
    id: 'RefilSupportoTopToBottom',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoPosizioneTopToBottom',
  },
  {
    id: 'RefilSupportoLeftToRight',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoPosizioneLeftToRight',
  },
  {
    id: 'RefilSupportoRightToLeft',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoPosizioneRightToLeft',
  },
  {
    id: 'RefilUdcConPiuSupportiVuoti',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoUdcConPiuSupportiVuoti',
  },
  {
    id: 'RefilIdUdcAsc',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoIdUdcAsc',
  },
  {
    id: 'RefilIdUdcDesc',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoIdUdcDesc',
  },
  {
    id: 'RefilCoordinataYAsc',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoYAsc',
  },
  {
    id: 'RefilCoordinataYDesc',
    className:
      'com.promag.wms.base.prenotatore.system.criterions.logic.supporto.LogicSupportoYDesc',
  },
];

interface SchedulerConfig {
  enabled: boolean;
  fetchInterval: number;
  numWorkerThreads: number;
  prenotatore: {
    picking: {
      enabled: boolean;
      priority: number;
      maxLists: number;
    };
    refilling: {
      enabled: boolean;
      priority: number;
      maxLists: number;
    };
    inventory: {
      enabled: boolean;
      priority: number;
      maxLists: number;
    };
    transfer: {
      enabled: boolean;
      priority: number;
      maxLists: number;
    };
  };
  performance: {
    maxConcurrentReservations: number;
    reservationTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    metricsInterval: number;
  };
}

export const SchedulerSettings: React.FC = () => {
  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [activeTab, setActiveTab] = useState('core');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduler-config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      } else {
        // Default configuration if not found
        setConfig({
          enabled: true,
          fetchInterval: 5000,
          numWorkerThreads: 4,
          prenotatore: {
            picking: { enabled: true, priority: 1, maxLists: 10 },
            refilling: { enabled: true, priority: 2, maxLists: 5 },
            inventory: { enabled: false, priority: 3, maxLists: 3 },
            transfer: { enabled: false, priority: 4, maxLists: 2 },
          },
          performance: {
            maxConcurrentReservations: 5,
            reservationTimeout: 30000,
            retryAttempts: 3,
            retryDelay: 2000,
          },
          monitoring: {
            logLevel: 'info',
            enableMetrics: true,
            metricsInterval: 60000,
          },
        });
      }
    } catch (error) {
      console.error('Error loading scheduler config:', error);
      // Load default config on error
      setConfig({
        enabled: true,
        fetchInterval: 5000,
        numWorkerThreads: 4,
        prenotatore: {
          picking: { enabled: true, priority: 1, maxLists: 10 },
          refilling: { enabled: true, priority: 2, maxLists: 5 },
          inventory: { enabled: false, priority: 3, maxLists: 3 },
          transfer: { enabled: false, priority: 4, maxLists: 2 },
        },
        performance: {
          maxConcurrentReservations: 5,
          reservationTimeout: 30000,
          retryAttempts: 3,
          retryDelay: 2000,
        },
        monitoring: {
          logLevel: 'info',
          enableMetrics: true,
          metricsInterval: 60000,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/scheduler-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving scheduler config:', error);
      alert('Errore nel salvataggio della configurazione');
    } finally {
      setIsSaving(false);
    }
  };

  const resetConfig = async () => {
    if (!confirm('Sei sicuro di voler ripristinare la configurazione predefinita dello Scheduler?')) return;

    try {
      const response = await fetch('/api/scheduler-config/reset', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        alert('Configurazione Scheduler ripristinata ai valori predefiniti!');
      }
    } catch (error) {
      console.error('Error resetting scheduler config:', error);
    }
  };

  const exportConfig = async () => {
    try {
      const dataStr = JSON.stringify(config, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scheduler-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting scheduler config:', error);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento configurazione Scheduler...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'core', label: 'Base', icon: '⚙️' },
    { id: 'prenotatore', label: 'Prenotatore', icon: '📋' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'monitoring', label: 'Monitoraggio', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurazione Scheduler</h1>
              <p className="text-gray-600">Gestione completa del sistema di prenotazione automatica liste</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportConfig}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
              title="Esporta configurazione"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Esporta</span>
            </button>
            <button
              onClick={resetConfig}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-2 transition-colors"
              title="Ripristina valori predefiniti"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg font-semibold"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Salvato!
                </>
              ) : isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salva
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            config.enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {config.enabled ? '✅ Scheduler Attivo' : '⛔ Scheduler Disabilitato'}
          </span>
          <span className="text-sm text-gray-600">
            • Intervallo: {config.fetchInterval}ms
          </span>
          <span className="text-sm text-gray-600">
            • Worker Threads: {config.numWorkerThreads}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-all whitespace-nowrap rounded-lg flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        {/* CORE TAB */}
        {activeTab === 'core' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              ⚙️ Impostazioni Base
            </h2>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Configura le impostazioni fondamentali dello Scheduler: abilita/disabilita il sistema,
                imposta l'intervallo di polling e il numero di worker threads.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-6 h-6 text-blue-600 rounded"
                id="enabled"
              />
              <label htmlFor="enabled" className="text-gray-900 font-semibold text-lg cursor-pointer">
                Scheduler Abilitato
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Intervallo Fetch (millisecondi)
                </label>
                <input
                  type="number"
                  value={config.fetchInterval}
                  onChange={(e) => setConfig({ ...config, fetchInterval: parseInt(e.target.value) || 5000 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1000"
                  max="60000"
                  placeholder="es. 5000"
                />
                <p className="text-xs text-gray-500 mt-1">Ogni quanto lo scheduler controlla nuove liste (1000-60000ms)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Numero Worker Threads
                </label>
                <input
                  type="number"
                  value={config.numWorkerThreads}
                  onChange={(e) => setConfig({ ...config, numWorkerThreads: parseInt(e.target.value) || 4 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="16"
                  placeholder="es. 4"
                />
                <p className="text-xs text-gray-500 mt-1">Numero di thread paralleli per le prenotazioni (1-16)</p>
            </div>
          </div>

          {/* Logiche Prenotatore */}
          <div className="border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Logiche Prenotatore (Legacy)
              </h3>
              <span className="text-xs text-gray-500">
                Picking: {pickingLogics.length} | Refilling: {refillingLogics.length}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Picking</h4>
                <div className="space-y-2 text-xs">
                  {pickingLogics.map((item) => (
                    <div key={item.id} className="flex flex-col">
                      <span className="font-mono text-gray-900">{item.id}</span>
                      <span className="font-mono text-gray-500">{item.className}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Refilling</h4>
                <div className="space-y-2 text-xs">
                  {refillingLogics.map((item) => (
                    <div key={item.id} className="flex flex-col">
                      <span className="font-mono text-gray-900">{item.id}</span>
                      <span className="font-mono text-gray-500">{item.className}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Le logiche attive reali sono gestite dal DB (elencoLogiche XStream). Questa lista
              mostra le classi disponibili nel legacy XML.
            </div>
          </div>
        </div>
      )}

        {/* PRENOTATORE TAB */}
        {activeTab === 'prenotatore' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              📋 Configurazione Prenotatore
            </h2>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
              <p className="text-purple-800 text-sm">
                Configura il comportamento del prenotatore per ogni tipo di lista: abilita/disabilita,
                imposta priorità e numero massimo di liste gestibili.
              </p>
            </div>

            {/* Picking */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  📦 Picking
                </h3>
                <input
                  type="checkbox"
                  checked={config.prenotatore.picking.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    prenotatore: {
                      ...config.prenotatore,
                      picking: { ...config.prenotatore.picking, enabled: e.target.checked }
                    }
                  })}
                  className="w-6 h-6 text-green-600 rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorità</label>
                  <input
                    type="number"
                    value={config.prenotatore.picking.priority}
                    onChange={(e) => setConfig({
                      ...config,
                      prenotatore: {
                        ...config.prenotatore,
                        picking: { ...config.prenotatore.picking, priority: parseInt(e.target.value) || 1 }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Liste</label>
                  <input
                    type="number"
                    value={config.prenotatore.picking.maxLists}
                    onChange={(e) => setConfig({
                      ...config,
                      prenotatore: {
                        ...config.prenotatore,
                        picking: { ...config.prenotatore.picking, maxLists: parseInt(e.target.value) || 10 }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Refilling */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🔄 Refilling (Rifornimento)
                </h3>
                <input
                  type="checkbox"
                  checked={config.prenotatore.refilling.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    prenotatore: {
                      ...config.prenotatore,
                      refilling: { ...config.prenotatore.refilling, enabled: e.target.checked }
                    }
                  })}
                  className="w-6 h-6 text-green-600 rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorità</label>
                  <input
                    type="number"
                    value={config.prenotatore.refilling.priority}
                    onChange={(e) => setConfig({
                      ...config,
                      prenotatore: {
                        ...config.prenotatore,
                        refilling: { ...config.prenotatore.refilling, priority: parseInt(e.target.value) || 2 }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Liste</label>
                  <input
                    type="number"
                    value={config.prenotatore.refilling.maxLists}
                    onChange={(e) => setConfig({
                      ...config,
                      prenotatore: {
                        ...config.prenotatore,
                        refilling: { ...config.prenotatore.refilling, maxLists: parseInt(e.target.value) || 5 }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  📊 Inventory (Inventario)
                </h3>
                <input
                  type="checkbox"
                  checked={config.prenotatore.inventory.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    prenotatore: {
                      ...config.prenotatore,
                      inventory: { ...config.prenotatore.inventory, enabled: e.target.checked }
                    }
                  })}
                  className="w-6 h-6 text-green-600 rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorità</label>
                  <input
                    type="number"
                    value={config.prenotatore.inventory.priority}
                    onChange={(e) => setConfig({
                      ...config,
                      prenotatore: {
                        ...config.prenotatore,
                        inventory: { ...config.prenotatore.inventory, priority: parseInt(e.target.value) || 3 }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Liste</label>
                  <input
                    type="number"
                    value={config.prenotatore.inventory.maxLists}
                    onChange={(e) => setConfig({
                      ...config,
                      prenotatore: {
                        ...config.prenotatore,
                        inventory: { ...config.prenotatore.inventory, maxLists: parseInt(e.target.value) || 3 }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Transfer */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🔀 Transfer (Trasferimento)
                </h3>
                <input
                  type="checkbox"
                  checked={config.prenotatore.transfer.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    prenotatore: {
                      ...config.prenotatore,
                      transfer: { ...config.prenotatore.transfer, enabled: e.target.checked }
                    }
                  })}
                  className="w-6 h-6 text-green-600 rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorità</label>
                  <input
                    type="number"
                    value={config.prenotatore.transfer.priority}
                    onChange={(e) => setConfig({
                      ...config,
                      prenotatore: {
                        ...config.prenotatore,
                        transfer: { ...config.prenotatore.transfer, priority: parseInt(e.target.value) || 4 }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Liste</label>
                  <input
                    type="number"
                    value={config.prenotatore.transfer.maxLists}
                    onChange={(e) => setConfig({
                      ...config,
                      prenotatore: {
                        ...config.prenotatore,
                        transfer: { ...config.prenotatore.transfer, maxLists: parseInt(e.target.value) || 2 }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              ⚡ Performance e Ottimizzazione
            </h2>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
              <p className="text-orange-800 text-sm">
                Configura i parametri di performance: concorrenza, timeout, retry e ritardi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Prenotazioni Concorrenti
                </label>
                <input
                  type="number"
                  value={config.performance.maxConcurrentReservations}
                  onChange={(e) => setConfig({
                    ...config,
                    performance: {
                      ...config.performance,
                      maxConcurrentReservations: parseInt(e.target.value) || 5
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min="1"
                  max="20"
                />
                <p className="text-xs text-gray-500 mt-1">Numero massimo di prenotazioni simultanee (1-20)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Timeout Prenotazione (ms)
                </label>
                <input
                  type="number"
                  value={config.performance.reservationTimeout}
                  onChange={(e) => setConfig({
                    ...config,
                    performance: {
                      ...config.performance,
                      reservationTimeout: parseInt(e.target.value) || 30000
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min="5000"
                  max="120000"
                />
                <p className="text-xs text-gray-500 mt-1">Timeout per operazione di prenotazione (5000-120000ms)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tentativi Retry
                </label>
                <input
                  type="number"
                  value={config.performance.retryAttempts}
                  onChange={(e) => setConfig({
                    ...config,
                    performance: {
                      ...config.performance,
                      retryAttempts: parseInt(e.target.value) || 3
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Numero di retry in caso di errore (0-10)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ritardo Retry (ms)
                </label>
                <input
                  type="number"
                  value={config.performance.retryDelay}
                  onChange={(e) => setConfig({
                    ...config,
                    performance: {
                      ...config.performance,
                      retryDelay: parseInt(e.target.value) || 2000
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min="500"
                  max="30000"
                />
                <p className="text-xs text-gray-500 mt-1">Attesa tra un retry e l'altro (500-30000ms)</p>
              </div>
            </div>
          </div>
        )}

        {/* MONITORING TAB */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              📊 Monitoraggio e Logging
            </h2>

            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6">
              <p className="text-indigo-800 text-sm">
                Configura il livello di logging e le metriche di monitoraggio dello Scheduler.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Livello Log
                </label>
                <select
                  value={config.monitoring.logLevel}
                  onChange={(e) => setConfig({
                    ...config,
                    monitoring: {
                      ...config.monitoring,
                      logLevel: e.target.value as 'debug' | 'info' | 'warn' | 'error'
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="debug">🔍 Debug (Molto Dettagliato)</option>
                  <option value="info">ℹ️ Info (Standard)</option>
                  <option value="warn">⚠️ Warning (Solo Avvisi)</option>
                  <option value="error">❌ Error (Solo Errori)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Imposta il livello di dettaglio dei log</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={config.monitoring.enableMetrics}
                  onChange={(e) => setConfig({
                    ...config,
                    monitoring: {
                      ...config.monitoring,
                      enableMetrics: e.target.checked
                    }
                  })}
                  className="w-5 h-5 text-indigo-600 rounded"
                  id="enableMetrics"
                />
                <label htmlFor="enableMetrics" className="text-gray-900 font-medium cursor-pointer">
                  Abilita Raccolta Metriche
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Intervallo Metriche (ms)
                </label>
                <input
                  type="number"
                  value={config.monitoring.metricsInterval}
                  onChange={(e) => setConfig({
                    ...config,
                    monitoring: {
                      ...config.monitoring,
                      metricsInterval: parseInt(e.target.value) || 60000
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="10000"
                  max="300000"
                  disabled={!config.monitoring.enableMetrics}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Intervallo di raccolta metriche performance (10000-300000ms)
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer Info */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Backend API: <strong>/api/scheduler-config</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <span>Endpoint: 3 disponibili</span>
            <span>•</span>
            <span>Auto-save: ✅</span>
            <span>•</span>
            <span>Export/Import: ✅</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulerSettings;
