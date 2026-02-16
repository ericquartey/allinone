import React, { FC, useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Check } from 'lucide-react';

// Types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  appName?: string;
  appIcon?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const PWAInstallPrompt: FC<PWAInstallPromptProps> = ({
  appName = 'EjLog WMS',
  appIcon = '/logo.png',
  onInstall,
  onDismiss
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user dismissed before
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      const dismissedDate = dismissed ? new Date(dismissed) : null;
      const daysSinceDismissal = dismissedDate
        ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      // Show prompt if not dismissed recently (wait 7 days)
      if (!dismissed || daysSinceDismissal > 7) {
        // Delay showing to avoid overwhelming user immediately
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      console.log('PWA installed successfully');
      onInstall?.();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS, show manual instructions
      if (platform === 'ios') {
        setShowPrompt(true);
      }
      return;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted installation');
        onInstall?.();
      } else {
        console.log('User dismissed installation');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Installation error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
    onDismiss?.();
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  // iOS Manual Instructions
  if (platform === 'ios') {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{appName}</h3>
                <p className="text-blue-100 text-sm">Installa come App</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-blue-500 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <p className="text-gray-700">
              Installa {appName} sul tuo iPhone per un'esperienza migliore:
            </p>

            {/* Instructions */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tocca il pulsante Condividi</p>
                  <p className="text-gray-600">
                    In basso al centro (Safari) o in alto a destra (Chrome)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Seleziona "Aggiungi a Home"</p>
                  <p className="text-gray-600">
                    Scorri verso il basso per trovare l'opzione
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Conferma</p>
                  <p className="text-gray-600">
                    Tocca "Aggiungi" per completare l'installazione
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <p className="font-medium text-blue-900 text-sm">Vantaggi:</p>
              <ul className="space-y-1 text-xs text-blue-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Accesso rapido dalla schermata home
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Funziona offline
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Notifiche push
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop Prompt
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                {platform === 'desktop' ? (
                  <Monitor className="w-6 h-6 text-blue-600" />
                ) : (
                  <Smartphone className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{appName}</h3>
                <p className="text-blue-100 text-sm">Installa come App</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-blue-500 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            Installa {appName} sul tuo {platform === 'desktop' ? 'computer' : 'dispositivo'} per un'esperienza migliore.
          </p>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
            <p className="font-medium text-gray-900 text-sm">Vantaggi:</p>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                Accesso rapido {platform === 'desktop' ? 'dal desktop' : 'dalla schermata home'}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                Funziona anche offline
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                Notifiche push in tempo reale
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                Esperienza app nativa
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Più tardi
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isInstalling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Installa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact Install Button (for header/navbar)
export const PWAInstallButton: FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Installation error:', error);
    }
  };

  if (isInstalled || !deferredPrompt) {
    return null;
  }

  if (compact) {
    return (
      <button
        onClick={handleInstall}
        className="p-2 rounded-lg hover:bg-gray-100 text-blue-600"
        title="Installa App"
      >
        <Download className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
    >
      <Download className="w-5 h-5" />
      Installa App
    </button>
  );
};

// Add animation CSS
const styles = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
