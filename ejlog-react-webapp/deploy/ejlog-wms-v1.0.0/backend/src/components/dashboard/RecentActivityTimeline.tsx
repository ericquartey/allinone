// ============================================================================
// RecentActivityTimeline Component - Dashboard Activity Feed
// Timeline delle attività recenti con animazioni e icons
// ============================================================================

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import clsx from 'clsx';

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  user?: string;
}

interface RecentActivityTimelineProps {
  activities: Activity[];
  maxItems?: number;
  loading?: boolean;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    border: 'border-green-300',
    dot: 'bg-green-500',
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    border: 'border-purple-300',
    dot: 'bg-purple-500',
  },
  orange: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
  },
  red: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    border: 'border-red-300',
    dot: 'bg-red-500',
  },
};

const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  activities,
  maxItems = 5,
  loading = false,
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-ferretto-md">
        <div className="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="space-y-4">
          {[...Array(maxItems)].map((_, idx) => (
            <div key={idx} className="flex gap-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayedActivities.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-ferretto-md">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Attività Recenti</h2>
          <p className="text-sm text-gray-500">Ultimi eventi del sistema</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-gray-100 p-4">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-center text-gray-600">Nessuna attività recente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-ferretto-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Attività Recenti</h2>
        <p className="text-sm text-gray-500">Ultimi {maxItems} eventi del sistema</p>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Activities */}
        <div className="space-y-6">
          {displayedActivities.map((activity, idx) => {
            const Icon = activity.icon;
            const colors = colorVariants[activity.color];
            const timeAgo = formatDistanceToNow(activity.timestamp, {
              addSuffix: true,
              locale: it,
            });

            return (
              <div
                key={activity.id}
                className="relative flex gap-4 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110',
                      colors.bg
                    )}
                  >
                    <Icon className={clsx('h-5 w-5', colors.icon)} />
                  </div>
                  {/* Connecting dot */}
                  {idx < displayedActivities.length - 1 && (
                    <div className={clsx('absolute left-1/2 top-full h-6 w-1 -translate-x-1/2', colors.dot)} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {activity.title}
                    </h3>
                    <time className="flex-shrink-0 text-xs text-gray-500" dateTime={activity.timestamp.toISOString()}>
                      {timeAgo}
                    </time>
                  </div>

                  <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                    {activity.description}
                  </p>

                  {activity.user && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>{activity.user}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* View all link */}
      {activities.length > maxItems && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <button className="w-full rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
            Visualizza tutte le attività ({activities.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivityTimeline;
