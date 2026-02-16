// src/services/operationalNotesApi.ts

import axios, { AxiosResponse } from 'axios';
import {
  OperationalNote,
  CreateNoteRequest,
  UpdateNoteRequest,
  NotesResponse,
  NotesFilters
} from '../types/operationalNotes';

// Base URL uses proxy configuration from vite.config.js
// /api/* is proxied to http://localhost:3077/api/*
const API_BASE_PATH = '/api';

export const operationalNotesApi = {
  /**
   * GET /api/operational-notes
   * Recupera lista paginata di note operative
   */
  getAll: async (filters?: NotesFilters): Promise<NotesResponse> => {
    const params = new URLSearchParams();

    if (filters?.skip !== undefined) {
      params.append('skip', filters.skip.toString());
    }
    if (filters?.take !== undefined) {
      params.append('take', filters.take.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }

    const response: AxiosResponse<NotesResponse> = await axios.get(
      `${API_BASE_PATH}/operational-notes`,
      {
        params,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  },

  /**
   * GET /api/operational-notes/:id
   * Recupera una singola nota per ID
   */
  getById: async (id: number): Promise<OperationalNote> => {
    const response: AxiosResponse<OperationalNote> = await axios.get(
      `${API_BASE_PATH}/operational-notes/${id}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  },

  /**
   * POST /api/operational-notes
   * Crea una nuova nota operativa
   */
  create: async (data: CreateNoteRequest): Promise<OperationalNote> => {
    const response: AxiosResponse<OperationalNote> = await axios.post(
      `${API_BASE_PATH}/operational-notes`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  },

  /**
   * PUT /api/operational-notes/:id
   * Aggiorna una nota esistente
   */
  update: async (id: number, data: UpdateNoteRequest): Promise<OperationalNote> => {
    const response: AxiosResponse<OperationalNote> = await axios.put(
      `${API_BASE_PATH}/operational-notes/${id}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  },

  /**
   * DELETE /api/operational-notes/:id
   * Elimina una nota
   */
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_PATH}/operational-notes/${id}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
  }
};

