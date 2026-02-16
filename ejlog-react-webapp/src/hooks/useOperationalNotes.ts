// src/hooks/useOperationalNotes.ts

import { useState, useEffect, useCallback } from 'react';
import {
  OperationalNote,
  CreateNoteRequest,
  UpdateNoteRequest,
  NotesFilters
} from '../types/operationalNotes';
import { operationalNotesApi } from '../services/operationalNotesApi';

export const useOperationalNotes = (filters?: NotesFilters) => {
  const [notes, setNotes] = useState<OperationalNote[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await operationalNotesApi.getAll(filters);
      setNotes(response.items);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento delle note');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create note
  const createNote = useCallback(async (data: CreateNoteRequest): Promise<OperationalNote | null> => {
    setLoading(true);
    setError(null);

    try {
      const newNote = await operationalNotesApi.create(data);
      await fetchNotes(); // Ricarica la lista
      return newNote;
    } catch (err: any) {
      setError(err.message || 'Errore nella creazione della nota');
      console.error('Error creating note:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  // Update note
  const updateNote = useCallback(async (id: number, data: UpdateNoteRequest): Promise<OperationalNote | null> => {
    setLoading(true);
    setError(null);

    try {
      const updated = await operationalNotesApi.update(id, data);
      await fetchNotes(); // Ricarica la lista
      return updated;
    } catch (err: any) {
      setError(err.message || 'Errore nell\'aggiornamento della nota');
      console.error('Error updating note:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  // Delete note
  const deleteNote = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await operationalNotesApi.delete(id);
      await fetchNotes(); // Ricarica la lista
      return true;
    } catch (err: any) {
      setError(err.message || 'Errore nell\'eliminazione della nota');
      console.error('Error deleting note:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  // Load notes on mount and when filters change
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    totalCount,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote
  };
};
