// src/components/notes/NoteCard.jsx

import React from 'react';
import {
  NoteCategory,
  NotePriority,
  NoteStatus
} from '../../types/operationalNotes';
import {
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export function NoteCard({  note, onEdit, onDelete, onUpdateStatus  }: any): JSX.Element {
  // Configurazione categorie
  const categoryConfig = {
    [NoteCategory.ISSUE]: {
      label: 'Problema',
      emoji: '🔴',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    },
    [NoteCategory.SOLUTION]: {
      label: 'Soluzione',
      emoji: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    [NoteCategory.MAINTENANCE]: {
      label: 'Manutenzione',
      emoji: '🔧',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    [NoteCategory.GENERAL]: {
      label: 'Generale',
      emoji: '📝',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700'
    }
  };

  // Configurazione priorità
  const priorityConfig = {
    [NotePriority.LOW]: {
      label: 'Bassa',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600'
    },
    [NotePriority.MEDIUM]: {
      label: 'Media',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700'
    },
    [NotePriority.HIGH]: {
      label: 'Alta',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700'
    },
    [NotePriority.CRITICAL]: {
      label: 'Critica',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700'
    }
  };

  // Configurazione stati
  const statusConfig = {
    [NoteStatus.OPEN]: {
      label: 'Aperto',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700'
    },
    [NoteStatus.IN_PROGRESS]: {
      label: 'In Corso',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700'
    },
    [NoteStatus.RESOLVED]: {
      label: 'Risolto',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700'
    },
    [NoteStatus.CLOSED]: {
      label: 'Chiuso',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600'
    }
  };

  const category = categoryConfig[note.category] || categoryConfig[NoteCategory.GENERAL];
  const priority = priorityConfig[note.priority] || priorityConfig[NotePriority.MEDIUM];
  const status = statusConfig[note.status] || statusConfig[NoteStatus.OPEN];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`bg-white shadow rounded-lg p-5 border-l-4 ${category.borderColor} hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{category.emoji}</span>
            <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.bgColor} ${category.textColor}`}>
              {category.label}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.bgColor} ${priority.textColor}`}>
              Priorità: {priority.label}
            </span>
            <button
              onClick={() => {
                const statusOrder = [NoteStatus.OPEN, NoteStatus.IN_PROGRESS, NoteStatus.RESOLVED, NoteStatus.CLOSED];
                const currentIndex = statusOrder.indexOf(note.status);
                const nextIndex = (currentIndex + 1) % statusOrder.length;
                onUpdateStatus(statusOrder[nextIndex]);
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor} hover:opacity-80 transition-opacity cursor-pointer`}
              title="Clicca per cambiare stato"
            >
              {status.label}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(note)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifica"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Elimina"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {note.description && (
        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{note.description}</p>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <TagIcon className="h-4 w-4 text-gray-400" />
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {note.createdBy && (
            <div className="flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              <span>{note.createdBy}</span>
            </div>
          )}
          {note.createdAt && (
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatDate(note.createdAt)}</span>
            </div>
          )}
        </div>
        {note.updatedAt && note.updatedAt !== note.createdAt && (
          <span className="text-xs italic">
            Aggiornato: {formatDate(note.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
