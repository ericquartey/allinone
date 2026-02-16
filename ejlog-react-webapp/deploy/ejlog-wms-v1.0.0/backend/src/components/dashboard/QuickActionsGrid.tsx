// ============================================================================
// QuickActionsGrid Component - Dashboard Quick Actions
// Griglia di azioni rapide con icone grandi e descrizioni
// ============================================================================

import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export interface QuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  onClick: () => void;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
  orange: {
    bg: 'bg-orange-50 hover:bg-orange-100',
    icon: 'text-orange-600',
    border: 'border-orange-200',
  },
  red: {
    bg: 'bg-red-50 hover:bg-red-100',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
  cyan: {
    bg: 'bg-cyan-50 hover:bg-cyan-100',
    icon: 'text-cyan-600',
    border: 'border-cyan-200',
  },
};

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions }) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-ferretto-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Azioni Rapide</h2>
        <p className="text-sm text-gray-500">
          Accesso veloce alle funzionalità principali
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          const colors = colorVariants[action.color];

          return (
            <button
              key={idx}
              onClick={action.onClick}
              className={clsx(
                'group relative flex items-start gap-4 rounded-lg border p-4 text-left transition-all duration-300',
                colors.bg,
                colors.border,
                'hover:scale-105 hover:shadow-ferretto-md'
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Icon */}
              <div className={clsx('flex-shrink-0 transition-transform duration-300 group-hover:scale-110')}>
                <div className="rounded-lg bg-white p-3 shadow-ferretto-sm">
                  <Icon className={clsx('h-6 w-6', colors.icon)} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="mb-1 text-base font-semibold text-gray-900">
                  {action.label}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {action.description}
                </p>
              </div>

              {/* Hover arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                <svg
                  className={clsx('h-5 w-5', colors.icon)}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsGrid;
