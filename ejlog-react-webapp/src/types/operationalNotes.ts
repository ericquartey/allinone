// src/types/operationalNotes.ts

export enum NoteCategory {
  ISSUE = 'ISSUE',
  SOLUTION = 'SOLUTION',
  MAINTENANCE = 'MAINTENANCE',
  GENERAL = 'GENERAL'
}

export enum NotePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum NoteStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export interface OperationalNote {
  id: number;
  title: string;
  description?: string;
  category: NoteCategory;
  priority: NotePriority;
  status: NoteStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
}

export interface CreateNoteRequest {
  title: string;
  description?: string;
  category: NoteCategory;
  priority?: NotePriority;
  tags?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  description?: string;
  category?: NoteCategory;
  priority?: NotePriority;
  status?: NoteStatus;
  tags?: string[];
}

export interface NotesResponse {
  items: OperationalNote[];
  totalCount: number;
}

export interface NotesFilters {
  skip?: number;
  take?: number;
  search?: string;
  category?: NoteCategory;
}
