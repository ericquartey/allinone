/**
 * LiveIndicator Component
 * Feature B - Real-Time Dashboard Indicator
 *
 * Componente per visualizzare lo stato LIVE del polling real-time
 */

import React from 'react';
import { motion } from 'framer-motion';

interface LiveIndicatorProps {
  isLive: boolean;
  lastUpdate?: Date | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTime?: boolean;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  isLive,
  lastUpdate,
  className = '',
  size = 'md',
  showText = true,
  showTime = false,
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Pulse indicator */}
      <div className="relative">
        {isLive ? (
          <>
            {/* Outer pulse ring */}
            <motion.div
              className={`absolute ${sizeClasses[size]} rounded-full bg-green-500 opacity-75`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.75, 0, 0.75],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Inner solid dot */}
            <div className={`${sizeClasses[size]} rounded-full bg-green-500`} />
          </>
        ) : (
          <div className={`${sizeClasses[size]} rounded-full bg-gray-400`} />
        )}
      </div>

      {/* Text label */}
      {showText && (
        <span
          className={`${textSizes[size]} font-semibold ${
            isLive ? 'text-green-600' : 'text-gray-500'
          }`}
        >
          {isLive ? 'LIVE' : 'OFFLINE'}
        </span>
      )}

      {/* Last update time */}
      {showTime && lastUpdate && (
        <span className={`${textSizes[size]} text-gray-500`}>
          {formatTime(lastUpdate)}
        </span>
      )}
    </div>
  );
};

export default LiveIndicator;
