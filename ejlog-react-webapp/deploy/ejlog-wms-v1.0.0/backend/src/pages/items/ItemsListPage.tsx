// ============================================================================
// EJLOG WMS - Items List Page
// Gestione completa Articoli/Prodotti con filtri avanzati
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import * as ItemsService from '../../services/itemsService';
import type { ItemSummary, ItemType, ItemStatus, Item } from '../../services/itemsService';

const ItemsListPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [trackingFilter, setTrackingFilter] = useState<'ALL' | 'LOT' | 'SERIAL' | 'EXPIRY'>('ALL');

  // Load items on component mount
  useEffect(() => {
    loadItems();
  }, [typeFilter, statusFilter, trackingFilter]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: ItemsService.ItemFilterParams = {};

      if (typeFilter !== 'ALL') filters.itemType = typeFilter;
      if (statusFilter !== 'ALL') filters.itemStatus = statusFilter;

      // Tracking filters
      if (trackingFilter === 'LOT') filters.requiresLot = true;
      if (trackingFilter === 'SERIAL') filters.requiresSerialNumber = true;
      if (trackingFilter === 'EXPIRY') filters.requiresExpiryDate = true;

      const response = await ItemsService.getItems(filters);

      if (response.result === 'OK' && response.exportedItems) {
        setItems(response.exportedItems);
      } else {
        setItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento articoli');
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply search and category filters - MEMOIZED for performance
  const filteredItems = useMemo(() => {
    let filtered = ItemsService.filterItemsBySearch(items, searchTerm);

    if (categoryFilter) {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    return filtered;
  }, [items, searchTerm, categoryFilter]);

  // Get unique categories for filter dropdown - MEMOIZED
  const categories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];
  }, [items]);

  // Statistics - MEMOIZED for performance
  const stats = useMemo(() => {
    return {
      total: items.length,
      active: items.filter(i => i.itemStatus === ItemsService.ItemStatus.ACTIVE).length,
      inactive: items.filter(i => i.itemStatus === ItemsService.ItemStatus.INACTIVE).length,
      lowStock: items.filter(i => {
        if (i.currentStock === undefined) return false;
        // Type-safe cast to Item with minStockLevel
        const itemWithStockLevel = i as ItemSummary & Pick<Item, 'minStockLevel'>;
        return ItemsService.isLowStock(itemWithStockLevel as Item, i.currentStock);
      }).length,
      requiresLot: items.filter(i => i.requiresLot).length,
    };
  }, [items]);

  // Badge rendering functions - MEMOIZED with useCallback
  const getStatusBadge = useCallback((status: ItemStatus) => {
    const statusLabel = ItemsService.getItemStatusLabel(status);

    switch (status) {
      case ItemsService.ItemStatus.ACTIVE:
        return <Badge variant="success">{statusLabel.toUpperCase()}</Badge>;
      case ItemsService.ItemStatus.INACTIVE:
        return <Badge variant="secondary">{statusLabel.toUpperCase()}</Badge>;
      case ItemsService.ItemStatus.DISCONTINUED:
        return <Badge variant="warning">{statusLabel.toUpperCase()}</Badge>;
      case ItemsService.ItemStatus.BLOCKED:
        return <Badge variant="danger">{statusLabel.toUpperCase()}</Badge>;
      default:
        return <Badge variant="info">{statusLabel.toUpperCase()}</Badge>;
    }
  }, []);

  const getTypeBadge = useCallback((type: ItemType) => {
    const typeLabel = ItemsService.getItemTypeLabel(type);

    switch (type) {
      case ItemsService.ItemType.FINISHED_GOOD:
        return <Badge variant="primary">{typeLabel}</Badge>;
      case ItemsService.ItemType.RAW_MATERIAL:
        return <Badge variant="info">{typeLabel}</Badge>;
      case ItemsService.ItemType.SEMI_FINISHED:
        return <Badge variant="warning">{typeLabel}</Badge>;
      default:
        return <Badge variant="secondary">{typeLabel}</Badge>;
    }
  }, []);

  const handleDeleteItem = useCallback(async (itemCode: string) => {
    if (!confirm(`Confermi l'eliminazione dell'articolo ${itemCode}?`)) return;

    try {
      const response = await ItemsService.deleteItem(itemCode);
      if (response.result === 'OK') {
        loadItems(); // Reload list
      } else {
        alert(response.message || 'Errore durante l\'eliminazione');
      }
    } catch (err) {
      alert('Errore durante l\'eliminazione articolo');
      console.error('Error deleting item:', err);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <Button onClick={loadItems} className="mt-4">Riprova</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Articoli</h1>
          <p className="text-gray-600 mt-1">
            {filteredItems.length} articoli trovati
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/items/create')}>
            Nuovo Articolo
          </Button>
          <Button variant="ghost" onClick={loadItems}>
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Totale Articoli</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Attivi</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Inattivi</p>
            <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Scorta Minima</p>
            <p className="text-3xl font-bold text-orange-600">{stats.lowStock}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Con Lotto</p>
            <p className="text-3xl font-bold text-purple-600">{stats.requiresLot}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cerca Articolo
            </label>
            <input
              type="text"
              placeholder="Codice, Descrizione o Barcode"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Articolo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ItemType | 'ALL')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti i tipi</option>
              <option value={ItemsService.ItemType.PRODUCT}>Prodotto</option>
              <option value={ItemsService.ItemType.RAW_MATERIAL}>Materia Prima</option>
              <option value={ItemsService.ItemType.SEMI_FINISHED}>Semilavorato</option>
              <option value={ItemsService.ItemType.FINISHED_GOOD}>Prodotto Finito</option>
              <option value={ItemsService.ItemType.CONSUMABLE}>Consumabile</option>
              <option value={ItemsService.ItemType.SPARE_PART}>Ricambio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'ALL')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti gli stati</option>
              <option value={ItemsService.ItemStatus.ACTIVE}>Attivo</option>
              <option value={ItemsService.ItemStatus.INACTIVE}>Inattivo</option>
              <option value={ItemsService.ItemStatus.DISCONTINUED}>Dismesso</option>
              <option value={ItemsService.ItemStatus.BLOCKED}>Bloccato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracciabilità
            </label>
            <select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti</option>
              <option value="LOT">Con Lotto</option>
              <option value="SERIAL">Con Matricola</option>
              <option value="EXPIRY">Con Scadenza</option>
            </select>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tutte le categorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </Card>

      {/* Items Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Elenco Articoli</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => {
              setSearchTerm('');
              setTypeFilter('ALL');
              setStatusFilter('ALL');
              setCategoryFilter('');
              setTrackingFilter('ALL');
            }}>
              Reset Filtri
            </Button>
            <Button size="sm" variant="ghost">
              Esporta Excel
            </Button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nessun articolo trovato</p>
            <p className="text-sm mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <Table
            columns={[
              {
                key: 'itemCode',
                label: 'Codice',
                render: (row) => (
                  <button
                    className="text-blue-600 hover:underline font-semibold"
                    onClick={() => navigate(`/items/${row.itemCode}`)}
                  >
                    {row.itemCode}
                  </button>
                ),
              },
              {
                key: 'itemDescription',
                label: 'Descrizione',
                render: (row) => (
                  <div className="max-w-xs">
                    <p className="font-medium">{row.itemDescription}</p>
                    {row.barcode && (
                      <p className="text-xs text-gray-500">EAN: {row.barcode}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'type',
                label: 'Tipo',
                render: (row) => getTypeBadge(row.itemType),
              },
              {
                key: 'category',
                label: 'Categoria',
                render: (row) => (
                  <span className="text-sm">
                    {row.category || <span className="text-gray-400">-</span>}
                  </span>
                ),
              },
              {
                key: 'unitOfMeasure',
                label: 'UdM',
                render: (row) => (
                  <Badge variant="secondary">
                    {row.unitOfMeasure}
                  </Badge>
                ),
              },
              {
                key: 'tracking',
                label: 'Tracciabilità',
                render: (row) => (
                  <div className="flex gap-1 flex-wrap">
                    {row.requiresLot && (
                      <Badge variant="info" size="sm">LOTTO</Badge>
                    )}
                    {row.requiresSerialNumber && (
                      <Badge variant="warning" size="sm">MATRICOLA</Badge>
                    )}
                    {row.requiresExpiryDate && (
                      <Badge variant="danger" size="sm">SCADENZA</Badge>
                    )}
                    {!row.requiresLot && !row.requiresSerialNumber && !row.requiresExpiryDate && (
                      <span className="text-xs text-gray-400">Nessuna</span>
                    )}
                  </div>
                ),
              },
              {
                key: 'currentStock',
                label: 'Giacenza',
                render: (row) => (
                  <span className="font-semibold">
                    {row.currentStock !== undefined ? row.currentStock.toFixed(2) : '-'}
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Stato',
                render: (row) => getStatusBadge(row.itemStatus),
              },
              {
                key: 'actions',
                label: 'Azioni',
                render: (row) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/items/${row.itemCode}`)}
                    >
                      Dettagli
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/items/${row.itemCode}/edit`)}
                    >
                      Modifica
                    </Button>
                    {row.itemStatus !== ItemsService.ItemStatus.ACTIVE && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteItem(row.itemCode)}
                      >
                        Elimina
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={filteredItems}
          />
        )}
      </Card>
    </div>
  );
};

export default ItemsListPage;
