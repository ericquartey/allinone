// ============================================================================
// EJLOG WMS - Settings Scheduler & Prenotatore Page
// Pagina di mappatura completa per scheduler, prenotatore e tipologie settings
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import {
  BoltIcon,
  ClockIcon,
  Cog6ToothIcon,
  ServerIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import {
  disableMultipleSchedulazioni,
  disableSchedulazione,
  enableMultipleSchedulazioni,
  enableSchedulazione,
  createSchedulazione,
  getHostSchedulazioni,
  getSchedulerParamProfiles,
  getSchedulerStatus,
  upsertSchedulerParamProfile,
} from '../../api/scheduler';
import type { HostSchedulazione, SchedulerStatus, Schedulazione } from '../../types/scheduler';

type KeyValueItem = {
  key: string;
  value: string;
  description: string;
};

type FieldItem = {
  name: string;
  type: string;
  description: string;
};

type ActionItem = {
  label: string;
  description: string;
};

type CriterionItem = {
  id: string;
  className: string;
};

type ToggleRuleItem = {
  id: string;
  label: string;
  description: string;
  source: string;
  defaultEnabled: boolean;
};

type ModuleItem = {
  id: string;
  label: string;
  className: string;
  group: string;
  configurator?: string;
};

type HostFunctionItem = {
  id: string;
  label: string;
  funzioneId: string;
  classDb: string;
  classFile: string;
  notes?: string;
};

type ParamProfile = {
  id: string;
  name: string;
  params: string;
  source?: 'backend' | 'local';
};

const schedulerConfigFiles: Array<{
  title: string;
  source: string;
  items: KeyValueItem[];
}> = [
  {
    title: 'Task Scheduler Module',
    source: 'C:\\F_WMS\\EjLog\\config\\wmsTaskScheduler.properties',
    items: [
      {
        key: 'scheduler.ids',
        value: 'MAIN_SCHED',
        description: 'Lista ID schedulatori gestiti dal modulo WmsTaskSchedulerModule',
      },
    ],
  },
  {
    title: 'Task Scheduler Quartz',
    source: 'C:\\F_WMS\\EjLog\\Wmsbase2\\src\\config\\wmsTaskScheduler.quartz.properties',
    items: [
      {
        key: 'org.quartz.scheduler.instanceName',
        value: 'taskScheduler',
        description: 'Nome istanza scheduler dedicato ai task di sistema',
      },
      {
        key: 'org.quartz.scheduler.instanceId',
        value: 'taskScheduler',
        description: 'ID istanza scheduler (statico)',
      },
      {
        key: 'org.quartz.scheduler.rmi.export',
        value: 'false',
        description: 'Disabilita export RMI',
      },
      {
        key: 'org.quartz.scheduler.rmi.proxy',
        value: 'false',
        description: 'Disabilita proxy RMI',
      },
      {
        key: 'org.quartz.threadPool.class',
        value: 'org.quartz.simpl.SimpleThreadPool',
        description: 'Thread pool Quartz',
      },
      {
        key: 'org.quartz.threadPool.threadCount',
        value: '10',
        description: 'Numero thread per task scheduler',
      },
      {
        key: 'org.quartz.jobStore.class',
        value: 'org.quartz.simpl.RAMJobStore',
        description: 'Job store in memoria (no persistence)',
      },
    ],
  },
  {
    title: 'Quartz Scheduler Core',
    source: 'C:\\F_WMS\\EjLog\\Wmsbase2\\src\\config\\wmsQuartzScheduler.properties',
    items: [
      {
        key: 'org.quartz.scheduler.instanceName',
        value: 'scheduler',
        description: 'Nome istanza scheduler generico',
      },
      {
        key: 'org.quartz.scheduler.instanceId',
        value: 'scheduler',
        description: 'ID istanza scheduler generico',
      },
      {
        key: 'org.quartz.scheduler.rmi.export',
        value: 'false',
        description: 'Disabilita export RMI',
      },
      {
        key: 'org.quartz.scheduler.rmi.proxy',
        value: 'false',
        description: 'Disabilita proxy RMI',
      },
      {
        key: 'org.quartz.threadPool.class',
        value: 'org.quartz.simpl.SimpleThreadPool',
        description: 'Thread pool Quartz',
      },
      {
        key: 'org.quartz.threadPool.threadCount',
        value: '5',
        description: 'Numero thread per scheduler core',
      },
      {
        key: 'org.quartz.jobStore.class',
        value: 'org.quartz.simpl.RAMJobStore',
        description: 'Job store in memoria (no persistence)',
      },
    ],
  },
];

const schedulazioneFieldGroups: Array<{
  title: string;
  items: FieldItem[];
}> = [
  {
    title: 'Base',
    items: [
      { name: 'id', type: 'int', description: 'Primary key schedulazione' },
      { name: 'gruppo', type: 'string', description: 'Categoria (system/host/...)' },
      { name: 'nome', type: 'string', description: 'Nome breve task' },
      { name: 'descrizione', type: 'string', description: 'Descrizione task' },
      { name: 'classe', type: 'string', description: 'Classe Java eseguita' },
      { name: 'funzione', type: 'string', description: 'Funzione logica (import/export/...)' },
      { name: 'idSchedulatore', type: 'string', description: 'Associazione a scheduler ID' },
      { name: 'gruppoEsecuzione', type: 'string', description: 'Gruppo di esecuzione' },
      { name: 'parametri', type: 'string', description: 'Parametri job (payload libero)' },
    ],
  },
  {
    title: 'Abilitazione',
    items: [
      { name: 'abilitata', type: 'boolean', description: 'Task abilitato' },
      { name: 'stopped', type: 'boolean', description: 'Task stoppato (manuale/errore)' },
      { name: 'logEsecuzioneJob', type: 'boolean', description: 'Log eventi su LogEventi' },
    ],
  },
  {
    title: 'Trigger Simple',
    items: [
      { name: 'inizio', type: 'datetime', description: 'Data inizio schedulazione' },
      { name: 'fine', type: 'datetime', description: 'Data fine schedulazione' },
      { name: 'intervallo', type: 'int (ms)', description: 'Intervallo tra esecuzioni' },
      { name: 'ripetizioni', type: 'int', description: 'Numero ripetizioni (-1 infinito)' },
      { name: 'parametriTrigger.DAYS', type: 'list<int>', description: 'Giorni abilitati' },
      { name: 'parametriTrigger.TSTART', type: 'HH:mm', description: 'Finestra start' },
      { name: 'parametriTrigger.TEND', type: 'HH:mm', description: 'Finestra end' },
    ],
  },
  {
    title: 'Trigger Cron',
    items: [
      { name: 'cronExpression', type: 'string', description: 'Espressione CRON' },
      {
        name: 'intervallo',
        type: 'int (ms)',
        description: 'Retry in caso errore per schedulazioni CRON',
      },
    ],
  },
  {
    title: 'Runtime',
    items: [
      { name: 'dataUltimaEsecuzione', type: 'datetime', description: 'Ultima esecuzione' },
      {
        name: 'dataProssimaEsecuzione',
        type: 'datetime',
        description: 'Prossima esecuzione prevista',
      },
      { name: 'durataUltimaEsecuzione', type: 'int (ms)', description: 'Durata ultima esecuzione' },
      { name: 'dataUltimoErrore', type: 'datetime', description: 'Ultimo errore registrato' },
      { name: 'dataUltimoInvioMail', type: 'datetime', description: 'Ultimo invio mail errore' },
      { name: 'auxInt01', type: 'int', description: 'nretryPtl (alias)' },
      { name: 'auxInt02', type: 'int', description: 'tempoMedioEsecuzioneMicros' },
      { name: 'auxInt03', type: 'int', description: 'conteggioEsecuzioni' },
    ],
  },
  {
    title: 'Error Handling',
    items: [
      { name: 'messaggioErrore', type: 'string', description: 'Stack trace ultimo errore' },
      { name: 'tentativiInErrore', type: 'int', description: 'Errori consecutivi' },
      { name: 'maxTentativiInErrore', type: 'int', description: 'Max errori prima stop' },
      { name: 'classeAzioneErrore', type: 'string', description: 'Classe azione errore (legacy)' },
      { name: 'inviaMailSuErrore', type: 'boolean', description: 'Invia mail su errore' },
    ],
  },
];

const schedulerActions: ActionItem[] = [
  { label: 'Aggiorna', description: 'Ricarica elenco schedulazioni' },
  { label: 'Esegui ora', description: 'Trigger immediato del job selezionato' },
  { label: 'Interrompi', description: 'Interrompe job interrompibile in esecuzione' },
  { label: 'Abilita', description: 'Abilita schedulazione (se non stopped)' },
  { label: 'Disabilita', description: 'Disabilita schedulazione' },
  { label: 'Aggiungi', description: 'Crea nuova schedulazione' },
  { label: 'Modifica', description: 'Modifica schedulazione esistente' },
  { label: 'Elimina', description: 'Rimuove schedulazione' },
  { label: 'Configura task', description: 'Apre dettagli/parametri task' },
  { label: 'Pulisci messaggio errore', description: 'Reset stack trace errore' },
  { label: 'Imposta storico', description: 'Gestione storico schedulazioni' },
  { label: 'Schedulazioni host', description: 'Gestione schedulazioni host' },
  { label: 'Ripristina job default', description: 'Ripristina job predefiniti' },
  { label: 'Visualizza tutte schedulazioni', description: 'Toggle filtro lista' },
];

const schedulerRules: ToggleRuleItem[] = [
  {
    id: 'noscheduler-arg',
    label: 'ARG_NO_SCHEDULER (modulo disattivo)',
    description:
      'Se presente in WmsLauncher.ARGS, il modulo non inizializza scheduler e non setta instance.',
    source: 'WmsTaskSchedulerModule.init',
    defaultEnabled: true,
  },
  {
    id: 'nohost-arg',
    label: 'ARG_NO_HOST (blocca job host)',
    description:
      'Se presente, i job con @HostLinkJob o gruppo HOST non sono schedulabili.',
    source: 'WmsTaskSchedulerModule.isSchedulazioneSchedulabile',
    defaultEnabled: true,
  },
  {
    id: 'scheduler-ids-filter',
    label: 'Filtro idSchedulatore gestiti',
    description:
      'Solo schedulazioni con idSchedulatore incluso in scheduler.ids vengono caricate e gestite.',
    source: 'WmsTaskSchedulerModule.init / TaskSchedulerPanelBase.aggiornaTabella',
    defaultEnabled: true,
  },
  {
    id: 'abilitata-required',
    label: 'Richiede flag abilitata',
    description: 'Una schedulazione deve avere abilitata=true per essere eseguita.',
    source: 'WmsTaskSchedulerModule.isSchedulazioneSchedulabile',
    defaultEnabled: true,
  },
  {
    id: 'stopped-blocks',
    label: 'Flag stopped blocca esecuzione',
    description: 'Se stopped=true la schedulazione non viene caricata e viene disabilitata.',
    source: 'WmsTaskSchedulerModule.init / checkStatusThread',
    defaultEnabled: true,
  },
  {
    id: 'cron-vs-simple',
    label: 'Trigger CRON vs Simple',
    description:
      'cronExpression presente -> CronTrigger; assente -> SimpleTrigger con intervallo e ripetizioni.',
    source: 'Schedulazione.getTriggerType / WmsTaskSchedulerModule.buildTrigger',
    defaultEnabled: true,
  },
  {
    id: 'simple-days-window',
    label: 'Vincolo giorni e fasce orarie',
    description:
      'Per SimpleTrigger: DAYS e TSTART/TEND definiscono quando il job e schedulabile.',
    source: 'SchedulazioneMethods.isTriggerSchedulazioneReady',
    defaultEnabled: true,
  },
  {
    id: 'midnight-window',
    label: 'Finestra a cavallo mezzanotte',
    description:
      'Se TSTART > TEND, la finestra e valida tra fine e inizio (overnight).',
    source: 'SchedulazioneMethods.isTriggerSchedulazioneReady',
    defaultEnabled: true,
  },
  {
    id: 'sospetta-rule',
    label: 'Schedulazione sospetta',
    description:
      'Se ultima esecuzione supera 2x intervallo o prossima esecuzione scaduta, la schedulazione e sospetta.',
    source: 'SchedulazioneMethods.isSchedulazioneSospetta',
    defaultEnabled: true,
  },
  {
    id: 'configurable-only',
    label: 'Configura solo job configurabili',
    description:
      'Configura task disponibile solo se job ha @ConfigurableJob o @JobConfigurationAction.',
    source: 'TaskSchedulerPanelBase.doActConfiguraTask',
    defaultEnabled: true,
  },
  {
    id: 'cron-validation',
    label: 'Validazione CRON',
    description: 'Le espressioni CRON vengono validate al salvataggio tramite CronTrigger.',
    source: 'TaskSchedulerModificaTaskPanel.doActConferma',
    defaultEnabled: true,
  },
  {
    id: 'ui-show-all',
    label: 'Visualizza tutte schedulazioni',
    description: 'Toggle UI che mostra tutte le schedulazioni, non solo quelle gestite dal modulo.',
    source: 'TaskSchedulerPanelBase.getChckbxVisualizzaTutteSchedulazioni',
    defaultEnabled: true,
  },
];

const hostSchedulerRules: ToggleRuleItem[] = [
  {
    id: 'host-activate-toggle',
    label: 'Attiva/Disattiva schedulazione host',
    description: 'Radio attiva/disattiva definisce stopped.',
    source: 'CronPanel.getCronParam',
    defaultEnabled: true,
  },
  {
    id: 'host-interval',
    label: 'Intervallo con unita tempo',
    description:
      'Intervallo calcolato da valore + unita temporale (secondi/minuti/ore/giorni).',
    source: 'CronPanel.calcolaIntervallo',
    defaultEnabled: true,
  },
  {
    id: 'host-daily',
    label: 'Ogni giorno alle',
    description: 'CRON giornaliero con ora/minuti.',
    source: 'CronPanel.getCronParam',
    defaultEnabled: true,
  },
  {
    id: 'host-weekly',
    label: 'Ogni settimana al',
    description: 'CRON settimanale con giorno + ora/minuti.',
    source: 'CronPanel.getCronParam',
    defaultEnabled: true,
  },
  {
    id: 'host-monthly',
    label: 'Ogni mese il giorno 1',
    description: 'CRON mensile con ora/minuti, giorno fisso 1.',
    source: 'CronPanel.getCronParam',
    defaultEnabled: true,
  },
  {
    id: 'host-swap-class',
    label: 'Selezione classe per tipo scambio',
    description:
      'Classe job scelta in base a ConfigHostMethods (DB/File). Se assente, schedulazione rimossa.',
    source: 'SchedulazioneHostPanel.initSchedulazione',
    defaultEnabled: true,
  },
];

const schedulerRuleIds = schedulerRules.map((rule) => rule.id);
const hostSchedulerRuleIds = hostSchedulerRules.map((rule) => rule.id);

const schedulerModules: ModuleItem[] = [
  {
    id: 'abilita-caricamento-batteria-satellite',
    label: 'Abilita caricamento batteria satellite',
    className:
      'com.promag.wms.base.taskscheduler.jobs.AbilitaCaricamentoBatteriaSatelliteJob',
    group: 'satellite',
  },
  {
    id: 'disabilita-caricamento-batteria-satellite',
    label: 'Disabilita caricamento batteria satellite',
    className:
      'com.promag.wms.base.taskscheduler.jobs.DisabilitaCaricamentoBatteriaSatelliteJob',
    group: 'satellite',
  },
  {
    id: 'backup-entity-su-file',
    label: 'Backup entity su file',
    className: 'com.promag.wms.base.taskscheduler.jobs.BackupEntitySuFile',
    group: 'tools',
    configurator: 'BackupEntitySuFilePanel',
  },
  {
    id: 'batch-executor',
    label: 'Batch executor',
    className: 'com.promag.wms.base.taskscheduler.jobs.BatchExecutorJob',
    group: 'tools',
    configurator: 'BatchExecutorConfigurationPanel',
  },
  {
    id: 'calcolo-classe-rotazione-udc',
    label: 'Calcolo classe rotazione UDC',
    className: 'com.promag.wms.base.taskscheduler.jobs.CalcoloClasseRotazioneUdcJob',
    group: 'core',
  },
  {
    id: 'calcolo-valori-riepilogativi',
    label: 'Calcolo valori riepilogativi',
    className: 'com.promag.wms.base.taskscheduler.jobs.CalcoloValoriRiepilogativiJob',
    group: 'core',
  },
  {
    id: 'cambio-stato-locazioni',
    label: 'Cambio stato locazioni',
    className: 'com.promag.wms.base.taskscheduler.jobs.CambioStatoLocazioniJob',
    group: 'core',
    configurator: 'CambioStatoLocazioniJobConfigurationPanel',
  },
  {
    id: 'check-for-updates',
    label: 'Check for updates',
    className: 'com.promag.wms.base.taskscheduler.jobs.CheckForUpdatesJob',
    group: 'maintenance',
  },
  {
    id: 'controllo-compattamento-magazzino',
    label: 'Controllo compattamento magazzino',
    className:
      'com.promag.wms.base.taskscheduler.jobs.ControlloStatoCompattamentoMagazzinoJob',
    group: 'maintenance',
  },
  {
    id: 'converti-importazione-navision',
    label: 'Converti importazione liste Navision',
    className:
      'com.promag.wms.base.taskscheduler.jobs.ConvertiTabellaImportazioneListeNavisionJob',
    group: 'host',
    configurator: 'ConvertiTabellaImportazioneListeNavisionPanel',
  },
  {
    id: 'eliminazione-liste-default',
    label: 'Eliminazione liste default',
    className: 'com.promag.wms.base.taskscheduler.jobs.EliminazioneListeDefaultJob',
    group: 'maintenance',
  },
  {
    id: 'esegui-report-personalizzati',
    label: 'Esegui report personalizzati',
    className: 'com.promag.wms.base.taskscheduler.jobs.EseguiReportPersonalizzatiJob',
    group: 'report',
    configurator: 'EseguiReportPersonalizzatiConfigurationPanel',
  },
  {
    id: 'esporta-esiti-liste-db',
    label: 'Esporta esiti liste (DB)',
    className: 'com.promag.wms.base.taskscheduler.jobs.EsportaEsitiListaDatabaseHostJob',
    group: 'host',
  },
  {
    id: 'esporta-esiti-liste-file',
    label: 'Esporta esiti liste (file)',
    className: 'com.promag.wms.base.taskscheduler.jobs.EsportaEsitiListaTestoHostJob',
    group: 'host',
  },
  {
    id: 'esporta-giacenza-file',
    label: 'Esporta giacenza (file)',
    className: 'com.promag.wms.base.taskscheduler.jobs.EsportaGiacenzaTestoHostJob',
    group: 'host',
  },
  {
    id: 'esporta-log-operazioni',
    label: 'Esporta log operazioni',
    className: 'com.promag.wms.base.taskscheduler.jobs.EsportaLogOperazioniJob',
    group: 'host',
    configurator: 'EsportaLogOperazioniJobConfigurationPanel',
  },
  {
    id: 'esporta-movimenti-db',
    label: 'Esporta movimenti (DB)',
    className: 'com.promag.wms.base.taskscheduler.jobs.EsportaMovimentiDatabaseHostJob',
    group: 'host',
  },
  {
    id: 'esporta-movimenti-file',
    label: 'Esporta movimenti (file)',
    className: 'com.promag.wms.base.taskscheduler.jobs.EsportaMovimentiTestoHostJob',
    group: 'host',
  },
  {
    id: 'esporta-rettifiche-su-lista',
    label: 'Esporta rettifiche su lista',
    className: 'com.promag.wms.base.taskscheduler.jobs.EsportaRettificheSuListaJob',
    group: 'host',
  },
  {
    id: 'gestione-udc-non-associate',
    label: 'Gestione UDC non associate',
    className: 'com.promag.wms.base.taskscheduler.jobs.GestioneUdcNonAssociateJob',
    group: 'maintenance',
    configurator: 'GestioneUdcNonAssociateConfigurationPanel',
  },
  {
    id: 'importa-anagrafica-db',
    label: 'Importa anagrafica (DB)',
    className: 'com.promag.wms.base.taskscheduler.jobs.ImportaAnagraficaDatabaseHostJob',
    group: 'host',
  },
  {
    id: 'importa-anagrafica-file',
    label: 'Importa anagrafica (file)',
    className: 'com.promag.wms.base.taskscheduler.jobs.ImportaAnagraficaTestoHostJob',
    group: 'host',
  },
  {
    id: 'importa-liste-db',
    label: 'Importa liste (DB)',
    className: 'com.promag.wms.base.taskscheduler.jobs.ImportaListeDatabaseHostJob',
    group: 'host',
  },
  {
    id: 'importa-liste-file',
    label: 'Importa liste (file)',
    className: 'com.promag.wms.base.taskscheduler.jobs.ImportaListeTextJob',
    group: 'host',
  },
  {
    id: 'importa-anagrafica-navision',
    label: 'Importa anagrafica da Navision',
    className: 'com.promag.wms.base.taskscheduler.jobs.custom.ImportaAnagraficaDaNavisionJob',
    group: 'custom',
  },
  {
    id: 'invia-email-report-personalizzati',
    label: 'Invia email report personalizzati',
    className: 'com.promag.wms.base.taskscheduler.jobs.InviaPerEmailReportPersonalizzati',
    group: 'report',
    configurator: 'InviaPerEmailReportPersonalizzatiPanel',
  },
  {
    id: 'invia-report-grafico',
    label: 'Invia report grafico',
    className: 'com.promag.wms.base.taskscheduler.jobs.invioReportGrafico.InviaReportGraficoJob',
    group: 'report',
  },
  {
    id: 'invia-report-grafico-itext',
    label: 'Invia report grafico (iText)',
    className:
      'com.promag.wms.base.taskscheduler.jobs.invioReportGrafico.InviaReportGraficoByITextJob',
    group: 'report',
    configurator: 'ReportGraficoConfiguration',
  },
  {
    id: 'log-numero-messaggi-prenotatore',
    label: 'Log numero messaggi prenotatore',
    className: 'com.promag.wms.base.taskscheduler.jobs.LogNumeroMessaggiPrenotatoreJob',
    group: 'prenotatore',
  },
  {
    id: 'pulisci-dati-host',
    label: 'Pulisci dati host (DB)',
    className: 'com.promag.wms.base.taskscheduler.jobs.PulisciDatiHostJob',
    group: 'host',
    configurator: 'PulisciDatiHostJobConfigurationPanel',
  },
  {
    id: 'pulisci-dati-host-file',
    label: 'Pulisci dati host (file)',
    className: 'com.promag.wms.base.taskscheduler.jobs.PulisciDatiTextJob',
    group: 'host',
  },
  {
    id: 'pulisci-tabelle',
    label: 'Pulisci tabelle',
    className: 'com.promag.wms.base.taskscheduler.jobs.PulisciTabelleJob',
    group: 'maintenance',
    configurator: 'PulisciTabelleJobConfigurationAction',
  },
  {
    id: 'sql-executor-and-save',
    label: 'SQL executor + save file',
    className: 'com.promag.wms.base.taskscheduler.jobs.SqlExecutorAndSaveFileTxtJob',
    group: 'tools',
    configurator: 'SqlExecutorAndSaveFileConfigurationPanel',
  },
  {
    id: 'sql-executor',
    label: 'SQL executor',
    className: 'com.promag.wms.base.taskscheduler.jobs.SqlExecutorJob',
    group: 'tools',
    configurator: 'SqlExecutorConfigurationPanel',
  },
  {
    id: 'storicizza-valori-riepilogativi',
    label: 'Storicizza valori riepilogativi',
    className: 'com.promag.wms.base.taskscheduler.jobs.StoricizzaValoriRiepilogativiJob',
    group: 'core',
  },
  {
    id: 'verifica-replica',
    label: 'Verifica replica',
    className: 'com.promag.wms.base.taskscheduler.jobs.VerificaReplicaJob',
    group: 'maintenance',
    configurator: 'VerificaReplicaPanel',
  },
  {
    id: 'wms-reboot',
    label: 'WMS reboot',
    className: 'com.promag.wms.base.taskscheduler.jobs.WmsRebootJob',
    group: 'maintenance',
    configurator: 'WmsRebootJobConfigurationPanel',
  },
];

const schedulerModuleIds = schedulerModules.map((module) => module.id);

const hostFunctionModules: HostFunctionItem[] = [
  {
    id: 'import-items',
    label: 'Importa anagrafica (items)',
    funzioneId: 'IMPORT_ITEMS',
    classDb: 'com.promag.wms.base.taskscheduler.jobs.ImportaAnagraficaDatabaseHostJob',
    classFile: 'com.promag.wms.base.taskscheduler.jobs.ImportaAnagraficaTestoHostJob',
  },
  {
    id: 'import-lists',
    label: 'Importa liste',
    funzioneId: 'IMPORT_LISTS',
    classDb: 'com.promag.wms.base.taskscheduler.jobs.ImportaListeDatabaseHostJob',
    classFile: 'com.promag.wms.base.taskscheduler.jobs.ImportaListeTextJob',
  },
  {
    id: 'export-lists-result',
    label: 'Esporta esiti liste',
    funzioneId: 'EXPORT_LISTS_RESULT',
    classDb: 'com.promag.wms.base.taskscheduler.jobs.EsportaEsitiListaDatabaseHostJob',
    classFile: 'com.promag.wms.base.taskscheduler.jobs.EsportaEsitiListaTestoHostJob',
  },
  {
    id: 'export-movements',
    label: 'Esporta movimenti',
    funzioneId: 'EXPORT_MOVEMENTS',
    classDb: 'com.promag.wms.base.taskscheduler.jobs.EsportaMovimentiDatabaseHostJob',
    classFile: 'com.promag.wms.base.taskscheduler.jobs.EsportaMovimentiTestoHostJob',
  },
  {
    id: 'export-stock-on-hand',
    label: 'Esporta giacenza',
    funzioneId: 'EXPORT_STOCKONHAND',
    classDb: 'N/D',
    classFile: 'com.promag.wms.base.taskscheduler.jobs.EsportaGiacenzaTestoHostJob',
    notes: 'Disponibile solo in modalita scambio file.',
  },
  {
    id: 'host-cleaning',
    label: 'Pulizia dati host',
    funzioneId: 'HOST_CLEANING',
    classDb: 'com.promag.wms.base.taskscheduler.jobs.PulisciDatiHostJob',
    classFile: 'com.promag.wms.base.taskscheduler.jobs.PulisciDatiTextJob',
    notes: 'Parametri: NUM_DAYS_ONLINE, TABLES.',
  },
  {
    id: 'table-cleaning',
    label: 'Pulizia tabelle',
    funzioneId: 'TABLE_CLEANING',
    classDb: 'com.promag.wms.base.taskscheduler.jobs.PulisciTabelleJob',
    classFile: 'com.promag.wms.base.taskscheduler.jobs.PulisciTabelleJob',
  },
];

const hostFunctionIds = hostFunctionModules.map((module) => module.id);

const prenotatoreConfig: Array<{
  title: string;
  source: string;
  items: KeyValueItem[];
}> = [
  {
    title: 'Reservation Handler Properties',
    source: 'C:\\F_WMS\\EjLog\\config\\wmsReservationHandler.properties',
    items: [
      {
        key: 'server.port',
        value: '7072',
        description: 'Porta TCP server prenotatore',
      },
      {
        key: 'serverraw.port',
        value: '7073',
        description: 'Porta TCP server raw',
      },
      {
        key: 'reservationHandler.reserveWaitingLists',
        value: 'true',
        description: 'Prenota liste in attesa',
      },
    ],
  },
];

const prenotatoreRuntime: FieldItem[] = [
  {
    name: 'PRENOTATORE_ID',
    type: 'const',
    description: 'Identificativo client prenotatore: PRNT',
  },
  {
    name: 'MessageFetcher',
    type: 'service',
    description: 'Legge messaggi MQ destinati al prenotatore',
  },
  {
    name: 'MainProcessor',
    type: 'service',
    description: 'Elabora e prenota le liste',
  },
  {
    name: 'NetServer (TCP)',
    type: 'service',
    description: 'Server TCP per client prenotatore',
  },
  {
    name: 'NetServerRaw (TCP)',
    type: 'service',
    description: 'Server TCP raw per integrazioni',
  },
];

const prenotatoreActions: ActionItem[] = [
  { label: 'Force cycle', description: 'Forza ciclo fetcher + processor' },
  { label: 'Pausa fetcher', description: 'Sospende lettura messaggi' },
  { label: 'Riprendi fetcher', description: 'Riprende lettura messaggi' },
  { label: 'Pausa processor', description: 'Sospende elaborazione' },
  { label: 'Riprendi processor', description: 'Riprende elaborazione' },
  { label: 'Gestione tipo gestione articolo', description: 'Apre pannello tipologie' },
  { label: 'Client connessi', description: 'Visualizza numero e lista client' },
];

const prenotatoreJobs: FieldItem[] = [
  {
    name: 'VerificaTrasloInAllarmeJob',
    type: 'SimpleTrigger',
    description: 'Esecuzione ogni 10s (scheduler core)',
  },
  {
    name: 'LogStatiFunzionamentoJob',
    type: 'CronTrigger',
    description: 'Esecuzione ogni 1h (scheduler core)',
  },
];

const tipoGestioneArticoloFields: FieldItem[] = [
  { name: 'id', type: 'int', description: 'Primary key tipologia' },
  { name: 'tipoLista', type: 'FK', description: 'Associazione a tipo lista' },
  { name: 'descrizione', type: 'string', description: 'Descrizione tipologia' },
  {
    name: 'elencoLogiche',
    type: 'XStream XML',
    description: 'Configurazione step logiche prenotazione',
  },
  {
    name: 'elencoFiltri',
    type: 'string',
    description: 'Formato configurazione (valore XSTREAM)',
  },
];

const pickingCriteria: CriterionItem[] = [
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

const refillingCriteria: CriterionItem[] = [
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

export default function SettingsSchedulerPrenotatorePage() {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [hostSchedulazioni, setHostSchedulazioni] = useState<HostSchedulazione[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ParamProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileParams, setProfileParams] = useState('');
  const [selectedSchedulerProfileId, setSelectedSchedulerProfileId] = useState<string | null>(null);
  const [selectedHostProfileId, setSelectedHostProfileId] = useState<string | null>(null);

  const [selectedSchedulerRuleIds, setSelectedSchedulerRuleIds] = useState<string[]>([]);
  const [selectedHostRuleIds, setSelectedHostRuleIds] = useState<string[]>([]);
  const [selectedSchedulerModuleIds, setSelectedSchedulerModuleIds] = useState<string[]>([]);
  const [selectedHostFunctionIds, setSelectedHostFunctionIds] = useState<string[]>([]);

  const [schedulerRuleEnabled, setSchedulerRuleEnabled] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    schedulerRules.forEach((rule) => {
      initial[rule.id] = rule.defaultEnabled;
    });
    return initial;
  });
  const [hostRuleEnabled, setHostRuleEnabled] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    hostSchedulerRules.forEach((rule) => {
      initial[rule.id] = rule.defaultEnabled;
    });
    return initial;
  });
  const [schedulerModuleEnabled, setSchedulerModuleEnabled] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    schedulerModules.forEach((module) => {
      initial[module.id] = false;
    });
    return initial;
  });
  const [hostFunctionEnabled, setHostFunctionEnabled] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    hostFunctionModules.forEach((module) => {
      initial[module.id] = false;
    });
    return initial;
  });

  const schedulazioni = schedulerStatus?.schedulazioni ?? [];
  const defaultSchedulerId = schedulerStatus?.schedulerIds?.[0] ?? 'MAIN_SCHED';

  const getSimpleClassName = (className: string) => {
    const parts = className.split('.');
    return parts[parts.length - 1] || className;
  };
  const normalizeParams = (value: string) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(';');
  const mergeProfiles = (backend: ParamProfile[], local: ParamProfile[]) => {
    const map = new Map<string, ParamProfile>();
    backend.forEach((profile) => map.set(profile.name, profile));
    local.forEach((profile) => map.set(profile.name, profile));
    return Array.from(map.values());
  };

  const schedulazioniByClass = useMemo(() => {
    const map = new Map<string, Schedulazione>();
    schedulazioni.forEach((schedulazione) => {
      map.set(schedulazione.classe, schedulazione);
    });
    return map;
  }, [schedulazioni]);

  const hostSchedulazioniByFunzione = useMemo(() => {
    const map = new Map<string, HostSchedulazione>();
    hostSchedulazioni.forEach((schedulazione) => {
      if (schedulazione.funzione) {
        map.set(schedulazione.funzione, schedulazione);
      }
    });
    return map;
  }, [hostSchedulazioni]);

  const loadSchedulerData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const status = await getSchedulerStatus();
      setSchedulerStatus(status);

      try {
        const hostData = await getHostSchedulazioni();
        setHostSchedulazioni(hostData);
      } catch {
        setHostSchedulazioni([]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Errore nel caricamento dati');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackendProfiles = async (localProfiles: ParamProfile[]) => {
    try {
      const backendProfiles = await getSchedulerParamProfiles();
      const normalized = backendProfiles.map((profile) => ({
        id: profile.id || `backend-${profile.name}`,
        name: profile.name,
        params: profile.params,
        source: 'backend' as const,
      }));
      setProfiles(mergeProfiles(normalized, localProfiles));
    } catch {
      setProfiles(localProfiles);
    }
  };

  useEffect(() => {
    let localProfiles: ParamProfile[] = [];
    const saved = localStorage.getItem('ejlog.schedulerProfiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ParamProfile[];
        localProfiles = parsed.map((profile) => ({
          ...profile,
          source: 'local',
        }));
      } catch {
        localProfiles = [];
      }
    }
    setProfiles(localProfiles);
    void loadBackendProfiles(localProfiles);
    void loadSchedulerData();
  }, []);

  useEffect(() => {
    const localProfiles = profiles.filter((profile) => profile.source !== 'backend');
    localStorage.setItem('ejlog.schedulerProfiles', JSON.stringify(localProfiles));
  }, [profiles]);

  useEffect(() => {
    const active = profiles.find((item) => item.id === activeProfileId);
    if (active) {
      setProfileName(active.name);
      setProfileParams(active.params);
    }
  }, [activeProfileId, profiles]);

  useEffect(() => {
    setSchedulerModuleEnabled((prev) => {
      const next = { ...prev };
      schedulerModules.forEach((module) => {
        const schedulazione = schedulazioniByClass.get(module.className);
        next[module.id] = Boolean(schedulazione && schedulazione.abilitata && !schedulazione.stopped);
      });
      return next;
    });
  }, [schedulazioniByClass]);

  useEffect(() => {
    setHostFunctionEnabled((prev) => {
      const next = { ...prev };
      hostFunctionModules.forEach((module) => {
        const schedulazione =
          hostSchedulazioniByFunzione.get(module.funzioneId) ||
          schedulazioni.find((item) => item.funzione === module.funzioneId);
        next[module.id] = Boolean(schedulazione && schedulazione.abilitata && !schedulazione.stopped);
      });
      return next;
    });
  }, [hostSchedulazioniByFunzione, schedulazioni]);

  const getSchedulerModuleSchedulazione = (moduleId: string) => {
    const module = schedulerModules.find((item) => item.id === moduleId);
    if (!module) return null;
    return schedulazioniByClass.get(module.className) ?? null;
  };

  const getHostFunctionSchedulazione = (moduleId: string) => {
    const module = hostFunctionModules.find((item) => item.id === moduleId);
    if (!module) return null;
    return (
      hostSchedulazioniByFunzione.get(module.funzioneId) ||
      schedulazioni.find((item) => item.funzione === module.funzioneId) ||
      null
    );
  };

  const getProfileParams = (profileId: string | null) => {
    if (!profileId) return '';
    const profile = profiles.find((item) => item.id === profileId);
    return profile?.params ?? '';
  };

  const saveProfile = () => {
    setErrorMessage(null);
    const name = profileName.trim();
    const params = normalizeParams(profileParams);

    if (!name) {
      setErrorMessage('Inserire un nome profilo');
      return;
    }

    setProfiles((prev) => {
      const existingIndex = prev.findIndex((item) => item.name === name);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          params,
          source: 'local',
        };
        return next;
      }
      return [
        ...prev,
        {
          id: `${Date.now()}`,
          name,
          params,
          source: 'local',
        },
      ];
    });
  };

  const saveProfileToBackend = async () => {
    setErrorMessage(null);
    const name = profileName.trim();
    const params = normalizeParams(profileParams);

    if (!name) {
      setErrorMessage('Inserire un nome profilo');
      return;
    }

    try {
      await upsertSchedulerParamProfile({ name, params });
      const localProfiles = profiles.filter((profile) => profile.source !== 'backend');
      await loadBackendProfiles(localProfiles);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Errore salvataggio backend');
    }
  };

  const deleteProfile = () => {
    if (!activeProfileId) return;
    setProfiles((prev) => prev.filter((item) => item.id !== activeProfileId));
    setActiveProfileId(null);
    setProfileName('');
    setProfileParams('');
  };

  const applyProfileToScheduler = () => {
    if (!activeProfileId) return;
    setSelectedSchedulerProfileId(activeProfileId);
  };

  const applyProfileToHost = () => {
    if (!activeProfileId) return;
    setSelectedHostProfileId(activeProfileId);
  };

  const ensureSchedulerModuleExists = async (moduleId: string) => {
    const module = schedulerModules.find((item) => item.id === moduleId);
    if (!module) return null;

    const existing = getSchedulerModuleSchedulazione(moduleId);
    if (existing) return existing;

    try {
      const created = await createSchedulazione({
        nome: getSimpleClassName(module.className),
        descrizione: module.label,
        classe: module.className,
        idSchedulatore: defaultSchedulerId,
        gruppo: module.group === 'host' ? 'HOST' : undefined,
        parametri: getProfileParams(selectedSchedulerProfileId),
        intervallo: 60000,
        ripetizioni: -1,
        stopped: true,
        abilitata: true,
      });
      return created;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Errore nella creazione modulo');
      return null;
    }
  };

  const ensureHostFunctionExists = async (moduleId: string) => {
    const module = hostFunctionModules.find((item) => item.id === moduleId);
    if (!module) return null;

    const existing = getHostFunctionSchedulazione(moduleId);
    if (existing) return existing;

    const className = module.classDb !== 'N/D' ? module.classDb : module.classFile;

    try {
      const created = await createSchedulazione({
        nome: module.funzioneId,
        descrizione: module.label,
        classe: className,
        idSchedulatore: defaultSchedulerId,
        gruppo: 'HOST',
        funzione: module.funzioneId,
        parametri: getProfileParams(selectedHostProfileId),
        intervallo: 60000,
        ripetizioni: -1,
        stopped: true,
        abilitata: true,
      });
      return created;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Errore nella creazione funzione');
      return null;
    }
  };

  const handleToggleSchedulerModule = async (moduleId: string) => {
    setErrorMessage(null);
    const schedulazione = await ensureSchedulerModuleExists(moduleId);
    if (!schedulazione) return;

    try {
      if (schedulazione.abilitata && !schedulazione.stopped) {
        await disableSchedulazione(schedulazione.id);
      } else {
        await enableSchedulazione(schedulazione.id);
      }
      await loadSchedulerData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Errore nell\'aggiornamento');
    }
  };

  const handleToggleHostFunction = async (moduleId: string) => {
    setErrorMessage(null);
    const schedulazione = await ensureHostFunctionExists(moduleId);
    if (!schedulazione) return;

    try {
      if (schedulazione.abilitata && !schedulazione.stopped) {
        await disableSchedulazione(schedulazione.id);
      } else {
        await enableSchedulazione(schedulazione.id);
      }
      await loadSchedulerData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Errore nell\'aggiornamento');
    }
  };

  const handleBulkSchedulerModules = async (enable: boolean) => {
    setErrorMessage(null);
    let schedulazioniToProcess: Schedulazione[] = [];

    if (enable) {
      const created = await Promise.all(
        selectedSchedulerModuleIds.map((id) => ensureSchedulerModuleExists(id))
      );
      schedulazioniToProcess = created.filter(
        (schedulazione): schedulazione is Schedulazione => Boolean(schedulazione)
      );
    } else {
      schedulazioniToProcess = selectedSchedulerModuleIds
        .map((id) => getSchedulerModuleSchedulazione(id))
        .filter((schedulazione): schedulazione is Schedulazione => Boolean(schedulazione));
    }

    const schedulazioneIds = schedulazioniToProcess.map((schedulazione) => schedulazione.id);

    if (schedulazioneIds.length === 0) {
      setErrorMessage('Nessuna schedulazione disponibile per l\'azione selezionata');
      return;
    }

    try {
      if (enable) {
        await enableMultipleSchedulazioni(schedulazioneIds);
      } else {
        await disableMultipleSchedulazioni(schedulazioneIds);
      }
      await loadSchedulerData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Errore nell\'aggiornamento multiplo');
    }
  };

  const handleBulkHostFunctions = async (enable: boolean) => {
    setErrorMessage(null);
    let schedulazioniToProcess: Schedulazione[] = [];

    if (enable) {
      const created = await Promise.all(
        selectedHostFunctionIds.map((id) => ensureHostFunctionExists(id))
      );
      schedulazioniToProcess = created.filter(
        (schedulazione): schedulazione is Schedulazione => Boolean(schedulazione)
      );
    } else {
      schedulazioniToProcess = selectedHostFunctionIds
        .map((id) => getHostFunctionSchedulazione(id))
        .filter((schedulazione): schedulazione is Schedulazione => Boolean(schedulazione));
    }

    const schedulazioneIds = schedulazioniToProcess.map((schedulazione) => schedulazione.id);

    if (schedulazioneIds.length === 0) {
      setErrorMessage('Nessuna schedulazione host disponibile per l\'azione selezionata');
      return;
    }

    try {
      if (enable) {
        await enableMultipleSchedulazioni(schedulazioneIds);
      } else {
        await disableMultipleSchedulazioni(schedulazioneIds);
      }
      await loadSchedulerData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Errore nell\'aggiornamento multiplo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <ClockIcon className="h-12 w-12 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Scheduler e Prenotatore - Mappa Completa
              </h1>
              <p className="text-gray-600 mt-1">
                Analisi completa di settings, tipologie e funzioni dal progetto EjLog.
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Include configurazioni di scheduler, campi schedulazioni, azioni UI,
            impostazioni prenotatore e criteri disponibili per picking/refilling.
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <span>
              Backend scheduler:
              <span className="ml-1 font-semibold text-gray-900">
                {isLoading ? 'Caricamento...' : schedulerStatus?.success ? 'OK' : 'N/D'}
              </span>
            </span>
            {schedulerStatus?.schedulerIds && schedulerStatus.schedulerIds.length > 0 && (
              <span>
                Scheduler IDs:
                <span className="ml-1 font-mono text-gray-700">
                  {schedulerStatus.schedulerIds.join(', ')}
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={loadSchedulerData}
              className="px-2 py-1 rounded border border-gray-200 text-gray-700"
            >
              Ricarica dati
            </button>
            {errorMessage && (
              <span className="text-red-600 font-medium">{errorMessage}</span>
            )}
          </div>
        </div>

        {/* Param Profiles */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Profili Parametri</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Editor Profilo</h3>
              <label className="text-xs font-semibold text-gray-600">Profili salvati</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded px-2 py-1 text-sm"
                value={activeProfileId ?? ''}
                onChange={(e) => setActiveProfileId(e.target.value || null)}
              >
                <option value="">-- Seleziona profilo --</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                    {profile.source === 'backend' ? ' [backend]' : ''}
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-600">Nome profilo</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded px-2 py-1 text-sm"
                  placeholder="Esempio: Default import"
                />
              </div>
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-600">Parametri</label>
                <textarea
                  value={profileParams}
                  onChange={(e) => setProfileParams(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded px-2 py-1 text-sm h-28 font-mono"
                  placeholder="key=value;key2=value2"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={saveProfile}
                  className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 bg-emerald-50"
                >
                  Salva profilo
                </button>
                <button
                  type="button"
                  onClick={() => void saveProfileToBackend()}
                  className="px-2 py-1 rounded border border-blue-200 text-blue-700 bg-blue-50"
                >
                  Salva backend
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void loadBackendProfiles(profiles.filter((profile) => profile.source !== 'backend'))
                  }
                  className="px-2 py-1 rounded border border-gray-200 text-gray-700"
                >
                  Ricarica backend
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileName('');
                    setProfileParams('');
                    setActiveProfileId(null);
                  }}
                  className="px-2 py-1 rounded border border-gray-200 text-gray-700"
                >
                  Pulisci
                </button>
                <button
                  type="button"
                  onClick={deleteProfile}
                  className="px-2 py-1 rounded border border-red-200 text-red-700 bg-red-50"
                >
                  Elimina profilo
                </button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Profilo per Moduli Scheduler</h3>
              <label className="text-xs font-semibold text-gray-600">Profilo attivo</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded px-2 py-1 text-sm"
                value={selectedSchedulerProfileId ?? ''}
                onChange={(e) => setSelectedSchedulerProfileId(e.target.value || null)}
              >
                <option value="">-- Nessun profilo --</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                    {profile.source === 'backend' ? ' [backend]' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyProfileToScheduler}
                className="mt-3 px-2 py-1 rounded border border-gray-200 text-gray-700 text-xs"
              >
                Applica profilo editor ai moduli
              </button>
              <div className="mt-2 text-xs text-gray-500">
                Parametri usati in creazione automatica schedulazioni.
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Profilo per Funzioni Host</h3>
              <label className="text-xs font-semibold text-gray-600">Profilo attivo</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded px-2 py-1 text-sm"
                value={selectedHostProfileId ?? ''}
                onChange={(e) => setSelectedHostProfileId(e.target.value || null)}
              >
                <option value="">-- Nessun profilo --</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                    {profile.source === 'backend' ? ' [backend]' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyProfileToHost}
                className="mt-3 px-2 py-1 rounded border border-gray-200 text-gray-700 text-xs"
              >
                Applica profilo editor alle funzioni host
              </button>
              <div className="mt-2 text-xs text-gray-500">
                Utile per parametri di pulizia host o import/export specifici.
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Formato parametri: `key=value;key2=value2`. Ogni riga viene convertita in `;`.
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Profili backend letti da `/api/scheduler/profiles` e uniti ai profili locali.
          </div>
        </div>

        {/* Scheduler Config */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ClockIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Configurazione Scheduler</h2>
          </div>
          <div className="space-y-6">
            {schedulerConfigFiles.map((section) => (
              <div key={section.title} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  <span className="text-xs font-mono text-gray-500">{section.source}</span>
                </div>
                <div className="overflow-hidden border border-gray-100 rounded-lg">
                  <div className="grid grid-cols-12 bg-gray-50 text-xs font-semibold text-gray-700">
                    <div className="col-span-4 px-3 py-2">Chiave</div>
                    <div className="col-span-3 px-3 py-2">Valore</div>
                    <div className="col-span-5 px-3 py-2">Descrizione</div>
                  </div>
                  {section.items.map((item) => (
                    <div
                      key={item.key}
                      className="grid grid-cols-12 border-t border-gray-100 text-sm"
                    >
                      <div className="col-span-4 px-3 py-2 font-mono text-gray-700">
                        {item.key}
                      </div>
                      <div className="col-span-3 px-3 py-2 font-mono text-gray-900">
                        {item.value}
                      </div>
                      <div className="col-span-5 px-3 py-2 text-gray-600">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Scheduler Fields */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Campi Schedulazione</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schedulazioneFieldGroups.map((group) => (
              <div key={group.title} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{group.title}</h3>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.name} className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-mono text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Nota: i trigger Simple usano parametriTrigger con chiavi DAYS, TSTART, TEND.
            Il tipo trigger e determinato dalla presenza di cronExpression.
          </div>
        </div>

        {/* Scheduler Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Azioni Scheduler (UI)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schedulerActions.map((action) => (
              <div
                key={action.label}
                className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
              >
                <span className="font-medium text-gray-900">{action.label}</span>
                <span className="text-sm text-gray-600">{action.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduler Rules */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Regole Scheduler (Motore + GUI Swing)
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Regole Motore Scheduler</h3>
                <span className="text-xs text-gray-500">
                  Selezionati: {selectedSchedulerRuleIds.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSchedulerRuleIds(schedulerRuleIds)}
                  className="px-2 py-1 rounded border border-gray-200 text-gray-700"
                >
                  Seleziona tutti
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSchedulerRuleIds([])}
                  className="px-2 py-1 rounded border border-gray-200 text-gray-700"
                >
                  Deseleziona
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSchedulerRuleEnabled((prev) => {
                      const next = { ...prev };
                      selectedSchedulerRuleIds.forEach((id) => {
                        next[id] = true;
                      });
                      return next;
                    })
                  }
                  className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 bg-emerald-50"
                >
                  Attiva selezionati
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSchedulerRuleEnabled((prev) => {
                      const next = { ...prev };
                      selectedSchedulerRuleIds.forEach((id) => {
                        next[id] = false;
                      });
                      return next;
                    })
                  }
                  className="px-2 py-1 rounded border border-gray-200 text-gray-600 bg-gray-50"
                >
                  Disattiva selezionati
                </button>
              </div>
              <div className="overflow-hidden border border-gray-100 rounded-lg text-xs">
                <div className="grid grid-cols-12 bg-gray-50 text-gray-700 font-semibold">
                  <div className="col-span-1 px-3 py-2">Sel</div>
                  <div className="col-span-6 px-3 py-2">Regola</div>
                  <div className="col-span-3 px-3 py-2">Sorgente</div>
                  <div className="col-span-2 px-3 py-2">Stato</div>
                </div>
                {schedulerRules.map((rule) => (
                  <div key={rule.id} className="grid grid-cols-12 border-t border-gray-100">
                    <div className="col-span-1 px-3 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedSchedulerRuleIds.includes(rule.id)}
                        onChange={() =>
                          setSelectedSchedulerRuleIds((prev) =>
                            prev.includes(rule.id)
                              ? prev.filter((id) => id !== rule.id)
                              : [...prev, rule.id],
                          )
                        }
                      />
                    </div>
                    <div className="col-span-6 px-3 py-2">
                      <div className="font-medium text-gray-900">{rule.label}</div>
                      <div className="text-gray-500">{rule.description}</div>
                    </div>
                    <div className="col-span-3 px-3 py-2 font-mono text-gray-600">
                      {rule.source}
                    </div>
                    <div className="col-span-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSchedulerRuleEnabled((prev) => ({
                            ...prev,
                            [rule.id]: !prev[rule.id],
                          }))
                        }
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          schedulerRuleEnabled[rule.id]
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {schedulerRuleEnabled[rule.id] ? 'Attivo' : 'Disattivo'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Queste regole riflettono il comportamento reale del motore scheduler.
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Regole Scheduler Host (CronPanel)</h3>
                <span className="text-xs text-gray-500">
                  Selezionati: {selectedHostRuleIds.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedHostRuleIds(hostSchedulerRuleIds)}
                  className="px-2 py-1 rounded border border-gray-200 text-gray-700"
                >
                  Seleziona tutti
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHostRuleIds([])}
                  className="px-2 py-1 rounded border border-gray-200 text-gray-700"
                >
                  Deseleziona
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHostRuleEnabled((prev) => {
                      const next = { ...prev };
                      selectedHostRuleIds.forEach((id) => {
                        next[id] = true;
                      });
                      return next;
                    })
                  }
                  className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 bg-emerald-50"
                >
                  Attiva selezionati
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHostRuleEnabled((prev) => {
                      const next = { ...prev };
                      selectedHostRuleIds.forEach((id) => {
                        next[id] = false;
                      });
                      return next;
                    })
                  }
                  className="px-2 py-1 rounded border border-gray-200 text-gray-600 bg-gray-50"
                >
                  Disattiva selezionati
                </button>
              </div>
              <div className="overflow-hidden border border-gray-100 rounded-lg text-xs">
                <div className="grid grid-cols-12 bg-gray-50 text-gray-700 font-semibold">
                  <div className="col-span-1 px-3 py-2">Sel</div>
                  <div className="col-span-6 px-3 py-2">Regola</div>
                  <div className="col-span-3 px-3 py-2">Sorgente</div>
                  <div className="col-span-2 px-3 py-2">Stato</div>
                </div>
                {hostSchedulerRules.map((rule) => (
                  <div key={rule.id} className="grid grid-cols-12 border-t border-gray-100">
                    <div className="col-span-1 px-3 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedHostRuleIds.includes(rule.id)}
                        onChange={() =>
                          setSelectedHostRuleIds((prev) =>
                            prev.includes(rule.id)
                              ? prev.filter((id) => id !== rule.id)
                              : [...prev, rule.id],
                          )
                        }
                      />
                    </div>
                    <div className="col-span-6 px-3 py-2">
                      <div className="font-medium text-gray-900">{rule.label}</div>
                      <div className="text-gray-500">{rule.description}</div>
                    </div>
                    <div className="col-span-3 px-3 py-2 font-mono text-gray-600">
                      {rule.source}
                    </div>
                    <div className="col-span-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setHostRuleEnabled((prev) => ({
                            ...prev,
                            [rule.id]: !prev[rule.id],
                          }))
                        }
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          hostRuleEnabled[rule.id]
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hostRuleEnabled[rule.id] ? 'Attivo' : 'Disattivo'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Regole applicate nel pannello host per costruire la CRON o il SimpleTrigger.
              </div>
            </div>
          </div>
        </div>

        {/* Scheduler Modules */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ClockIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Moduli Scheduler (Job configurabili e non)
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSchedulerModuleIds(schedulerModuleIds)}
              className="px-2 py-1 rounded border border-gray-200 text-gray-700"
            >
              Seleziona tutti
            </button>
            <button
              type="button"
              onClick={() => setSelectedSchedulerModuleIds([])}
              className="px-2 py-1 rounded border border-gray-200 text-gray-700"
            >
              Deseleziona
            </button>
            <button
              type="button"
              onClick={() => void handleBulkSchedulerModules(true)}
              className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 bg-emerald-50"
            >
              Attiva selezionati
            </button>
            <button
              type="button"
              onClick={() => void handleBulkSchedulerModules(false)}
              className="px-2 py-1 rounded border border-gray-200 text-gray-600 bg-gray-50"
            >
              Disattiva selezionati
            </button>
            <span className="text-gray-500 ml-auto">
              Selezionati: {selectedSchedulerModuleIds.length}
            </span>
          </div>
          <div className="overflow-hidden border border-gray-100 rounded-lg text-xs">
            <div className="grid grid-cols-12 bg-gray-50 text-gray-700 font-semibold">
              <div className="col-span-1 px-3 py-2">Sel</div>
              <div className="col-span-4 px-3 py-2">Modulo</div>
              <div className="col-span-5 px-3 py-2">Classe</div>
              <div className="col-span-2 px-3 py-2">Stato</div>
            </div>
            {schedulerModules.map((module) => {
              const schedulazione = getSchedulerModuleSchedulazione(module.id);
              const isMissing = !schedulazione;
              const isEnabled = schedulerModuleEnabled[module.id];

              return (
                <div key={module.id} className="grid grid-cols-12 border-t border-gray-100">
                <div className="col-span-1 px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedSchedulerModuleIds.includes(module.id)}
                    onChange={() =>
                      setSelectedSchedulerModuleIds((prev) =>
                        prev.includes(module.id)
                          ? prev.filter((id) => id !== module.id)
                          : [...prev, module.id],
                      )
                    }
                  />
                </div>
                <div className="col-span-4 px-3 py-2">
                  <div className="font-medium text-gray-900">{module.label}</div>
                  <div className="text-gray-500">
                    Gruppo: <span className="font-mono">{module.group}</span>
                  </div>
                </div>
                <div className="col-span-5 px-3 py-2 font-mono text-gray-600">
                  <div>{module.className}</div>
                  <div>
                    Config: {module.configurator ? module.configurator : 'none'}
                  </div>
                </div>
                <div className="col-span-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleSchedulerModule(module.id)}
                    disabled={isMissing || isLoading}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      isMissing
                        ? 'bg-gray-100 text-gray-400'
                        : isEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                      {isMissing ? 'Crea + Attiva' : isEnabled ? 'Attivo' : 'Disattivo'}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Stato UI: le attivazioni reali dipendono dalle schedulazioni in DB e dai flag
            abilitata/stopped.
          </div>
        </div>

        {/* Host Scheduler Modules */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ServerIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Moduli Host (SchedulazioneFunzioniEnum)
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <button
              type="button"
              onClick={() => setSelectedHostFunctionIds(hostFunctionIds)}
              className="px-2 py-1 rounded border border-gray-200 text-gray-700"
            >
              Seleziona tutti
            </button>
            <button
              type="button"
              onClick={() => setSelectedHostFunctionIds([])}
              className="px-2 py-1 rounded border border-gray-200 text-gray-700"
            >
              Deseleziona
            </button>
            <button
              type="button"
              onClick={() => void handleBulkHostFunctions(true)}
              className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 bg-emerald-50"
            >
              Attiva selezionati
            </button>
            <button
              type="button"
              onClick={() => void handleBulkHostFunctions(false)}
              className="px-2 py-1 rounded border border-gray-200 text-gray-600 bg-gray-50"
            >
              Disattiva selezionati
            </button>
            <span className="text-gray-500 ml-auto">
              Selezionati: {selectedHostFunctionIds.length}
            </span>
          </div>
          <div className="overflow-hidden border border-gray-100 rounded-lg text-xs">
            <div className="grid grid-cols-12 bg-gray-50 text-gray-700 font-semibold">
              <div className="col-span-1 px-3 py-2">Sel</div>
              <div className="col-span-3 px-3 py-2">Funzione</div>
              <div className="col-span-4 px-3 py-2">Classe DB</div>
              <div className="col-span-3 px-3 py-2">Classe File</div>
              <div className="col-span-1 px-3 py-2">Stato</div>
            </div>
            {hostFunctionModules.map((module) => {
              const schedulazione = getHostFunctionSchedulazione(module.id);
              const isMissing = !schedulazione;
              const isEnabled = hostFunctionEnabled[module.id];

              return (
                <div key={module.id} className="grid grid-cols-12 border-t border-gray-100">
                <div className="col-span-1 px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedHostFunctionIds.includes(module.id)}
                    onChange={() =>
                      setSelectedHostFunctionIds((prev) =>
                        prev.includes(module.id)
                          ? prev.filter((id) => id !== module.id)
                          : [...prev, module.id],
                      )
                    }
                  />
                </div>
                <div className="col-span-3 px-3 py-2">
                  <div className="font-medium text-gray-900">{module.label}</div>
                  <div className="text-gray-500">
                    ID: <span className="font-mono">{module.funzioneId}</span>
                  </div>
                  {module.notes && <div className="text-gray-500">{module.notes}</div>}
                </div>
                <div className="col-span-4 px-3 py-2 font-mono text-gray-600">
                  {module.classDb}
                </div>
                <div className="col-span-3 px-3 py-2 font-mono text-gray-600">
                  {module.classFile}
                </div>
                <div className="col-span-1 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleHostFunction(module.id)}
                    disabled={isMissing || isLoading}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      isMissing
                        ? 'bg-gray-100 text-gray-400'
                        : isEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                      {isMissing ? 'Crea + Attiva' : isEnabled ? 'Attivo' : 'Disattivo'}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            La classe effettiva dipende da ConfigHostMethods (DB o File).
          </div>
        </div>

        {/* Prenotatore Config */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ServerIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Configurazione Prenotatore</h2>
          </div>
          <div className="space-y-6">
            {prenotatoreConfig.map((section) => (
              <div key={section.title} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  <span className="text-xs font-mono text-gray-500">{section.source}</span>
                </div>
                <div className="overflow-hidden border border-gray-100 rounded-lg">
                  <div className="grid grid-cols-12 bg-gray-50 text-xs font-semibold text-gray-700">
                    <div className="col-span-4 px-3 py-2">Chiave</div>
                    <div className="col-span-3 px-3 py-2">Valore</div>
                    <div className="col-span-5 px-3 py-2">Descrizione</div>
                  </div>
                  {section.items.map((item) => (
                    <div
                      key={item.key}
                      className="grid grid-cols-12 border-t border-gray-100 text-sm"
                    >
                      <div className="col-span-4 px-3 py-2 font-mono text-gray-700">
                        {item.key}
                      </div>
                      <div className="col-span-3 px-3 py-2 font-mono text-gray-900">
                        {item.value}
                      </div>
                      <div className="col-span-5 px-3 py-2 text-gray-600">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Prenotatore Runtime */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BoltIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Prenotatore Runtime</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Componenti</h3>
              <div className="space-y-2">
                {prenotatoreRuntime.map((item) => (
                  <div key={item.name} className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-mono text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Azioni</h3>
              <div className="space-y-2">
                {prenotatoreActions.map((action) => (
                  <div key={action.label} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{action.label}</span>
                    <span className="text-xs text-gray-600">{action.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Jobs interni prenotatore schedulati su WmsQuartzSchedulerModule:
            {` ${prenotatoreJobs.map((job) => job.name).join(', ')}`}.
          </div>
        </div>

        {/* Tipologie Prenotatore */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Tipologie Prenotatore (TipoGestioneArticolo)
            </h2>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Schema Dati</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tipoGestioneArticoloFields.map((item) => (
                <div key={item.name} className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-mono text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Le configurazioni reali dei passi di prenotazione sono salvate in DB
            come XML XStream dentro elencoLogiche. I file
            {` wmsPrenotatorePicking.xml e wmsPrenotatoreRefilling.xml sono DEPRECATI `}
            e usati solo per patch legacy.
          </div>
        </div>

        {/* Criteria Lists */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Criteri Disponibili (Legacy XML)
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Picking</h3>
              <div className="space-y-2 text-xs">
                {pickingCriteria.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <span className="font-mono text-gray-900">{item.id}</span>
                    <span className="font-mono text-gray-500">{item.className}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Refilling</h3>
              <div className="space-y-2 text-xs">
                {refillingCriteria.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <span className="font-mono text-gray-900">{item.id}</span>
                    <span className="font-mono text-gray-500">{item.className}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fonti */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Fonti EjLog</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-gray-600">
            <div>C:\\F_WMS\\EjLog\\config\\wmsTaskScheduler.properties</div>
            <div>C:\\F_WMS\\EjLog\\config\\wmsReservationHandler.properties</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\config\\wmsTaskScheduler.quartz.properties</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\config\\wmsQuartzScheduler.properties</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\system\\modules\\WmsTaskSchedulerModule.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\system\\modules\\WmsLauncher.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\system\\modules\\WmsPrenotatoreModule.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\persistence\\entities\\Schedulazione.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\persistence\\methods\\SchedulazioneMethods.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\persistence\\enums\\SchedulazioneFunzioniEnum.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\gui\\frames\\taskscheduler\\TaskSchedulerModificaTaskPanel.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\gui\\frames\\taskscheduler\\TaskSchedulerPanelBase.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\gui\\frames\\taskscheduler\\TaskSchedulerPanelTouch.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\gui\\frames\\taskscheduler\\TaskSchedulerPanelAction.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\gui\\frames\\host\\GestioneSchedulazioniHostPanelTouch.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\gui\\frames\\host\\SchedulazioneHostPanel.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\gui\\frames\\host\\SchedulazionePuliziaHostJobPanel.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\com\\promag\\wms\\base\\gui\\components\\data\\CronPanel.java</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\config\\wmsPrenotatorePicking.xml</div>
            <div>C:\\F_WMS\\EjLog\\Wmsbase2\\src\\config\\wmsPrenotatoreRefilling.xml</div>
          </div>
        </div>
      </div>
    </div>
  );
}
