import React, { FC, useState, useEffect } from 'react';
import {
  FileText, Download, Calendar, Filter, Layout,
  Table, BarChart, PieChart, Eye, Save, Share2,
  Plus, Trash2, Edit, ChevronDown, ChevronUp
} from 'lucide-react';

// Types
interface ReportField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  category: string;
  selected: boolean;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: string[];
  filters: ReportFilter[];
  groupBy?: string;
  sortBy?: { field: string; order: 'asc' | 'desc' };
}

interface ChartConfig {
  type: 'table' | 'bar' | 'line' | 'pie';
  xAxis?: string;
  yAxis?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export const CustomReportBuilder: FC = () => {
  // State
  const [reportName, setReportName] = useState('Nuovo Report');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('operations');
  const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
  const [selectedFields, setSelectedFields] = useState<ReportField[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({ type: 'table' });
  const [showPreview, setShowPreview] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    fields: true,
    filters: true,
    visualization: true,
    templates: false
  });

  // Mock available fields per category
  useEffect(() => {
    const fieldsByCategory: Record<string, ReportField[]> = {
      operations: [
        { id: 'op_id', name: 'ID Operazione', type: 'string', category: 'operations', selected: false },
        { id: 'op_type', name: 'Tipo Operazione', type: 'string', category: 'operations', selected: false },
        { id: 'op_status', name: 'Stato', type: 'string', category: 'operations', selected: false },
        { id: 'op_date', name: 'Data Operazione', type: 'date', category: 'operations', selected: false },
        { id: 'op_operator', name: 'Operatore', type: 'string', category: 'operations', selected: false },
        { id: 'op_duration', name: 'Durata (min)', type: 'number', category: 'operations', selected: false },
        { id: 'op_quantity', name: 'Quantità', type: 'number', category: 'operations', selected: false },
        { id: 'op_location', name: 'Locazione', type: 'string', category: 'operations', selected: false }
      ],
      inventory: [
        { id: 'inv_item', name: 'Articolo', type: 'string', category: 'inventory', selected: false },
        { id: 'inv_qty', name: 'Quantità', type: 'number', category: 'inventory', selected: false },
        { id: 'inv_location', name: 'Locazione', type: 'string', category: 'inventory', selected: false },
        { id: 'inv_udc', name: 'UDC', type: 'string', category: 'inventory', selected: false },
        { id: 'inv_batch', name: 'Lotto', type: 'string', category: 'inventory', selected: false },
        { id: 'inv_value', name: 'Valore (€)', type: 'number', category: 'inventory', selected: false },
        { id: 'inv_last_movement', name: 'Ultimo Movimento', type: 'date', category: 'inventory', selected: false }
      ],
      orders: [
        { id: 'ord_id', name: 'ID Ordine', type: 'string', category: 'orders', selected: false },
        { id: 'ord_customer', name: 'Cliente', type: 'string', category: 'orders', selected: false },
        { id: 'ord_date', name: 'Data Ordine', type: 'date', category: 'orders', selected: false },
        { id: 'ord_status', name: 'Stato', type: 'string', category: 'orders', selected: false },
        { id: 'ord_lines', name: 'Numero Righe', type: 'number', category: 'orders', selected: false },
        { id: 'ord_total', name: 'Totale (€)', type: 'number', category: 'orders', selected: false },
        { id: 'ord_priority', name: 'Priorità', type: 'string', category: 'orders', selected: false }
      ],
      performance: [
        { id: 'perf_operator', name: 'Operatore', type: 'string', category: 'performance', selected: false },
        { id: 'perf_ops_count', name: 'Operazioni Completate', type: 'number', category: 'performance', selected: false },
        { id: 'perf_avg_time', name: 'Tempo Medio (min)', type: 'number', category: 'performance', selected: false },
        { id: 'perf_accuracy', name: 'Accuratezza (%)', type: 'number', category: 'performance', selected: false },
        { id: 'perf_errors', name: 'Errori', type: 'number', category: 'performance', selected: false },
        { id: 'perf_productivity', name: 'Produttività', type: 'number', category: 'performance', selected: false }
      ]
    };

    setAvailableFields(fieldsByCategory[selectedCategory] || []);
  }, [selectedCategory]);

  // Mock templates
  useEffect(() => {
    setTemplates([
      {
        id: 'tpl_daily_ops',
        name: 'Operazioni Giornaliere',
        description: 'Report giornaliero delle operazioni completate',
        category: 'operations',
        fields: ['op_id', 'op_type', 'op_date', 'op_operator', 'op_duration'],
        filters: [],
        sortBy: { field: 'op_date', order: 'desc' }
      },
      {
        id: 'tpl_inventory_snapshot',
        name: 'Snapshot Inventario',
        description: 'Situazione giacenze per articolo e locazione',
        category: 'inventory',
        fields: ['inv_item', 'inv_location', 'inv_qty', 'inv_value'],
        filters: [],
        groupBy: 'inv_item'
      },
      {
        id: 'tpl_operator_performance',
        name: 'Performance Operatori',
        description: 'KPI produttività operatori',
        category: 'performance',
        fields: ['perf_operator', 'perf_ops_count', 'perf_avg_time', 'perf_accuracy'],
        filters: [],
        sortBy: { field: 'perf_productivity', order: 'desc' }
      }
    ]);
  }, []);

  // Handlers
  const toggleFieldSelection = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (!field) return;

