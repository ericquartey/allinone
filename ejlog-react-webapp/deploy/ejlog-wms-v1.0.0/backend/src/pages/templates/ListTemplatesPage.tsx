// ============================================================================
// EJLOG WMS - List Templates Page
// Gestione Modelli Liste per creazione rapida liste standardizzate
// VERSIONE CON RTK QUERY - DATI REALI DAL BACKEND
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileStack, Plus, Edit, Trash2, Play, Search, RefreshCw } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import toast from 'react-hot-toast';
import {
  useGetListTemplatesQuery,
  useDeleteListTemplateMutation,
  type ListTemplate,
} from '../../services/api';

const ListTemplatesPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState<number | undefined>(undefined);

  // RTK Query - Fetch templates with filters
  const {
    data: templatesResponse,
    isLoading,
    error,
    refetch,
  } = useGetListTemplatesQuery({
    listType: listTypeFilter,
    limit: 100,
    offset: 0,
  });

  // Delete mutation
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteListTemplateMutation();

  // Extract templates from response
  const templates = templatesResponse?.exported || [];

  // Apply search filter
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;

    return templates.filter(
      (template) =>
        template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.templateDescription?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: templates.length,
      picking: templates.filter((t) => t.listType === 0).length,
      inbound: templates.filter((t) => t.listType === 1).length,
      inventory: templates.filter((t) => t.listType === 2).length,
    };
  }, [templates]);

  // Get list type label
  const getListTypeLabel = (listType: number): string => {
    switch (listType) {
      case 0:
        return 'Picking';
      case 1:
        return 'Inbound';
      case 2:
        return 'Inventory';
      default:
        return 'Unknown';
    }
  };

  // Get list type badge variant
  const getListTypeBadgeVariant = (listType: number): 'primary' | 'success' | 'warning' | 'error' => {
    switch (listType) {
      case 0:
        return 'primary';
      case 1:
        return 'success';
      case 2:
        return 'warning';
      default:
        return 'error';
    }
  };

  // Handle apply template
  const handleApplyTemplate = (template: ListTemplate) => {
    // Navigate to create list page with template ID
    navigate(`/lists/create?templateId=${template.id}`);
  };

  // Handle edit template
  const handleEditTemplate = (template: ListTemplate) => {
    navigate(`/list-templates/edit/${template.id}`);
  };

  // Handle delete template
  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) {
      return;
    }

    try {
      await deleteTemplate(templateId).unwrap();
      toast.success('Template eliminato con successo');
    } catch (err: any) {
      console.error('Error deleting template:', err);
      toast.error(err?.data?.errorMessage || 'Errore durante l\'eliminazione del template');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.success('Lista templates aggiornata');
  };

  // Table columns
  const columns = [
    {
      key: 'templateName',
      label: 'Nome Template',
      sortable: true,
      render: (template: ListTemplate) => (
        <div className="flex items-center space-x-2">
          <FileStack className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{template.templateName}</span>
        </div>
      ),
    },
    {
      key: 'listType',
      label: 'Tipo Lista',
      sortable: true,
      render: (template: ListTemplate) => (
        <Badge variant={getListTypeBadgeVariant(template.listType)}>
          {getListTypeLabel(template.listType)}
        </Badge>
      ),
    },
    {
      key: 'rowCount',
      label: 'Righe',
      sortable: true,
      render: (template: ListTemplate) => (
        <span className="text-gray-600">{template.rowsTemplate.length}</span>
      ),
    },
    {
      key: 'defaultPriority',
      label: 'Priorità',
      sortable: true,
      render: (template: ListTemplate) => (
        <span className="text-gray-600">{template.defaultPriority || '-'}</span>
      ),
    },
    {
      key: 'defaultCause',
      label: 'Causale',
      sortable: true,
      render: (template: ListTemplate) => (
        <code className="px-2 py-1 bg-gray-100 rounded text-sm">
          {template.defaultCause || '-'}
        </code>
      ),
    },
    {
      key: 'createdBy',
      label: 'Creato Da',
      sortable: true,
      render: (template: ListTemplate) => (
        <span className="text-sm text-gray-500">{template.createdBy || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (template: ListTemplate) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleApplyTemplate(template)}
            title="Applica Template"
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEditTemplate(template)}
            title="Modifica"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={() => handleDeleteTemplate(template.id)}
            disabled={isDeleting}
            title="Elimina"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modelli Liste</h1>
          <p className="text-gray-600 mt-1">
            Gestisci template per creazione rapida liste standardizzate
          </p>
          {templatesResponse && (
            <p className="text-sm text-gray-500 mt-1">
              {templatesResponse.recordNumber} template{templatesResponse.recordNumber !== 1 ? 's' : ''} totali
            </p>
          )}
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/list-templates/create')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuovo Template
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Totale Templates</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Picking</div>
            <div className="text-2xl font-bold text-blue-600">{stats.picking}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Inbound</div>
            <div className="text-2xl font-bold text-green-600">{stats.inbound}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Inventory</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.inventory}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca template..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* List Type Filter */}
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={listTypeFilter ?? 'ALL'}
              onChange={(e) =>
                setListTypeFilter(e.target.value === 'ALL' ? undefined : parseInt(e.target.value))
              }
            >
              <option value="ALL">Tutti i tipi</option>
              <option value="0">Picking</option>
              <option value="1">Inbound</option>
              <option value="2">Inventory</option>
            </select>

            {/* Refresh Button */}
            <Button variant="secondary" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card variant="error">
          <div className="p-4">
            <p className="text-red-700">
              {'data' in error && error.data
                ? (error.data as any).errorMessage || 'Errore nel caricamento templates'
                : 'Errore nel caricamento templates'}
            </p>
          </div>
        </Card>
      )}

      {/* Templates Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredTemplates}
          emptyMessage="Nessun template trovato"
        />
      </Card>
    </div>
  );
};

export default ListTemplatesPage;
