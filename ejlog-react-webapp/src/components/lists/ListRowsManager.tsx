// ============================================================================
// EJLOG WMS - List Rows Manager Component
// Gestione completa righe lista (CRUD)
// ============================================================================

import React, { useState } from 'react';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Badge from '../shared/Badge';
import Modal from '../shared/Modal';
import {
  useGetListRowsQuery,
  useAddListRowMutation,
  useUpdateListRowMutation,
  useDeleteListRowMutation,
} from '../../services/api/listsApi';
import type { ItemListRow } from '../../types/models';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface ListRowsManagerProps {
  listId: number;
  readonly?: boolean;
}

const ListRowsManager: React.FC<ListRowsManagerProps> = ({ listId, readonly = false }) => {
  // API Hooks
  const { data: rows = [], isLoading, refetch } = useGetListRowsQuery(listId);
  const [addRow, { isLoading: isAdding }] = useAddListRowMutation();
  const [updateRow, { isLoading: isUpdating }] = useUpdateListRowMutation();
  const [deleteRow, { isLoading: isDeleting }] = useDeleteListRowMutation();

  // State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<ItemListRow | null>(null);
  const [formData, setFormData] = useState({
    itemId: 0,
    itemCode: '',
    itemDescription: '',
    requestedQuantity: 0,
    lot: '',
    serialNumber: '',
    expirationDate: '',
    note: '',
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingRow(null);
    setFormData({
      itemId: 0,
      itemCode: '',
      itemDescription: '',
      requestedQuantity: 0,
      lot: '',
      serialNumber: '',
      expirationDate: '',
      note: '',
    });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (row: ItemListRow) => {
    setEditingRow(row);
    setFormData({
      itemId: row.itemId,
      itemCode: row.itemCode || '',
      itemDescription: row.itemDescription || '',
      requestedQuantity: row.requestedQuantity,
      lot: row.lot || '',
      serialNumber: row.serialNumber || '',
      expirationDate: row.expirationDate || '',
      note: row.note || '',
    });
    setShowAddEditModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRow) {
        // Update existing row
        await updateRow({
          listId,
          rowId: editingRow.id,
          data: formData,
        }).unwrap();
        alert('Riga aggiornata con successo!');
      } else {
        // Add new row
        await addRow({
          listId,
          row: formData,
        }).unwrap();
        alert('Riga aggiunta con successo!');
      }
      setShowAddEditModal(false);
      refetch();
    } catch (error) {
      console.error('Error saving row:', error);
      alert('Errore nel salvataggio della riga');
    }
  };

  const handleDelete = async (row: ItemListRow) => {
    if (!confirm(`Confermi l'eliminazione della riga "${row.itemCode}"?`)) {
      return;
    }

    try {
      await deleteRow({ listId, rowId: row.id }).unwrap();
      alert('Riga eliminata con successo!');
      refetch();
    } catch (error) {
      console.error('Error deleting row:', error);
      alert("Errore nell'eliminazione della riga");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento righe...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Righe Lista ({rows.length})</h3>
        {!readonly && (
          <Button size="sm" variant="primary" onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>
            Aggiungi Riga
          </Button>
        )}
      </div>

      {/* Rows List */}
      {rows.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <p>Nessuna riga presente</p>
          {!readonly && (
            <Button size="sm" variant="primary" className="mt-4" onClick={handleOpenAddModal}>
              Aggiungi Prima Riga
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start">
                {/* Row Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-mono">#{row.id}</span>
                    <p className="font-semibold text-gray-900">
                      {row.itemCode} - {row.itemDescription}
                    </p>
                    {row.isCompleted && <Badge variant="success" size="sm">Completata</Badge>}
                  </div>

                  {/* Details */}
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Richiesto:</span>
                      <span className="ml-2 font-semibold">{row.requestedQuantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Evaso:</span>
                      <span className="ml-2 font-semibold">{row.dispatchedQuantity}</span>
                    </div>
                    {row.remainingQuantity !== undefined && (
                      <div>
                        <span className="text-gray-500">Rimanente:</span>
                        <span className="ml-2 font-semibold">{row.remainingQuantity}</span>
                      </div>
                    )}
                    {row.lot && (
                      <div>
                        <span className="text-gray-500">Lotto:</span>
                        <span className="ml-2">{row.lot}</span>
                      </div>
                    )}
                    {row.serialNumber && (
                      <div>
                        <span className="text-gray-500">Matricola:</span>
                        <span className="ml-2">{row.serialNumber}</span>
                      </div>
                    )}
                    {row.expirationDate && (
                      <div>
                        <span className="text-gray-500">Scadenza:</span>
                        <span className="ml-2">{new Date(row.expirationDate).toLocaleDateString('it-IT')}</span>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  {row.note && (
                    <div className="mt-2 text-sm text-gray-600 italic">
                      <span className="text-gray-500">Note:</span> {row.note}
                    </div>
                  )}

                  {/* External Items Badge */}
                  {row.containsExternalItems && (
                    <Badge variant="warning" size="sm" className="mt-2">
                      Contiene Articoli Esterni
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                {!readonly && (
                  <div className="flex gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditModal(row)}
                      title="Modifica"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(row)}
                      disabled={row.isCompleted}
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Avanzamento</span>
                  <span className="text-xs font-medium">
                    {row.requestedQuantity > 0
                      ? ((row.dispatchedQuantity / row.requestedQuantity) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      row.isCompleted ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${
                        row.requestedQuantity > 0
                          ? (row.dispatchedQuantity / row.requestedQuantity) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        title={editingRow ? 'Modifica Riga' : 'Nuova Riga'}
        size="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Item ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Articolo <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.itemId}
                onChange={(e) => setFormData({ ...formData, itemId: Number(e.target.value) })}
                required
                min={1}
              />
            </div>

            {/* Item Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Codice Articolo</label>
              <Input
                value={formData.itemCode}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                placeholder="Codice articolo"
              />
            </div>

            {/* Item Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
              <Input
                value={formData.itemDescription}
                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                placeholder="Descrizione articolo"
              />
            </div>

            {/* Requested Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantità Richiesta <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.requestedQuantity}
                onChange={(e) => setFormData({ ...formData, requestedQuantity: Number(e.target.value) })}
                required
                min={0.01}
                step={0.01}
              />
            </div>

            {/* Lot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lotto</label>
              <Input
                value={formData.lot}
                onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                placeholder="Numero lotto"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Matricola</label>
              <Input
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Numero matricola"
              />
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Scadenza</label>
              <Input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              />
            </div>

            {/* Note */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Note aggiuntive"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setShowAddEditModal(false)} icon={<X className="w-4 h-4" />}>
              Annulla
            </Button>
            <Button type="submit" variant="primary" disabled={isAdding || isUpdating} icon={<Save className="w-4 h-4" />}>
              {isAdding || isUpdating ? 'Salvataggio...' : editingRow ? 'Aggiorna' : 'Aggiungi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ListRowsManager;