    if (selectedFields.find(f => f.id === fieldId)) {
      setSelectedFields(selectedFields.filter(f => f.id !== fieldId));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: selectedFields[0]?.id || '',
      operator: 'equals',
      value: ''
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map(f => f.id === filterId ? { ...f, ...updates } : f));
  };

  const loadTemplate = (template: ReportTemplate) => {
    setReportName(template.name);
    setReportDescription(template.description);
    setSelectedCategory(template.category);

    // Wait for availableFields to update, then select fields
    setTimeout(() => {
      const fieldsToSelect = availableFields.filter(f => template.fields.includes(f.id));
      setSelectedFields(fieldsToSelect);
      setFilters(template.filters);
    }, 100);
  };

  const saveTemplate = () => {
    const newTemplate: ReportTemplate = {
      id: `tpl_${Date.now()}`,
      name: reportName,
      description: reportDescription,
      category: selectedCategory,
      fields: selectedFields.map(f => f.id),
      filters: filters
    };
    setTemplates([...templates, newTemplate]);
    alert('Template salvato con successo!');
  };

  const exportReport = (format: 'excel' | 'pdf' | 'csv') => {
    console.log(`Esportazione report in formato ${format.toUpperCase()}`);
    alert(`Report esportato in formato ${format.toUpperCase()}\n\nCampi: ${selectedFields.length}\nFiltri: ${filters.length}`);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
                <p className="text-gray-600">Crea report personalizzati con filtri e visualizzazioni</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Nascondi' : 'Anteprima'}
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Esporta
              </button>
            </div>
          </div>

          {/* Report Name & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Report</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Es: Report Operazioni Mensile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="operations">Operazioni</option>
                <option value="inventory">Inventario</option>
                <option value="orders">Ordini</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Descrivi lo scopo del report..."
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="col-span-2 space-y-6">
            {/* Field Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => toggleSection('fields')}
                className="flex items-center justify-between w-full mb-4"
              >
                <div className="flex items-center gap-2">
                  <Layout className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Campi Report</h2>
                  <span className="text-sm text-gray-500">({selectedFields.length} selezionati)</span>
                </div>
                {expandedSections.fields ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.fields && (
                <div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {availableFields.map(field => (
                      <label
                        key={field.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                          selectedFields.find(f => f.id === field.id)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedFields.find(f => f.id === field.id)}
                          onChange={() => toggleFieldSelection(field.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{field.name}</div>
                          <div className="text-xs text-gray-500">{field.type}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Seleziona i campi da includere nel report. L'ordine di selezione determina l'ordine delle colonne.
                  </p>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => toggleSection('filters')}
                className="flex items-center justify-between w-full mb-4"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold">Filtri</h2>
                  <span className="text-sm text-gray-500">({filters.length} attivi)</span>
                </div>
                {expandedSections.filters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.filters && (
                <div>
                  <div className="space-y-3 mb-4">
                    {filters.map(filter => (
                      <div key={filter.id} className="flex gap-2 items-start">
                        <select
                          value={filter.field}
                          onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Seleziona campo...</option>
                          {selectedFields.map(field => (
                            <option key={field.id} value={field.id}>{field.name}</option>
                          ))}
                        </select>
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="equals">Uguale a</option>
                          <option value="contains">Contiene</option>
                          <option value="greater">Maggiore di</option>
                          <option value="less">Minore di</option>
                          <option value="between">Tra</option>
                        </select>
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="Valore..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => removeFilter(filter.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addFilter}
                    disabled={selectedFields.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi Filtro
                  </button>
                </div>
              )}
            </div>

            {/* Visualization */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => toggleSection('visualization')}
                className="flex items-center justify-between w-full mb-4"
              >
                <div className="flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">Visualizzazione</h2>
                </div>
                {expandedSections.visualization ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.visualization && (
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => setChartConfig({ type: 'table' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition ${
                      chartConfig.type === 'table'
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Table className="w-6 h-6" />
                    <span className="text-sm font-medium">Tabella</span>
                  </button>
                  <button
                    onClick={() => setChartConfig({ type: 'bar' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition ${
                      chartConfig.type === 'bar'
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart className="w-6 h-6" />
                    <span className="text-sm font-medium">Barre</span>
                  </button>
                  <button
                    onClick={() => setChartConfig({ type: 'line' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition ${
                      chartConfig.type === 'line'
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart className="w-6 h-6" />
                    <span className="text-sm font-medium">Linea</span>
                  </button>
                  <button
                    onClick={() => setChartConfig({ type: 'pie' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition ${
                      chartConfig.type === 'pie'
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <PieChart className="w-6 h-6" />
                    <span className="text-sm font-medium">Torta</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Templates & Actions */}
          <div className="space-y-6">
            {/* Templates */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => toggleSection('templates')}
                className="flex items-center justify-between w-full mb-4"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-semibold">Template</h2>
                </div>
                {expandedSections.templates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.templates && (
                <div className="space-y-2">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => loadTemplate(template)}
                    >
                      <div className="font-medium text-sm mb-1">{template.name}</div>
                      <div className="text-xs text-gray-600">{template.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{template.fields.length} campi</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-4">Azioni</h2>
              <button
                onClick={saveTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Salva Template
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Esporta Excel
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Download className="w-4 h-4" />
                Esporta PDF
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Download className="w-4 h-4" />
                Esporta CSV
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Share2 className="w-4 h-4" />
                Condividi Report
              </button>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Riepilogo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Campi:</span>
                  <span className="font-medium">{selectedFields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Filtri:</span>
                  <span className="font-medium">{filters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visualizzazione:</span>
                  <span className="font-medium capitalize">{chartConfig.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoria:</span>
                  <span className="font-medium capitalize">{selectedCategory}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Anteprima Report</h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600 text-center py-8">
                Anteprima report con {selectedFields.length} campi e {filters.length} filtri applicati.
                <br />
                Tipo visualizzazione: <span className="font-medium uppercase">{chartConfig.type}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
