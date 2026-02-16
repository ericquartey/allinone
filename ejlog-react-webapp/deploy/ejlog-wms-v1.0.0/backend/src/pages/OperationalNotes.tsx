// src/pages/OperationalNotes.jsx

import React, { useState } from 'react';
import { useOperationalNotes } from '../hooks/useOperationalNotes';
import {
  NoteCategory,
  NotePriority,
  NoteStatus
} from '../types/operationalNotes';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteModal } from '../components/notes/NoteModal';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function OperationalNotes() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const pageSize = 10;

  const {
    notes,
    totalCount,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote
  } = useOperationalNotes({
    skip: page * pageSize,
    take: pageSize,
    search: search || undefined,
    category: category || undefined
  });

  const handleCreateNote = async (data) => {
    const created = await createNote(data);
    if (created) {
      setIsModalOpen(false);
      console.log('Nota creata:', created);
    }
  };

  const handleUpdateNote = async (id, data) => {
    const updated = await updateNote(id, data);
    if (updated) {
      setEditingNote(null);
      setIsModalOpen(false);
      console.log('Nota aggiornata:', updated);
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa nota?')) {
      const deleted = await deleteNote(id);
      if (deleted) {
        console.log('Nota eliminata');
      }
    }
  };

  const handleEditClick = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h3 className="font-semibold mb-2">Errore</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Note Operative</h1>
              <p className="text-gray-600 mt-1">
                Gestisci problemi, soluzioni e attività di manutenzione
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Nuova Nota
            </button>
          </div>

          {/* Filtri */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ricerca
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0); // Reset pagination
                  }}
                  placeholder="Cerca per titolo o descrizione..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(0); // Reset pagination
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tutte le categorie</option>
                  <option value={NoteCategory.ISSUE}>🔴 Problemi</option>
                  <option value={NoteCategory.SOLUTION}>✅ Soluzioni</option>
                  <option value={NoteCategory.MAINTENANCE}>🔧 Manutenzione</option>
                  <option value={NoteCategory.GENERAL}>📝 Generale</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista Note */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessuna nota trovata
            </h3>
            <p className="text-gray-600 mb-4">
              {search || category ? 'Prova a modificare i filtri di ricerca.' : 'Inizia creando la tua prima nota operativa.'}
            </p>
            {!search && !category && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Crea Prima Nota
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteNote}
                  onUpdateStatus={(status) => handleUpdateNote(note.id, { status })}
                />
              ))}
            </div>

            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-between items-center bg-white shadow rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  Mostrando {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalCount)} di {totalCount} note
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Precedente
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Pagina {page + 1} di {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Successiva
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal per Crea/Modifica */}
        <NoteModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={editingNote
            ? (data) => handleUpdateNote(editingNote.id, data)
            : handleCreateNote
          }
          initialData={editingNote}
          title={editingNote ? 'Modifica Nota' : 'Nuova Nota'}
        />
      </div>
    </div>
  );
}
