/**
 * PWA Info Page
 * Feature D - Progressive Web App Configuration
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Download, Wifi, WifiOff, CheckCircle } from 'lucide-react';

export const PWAInfo: React.FC = () => {
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  const isOnline = navigator.onLine;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Progressive Web App (PWA)</h1>
        <p className="text-lg text-gray-600">Feature D - EjLog WMS come App Installabile</p>
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-8 h-8 text-blue-500" />
            <h3 className="text-xl font-bold text-gray-800">Modalità</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {isPWA ? 'App Mode' : 'Browser Mode'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {isPWA
              ? 'L\'app è installata sul dispositivo'
              : 'Usa "Aggiungi a Home Screen" per installare'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            {isOnline ? (
              <Wifi className="w-8 h-8 text-green-500" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-500" />
            )}
            <h3 className="text-xl font-bold text-gray-800">Connessione</h3>
          </div>
          <p className={`text-3xl font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {isOnline ? 'Dati sincronizzati' : 'Modalità offline attiva'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-8 h-8 text-purple-500" />
            <h3 className="text-xl font-bold text-gray-800">Cache</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">Attiva</p>
          <p className="text-sm text-gray-600 mt-2">Service Worker registrato</p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Caratteristiche PWA</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Installabile',
              description: 'Aggiungi l\'app alla home screen del tuo dispositivo',
            },
            {
              title: 'Offline Support',
              description: 'Continua a lavorare anche senza connessione internet',
            },
            {
              title: 'Fast Loading',
              description: 'Cache intelligente per caricamenti istantanei',
            },
            {
              title: 'Auto Updates',
              description: 'Aggiornamenti automatici in background',
            },
            {
              title: 'Push Notifications',
              description: 'Ricevi notifiche anche quando l\'app è chiusa',
            },
            {
              title: 'Responsive',
              description: 'Funziona su desktop, tablet e smartphone',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
            >
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Installation Guide */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Come Installare l'App</h2>

        <div className="space-y-6">
          {/* Chrome Desktop */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Chrome (Desktop)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Clicca sull'icona "Installa" nella barra degli indirizzi (⊕)</li>
              <li>Oppure: Menu (⋮) → "Installa EjLog WMS"</li>
              <li>Conferma l'installazione</li>
              <li>L'app si aprirà in una finestra dedicata</li>
            </ol>
          </div>

          {/* iOS */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">iOS (Safari)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Apri il sito con Safari</li>
              <li>Tocca il pulsante "Condividi" (□↑)</li>
              <li>Scorri e tocca "Aggiungi a Home"</li>
              <li>Conferma con "Aggiungi"</li>
            </ol>
          </div>

          {/* Android */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Android (Chrome)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Tocca il menu (⋮) in alto a destra</li>
              <li>Seleziona "Aggiungi a Home"</li>
              <li>Conferma l'installazione</li>
              <li>L'icona apparirà nella home screen</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Implementation Code */}
      <div className="bg-gray-900 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Configurazione PWA</h3>
        <p className="text-gray-400 text-sm mb-4">
          Vedi <code className="bg-gray-800 px-2 py-1 rounded">IMPLEMENTATION_GUIDE.md</code> linea 156-250 per la configurazione completa
        </p>
        <pre className="text-xs overflow-x-auto">
{`// manifest.json
{
  "name": "EjLog WMS",
  "short_name": "EjLog",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}`}
        </pre>
      </div>
    </div>
  );
};

export default PWAInfo;
