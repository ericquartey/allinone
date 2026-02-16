import React, { FC, useState, useEffect } from 'react';
import {
  Calendar, Clock, Mail, Users, Play, Pause, Trash2,
  Edit, Plus, FileText, Download, CheckCircle, AlertCircle,
  Settings, Send, History, Eye
} from 'lucide-react';

// Types
interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  reportType: string;
  schedule: ReportSchedule;
  recipients: string[];
  format: 'excel' | 'pdf' | 'csv';
  status: 'active' | 'paused' | 'error';
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  createdBy: string;
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  cronExpression?: string; // for custom
}

interface ExecutionHistory {
  id: string;
  reportId: string;
  reportName: string;
  executionDate: Date;
  status: 'success' | 'failed';
  duration: number; // seconds
  recordCount: number;
  fileSize: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export const ScheduledReportsManager: FC = () => {
  // State
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'history'>('scheduled');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'error'>('all');

  // Form state for new report
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reportType: 'operations',
    frequency: 'daily' as const,
    time: '08:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    recipients: '',
    format: 'excel' as const
  });

  // Mock data
  useEffect(() => {
    const mockReports: ScheduledReport[] = [
      {
        id: 'sched_1',
        name: 'Report Operazioni Giornaliero',
        description: 'Report giornaliero delle operazioni completate',
        reportType: 'operations',
        schedule: {
          frequency: 'daily',
          time: '08:00'
        },
        recipients: ['operations@company.com', 'manager@company.com'],
        format: 'excel',
        status: 'active',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'sched_2',
        name: 'Report Inventario Settimanale',
        description: 'Snapshot inventario ogni lunedì mattina',
        reportType: 'inventory',
        schedule: {
          frequency: 'weekly',
          time: '06:00',
          dayOfWeek: 1
        },
        recipients: ['inventory@company.com'],
        format: 'pdf',
        status: 'active',
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'sched_3',
        name: 'Report Performance Mensile',
        description: 'KPI performance operatori - primo giorno del mese',
        reportType: 'performance',
        schedule: {
          frequency: 'monthly',
          time: '09:00',
          dayOfMonth: 1
        },
        recipients: ['hr@company.com', 'manager@company.com'],
        format: 'excel',
        status: 'active',
        lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'sched_4',
        name: 'Report Errori Tempo Reale',
        description: 'Alert errori critici ogni 4 ore',
        reportType: 'alarms',
        schedule: {
          frequency: 'custom',
          time: '00:00',
          cronExpression: '0 */4 * * *'
        },
        recipients: ['it@company.com', 'support@company.com'],
        format: 'csv',
        status: 'paused',
        lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      }
    ];

    const mockHistory: ExecutionHistory[] = [
      {
        id: 'exec_1',
        reportId: 'sched_1',
        reportName: 'Report Operazioni Giornaliero',
        executionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'success',
        duration: 15,
        recordCount: 1247,
        fileSize: '2.3 MB',
        downloadUrl: '/downloads/report_ops_20251127.xlsx'
      },
      {
        id: 'exec_2',
        reportId: 'sched_2',
        reportName: 'Report Inventario Settimanale',
        executionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'success',
        duration: 42,
        recordCount: 8934,
        fileSize: '8.7 MB',
        downloadUrl: '/downloads/report_inv_20251120.pdf'
      },
      {
        id: 'exec_3',
        reportId: 'sched_1',
        reportName: 'Report Operazioni Giornaliero',
        executionDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        status: 'failed',
        duration: 5,
        recordCount: 0,
        fileSize: '0 KB',
        errorMessage: 'Database connection timeout'
      },
      {
        id: 'exec_4',
        reportId: 'sched_3',
        reportName: 'Report Performance Mensile',
        executionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'success',
        duration: 67,
        recordCount: 45,
        fileSize: '1.2 MB',
        downloadUrl: '/downloads/report_perf_20251027.xlsx'
      }
    ];

    setScheduledReports(mockReports);
    setExecutionHistory(mockHistory);
  }, []);

  // Handlers
  const handleCreateReport = () => {
    const newReport: ScheduledReport = {
      id: `sched_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      reportType: formData.reportType,
      schedule: {
        frequency: formData.frequency,
        time: formData.time,
        dayOfWeek: formData.dayOfWeek,
        dayOfMonth: formData.dayOfMonth
      },
      recipients: formData.recipients.split(',').map(e => e.trim()),
      format: formData.format,
      status: 'active',
      nextRun: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      createdAt: new Date(),
      createdBy: 'current_user'
    };

    setScheduledReports([...scheduledReports, newReport]);
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      reportType: 'operations',
      frequency: 'daily',
      time: '08:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      recipients: '',
      format: 'excel'
    });
  };

  const toggleReportStatus = (reportId: string) => {
    setScheduledReports(scheduledReports.map(report =>
      report.id === reportId
        ? { ...report, status: report.status === 'active' ? 'paused' : 'active' as const }
        : report
    ));
  };

  const deleteReport = (reportId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo report programmato?')) {
      setScheduledReports(scheduledReports.filter(r => r.id !== reportId));
    }
  };

  const runReportNow = (reportId: string) => {
    const report = scheduledReports.find(r => r.id === reportId);
    if (!report) return;

    alert(`Esecuzione immediata del report: ${report.name}\n\nIl report verrà generato ed inviato a: ${report.recipients.join(', ')}`);

    // Simulate execution
    const newExecution: ExecutionHistory = {
      id: `exec_${Date.now()}`,
      reportId: report.id,
      reportName: report.name,
      executionDate: new Date(),
      status: 'success',
      duration: Math.floor(Math.random() * 60) + 10,
      recordCount: Math.floor(Math.random() * 5000) + 100,
      fileSize: `${(Math.random() * 10 + 0.5).toFixed(1)} MB`,
      downloadUrl: `/downloads/report_${Date.now()}.${report.format}`
    };

    setExecutionHistory([newExecution, ...executionHistory]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'error': case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getFrequencyLabel = (schedule: ReportSchedule) => {
    switch (schedule.frequency) {
      case 'daily': return `Giornaliero alle ${schedule.time}`;
      case 'weekly': return `Settimanale (${getDayName(schedule.dayOfWeek!)}) alle ${schedule.time}`;
      case 'monthly': return `Mensile (giorno ${schedule.dayOfMonth}) alle ${schedule.time}`;
      case 'custom': return `Custom: ${schedule.cronExpression}`;
      default: return 'N/A';
    }
  };

  const getDayName = (day: number) => {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[day];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredReports = scheduledReports.filter(report =>
    filterStatus === 'all' || report.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Report Programmati</h1>
                <p className="text-gray-600">Gestisci l'esecuzione automatica dei report</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nuovo Report Programmato
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`pb-3 px-2 font-medium transition ${
                activeTab === 'scheduled'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Report Programmati ({scheduledReports.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-2 font-medium transition ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Storico Esecuzioni ({executionHistory.length})
            </button>
          </div>
        </div>

        {/* Scheduled Reports Tab */}
        {activeTab === 'scheduled' && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Filtra per stato:</span>
                <div className="flex gap-2">
                  {(['all', 'active', 'paused', 'error'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        filterStatus === status
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? 'Tutti' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map(report => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{report.name}</h3>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          {report.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{report.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{getFrequencyLabel(report.schedule)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>Formato: {report.format.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{report.recipients.length} destinatari</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Creato da: {report.createdBy}</span>
                        </div>
                      </div>

                      {report.lastRun && (
                        <div className="mt-3 text-xs text-gray-500">
                          Ultima esecuzione: {formatDate(report.lastRun)}
                        </div>
                      )}
                      {report.nextRun && report.status === 'active' && (
                        <div className="mt-1 text-xs text-blue-600 font-medium">
                          Prossima esecuzione: {formatDate(report.nextRun)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runReportNow(report.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Esegui ora"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleReportStatus(report.id)}
                        className={`p-2 rounded-lg ${
                          report.status === 'active'
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={report.status === 'active' ? 'Pausa' : 'Attiva'}
                      >
                        {report.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifica"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="text-xs font-medium text-gray-700 mb-2">Destinatari:</div>
                    <div className="flex flex-wrap gap-2">
                      {report.recipients.map((email, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nessun report programmato trovato</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Esecuzione</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durata</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dimensione</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {executionHistory.map(execution => (
                  <tr key={execution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{execution.reportName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(execution.executionDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(execution.status)}`}>
                        {getStatusIcon(execution.status)}
                        {execution.status === 'success' ? 'SUCCESSO' : 'FALLITO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {execution.duration}s
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {execution.recordCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {execution.fileSize}
                    </td>
                    <td className="px-6 py-4">
                      {execution.status === 'success' && execution.downloadUrl ? (
                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      ) : execution.errorMessage ? (
                        <button className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm">
                          <Eye className="w-4 h-4" />
                          Errore
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {executionHistory.length === 0 && (
              <div className="p-12 text-center">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nessuna esecuzione storica</p>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold">Nuovo Report Programmato</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Report</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Es: Report Operazioni Settimanale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="Descrivi lo scopo del report..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Report</label>
                    <select
                      value={formData.reportType}
                      onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="operations">Operazioni</option>
                      <option value="inventory">Inventario</option>
                      <option value="orders">Ordini</option>
                      <option value="performance">Performance</option>
                      <option value="alarms">Allarmi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato Export</label>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="excel">Excel (.xlsx)</option>
                      <option value="pdf">PDF (.pdf)</option>
                      <option value="csv">CSV (.csv)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequenza</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">Giornaliero</option>
                      <option value="weekly">Settimanale</option>
                      <option value="monthly">Mensile</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orario</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {formData.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giorno della Settimana</label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'].map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giorno del Mese</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatari Email (separati da virgola)
                  </label>
                  <textarea
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="email1@company.com, email2@company.com"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreateReport}
                  disabled={!formData.name || !formData.recipients}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Crea Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
