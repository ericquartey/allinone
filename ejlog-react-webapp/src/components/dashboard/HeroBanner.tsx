// ============================================================================
// HeroBanner Component - Dashboard Hero Section
// Banner di benvenuto con gradiente Ferretto, data/ora live e pattern decorativo
// ============================================================================

import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, Shield, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface HeroBannerProps {
  userName?: string;
  userRole?: string;
  isSuperuser?: boolean;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  userName = 'Operatore',
  userRole = 'VIEWER',
  isSuperuser = false
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = format(currentTime, 'EEEE, d MMMM yyyy', { locale: it });
  const formattedTime = format(currentTime, 'HH:mm:ss');

  // Role display mapping
  const roleDisplayMap: Record<string, string> = {
    'ADMIN': 'Amministratore',
    'SUPERVISOR': 'Supervisore',
    'OPERATOR': 'Operatore',
    'VIEWER': 'Visualizzatore'
  };

  const roleDisplay = roleDisplayMap[userRole] || userRole;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ferretto-red via-ferretto-red-dark to-ferretto-dark shadow-ferretto-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Decorative circles */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white opacity-5" />
      <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white opacity-5" />

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10 lg:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Welcome Section */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3 text-white/80">
              <User className="h-5 w-5" />
              <span className="text-sm font-medium">Benvenuto</span>
              {isSuperuser && (
                <div className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-3 py-1 border border-yellow-400/30">
                  <ShieldCheck className="h-4 w-4 text-yellow-300" />
                  <span className="text-xs font-semibold text-yellow-100">Superuser</span>
                </div>
              )}
            </div>
            <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl lg:text-6xl animate-fade-in">
              {userName}
            </h1>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-white/70" />
              <p className="text-base text-white/80 font-medium">
                {roleDisplay}
              </p>
            </div>
            <p className="text-lg text-white/90 md:text-xl">
              Dashboard EjLog WMS - Sistema di Gestione Magazzino
            </p>
          </div>

          {/* Date/Time Section */}
          <div className="flex flex-col gap-3 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">Data</p>
                <p className="text-sm font-semibold text-white capitalize">
                  {formattedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">Orario</p>
                <p className="text-2xl font-bold tabular-nums text-white">
                  {formattedTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom shine effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
};

export default HeroBanner;
