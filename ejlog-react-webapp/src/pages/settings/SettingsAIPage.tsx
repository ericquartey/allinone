// ============================================================================
// EJLOG WMS - AI Configuration Settings Page
// Configurazione API keys e parametri AI (solo admin)
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface AIConfig {
  aiEnabled: boolean;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  contextDepth: string;
  providers: {
    claude: {
      available: boolean;
      apiKeyConfigured: boolean;
      apiKeyMasked: string | null;
    };
    openai: {
      available: boolean;
      apiKeyConfigured: boolean;
      apiKeyMasked: string | null;
    };
  };
  systemStatus: {
    aiAvailable: boolean;
    activeProvider: string;
  };
}

export const SettingsAIPage: React.FC = () => {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<'claude' | 'openai'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load configuration
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ai-config');
      const nextConfig = response.data;
      setConfig(nextConfig);
      if (nextConfig?.providers?.openai?.apiKeyConfigured) {
        setSelectedProvider('openai');
      } else if (nextConfig?.providers?.claude?.apiKeyConfigured) {
        setSelectedProvider('claude');
      } else if (nextConfig?.defaultModel === 'gpt4') {
        setSelectedProvider('openai');
      }
    } catch (error: any) {
      console.error('Error loading AI config:', error);
      toast.error('Errore caricamento configurazione AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Inserisci una API key valida');
      return;
    }

    try {
      setSaving(true);
      setTestResult(null);

      const response = await axios.post('/api/ai-config/api-key', {
        provider: selectedProvider,
        apiKey: apiKey.trim(),
        testConnection: true, // Testa automaticamente
      });

      toast.success(response.data.message || 'API key salvata con successo!');

      setTestResult({
        success: true,
        message: 'Connessione testata e funzionante',
      });

      // If OpenAI selected, set default model to GPT-4 and enable AI
      if (selectedProvider === 'openai') {
        await axios.put('/api/ai-config/settings', {
          aiEnabled: true,
          defaultModel: 'gpt4',
        });
      }

      // Clear API key input
      setApiKey('');

      // Reload configuration
      await loadConfig();

    } catch (error: any) {
      console.error('Error saving API key:', error);
      const errorMsg = error.response?.data?.message || 'Errore salvataggio API key';
      toast.error(errorMsg);

      setTestResult({
        success: false,
        message: errorMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const response = await axios.post('/api/ai-config/test', {
        provider: selectedProvider,
        apiKey: apiKey.trim() || undefined,
      });

      toast.success('Test connessione riuscito!');

      setTestResult({
        success: true,
        message: response.data.message || 'Connessione API funzionante',
      });

    } catch (error: any) {
      console.error('Test failed:', error);
      const errorMsg = error.response?.data?.error || 'Test fallito';
      toast.error(errorMsg);

      setTestResult({
        success: false,
        message: errorMsg,
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center text-red-600 p-4">
        Errore caricamento configurazione
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <KeyIcon className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Configurazione AI Assistant
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestisci API keys e parametri AI (solo amministratori)
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stato Sistema</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Available */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            {config.systemStatus.aiAvailable ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            ) : (
              <XCircleIcon className="w-6 h-6 text-red-600" />
            )}
            <div>
              <p className="font-medium text-gray-900">AI Assistant</p>
              <p className="text-sm text-gray-600">
                {config.systemStatus.aiAvailable ? 'Attivo e funzionante' : 'Non disponibile'}
              </p>
            </div>
          </div>

          {/* Active Provider */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <KeyIcon className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Provider Attivo</p>
              <p className="text-sm text-gray-600 capitalize">
                {config.systemStatus.activeProvider || 'Nessuno'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>

        {/* Provider Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleziona Provider
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedProvider('claude')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedProvider === 'claude'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Claude (Anthropic)</p>
                  <p className="text-xs text-gray-500 mt-1">Raccomandato - ~$18/mese</p>
                </div>
                {config.providers.claude.apiKeyConfigured && (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                )}
              </div>
              {config.providers.claude.apiKeyMasked && (
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  {config.providers.claude.apiKeyMasked}
                </p>
              )}
            </button>

            <button
              onClick={() => setSelectedProvider('openai')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedProvider === 'openai'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-semibold text-gray-900">GPT-4 (OpenAI)</p>
                  <p className="text-xs text-gray-500 mt-1">Alternativa - ~$42/mese</p>
                </div>
                {config.providers.openai.apiKeyConfigured && (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                )}
              </div>
              {config.providers.openai.apiKeyMasked && (
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  {config.providers.openai.apiKeyMasked}
                </p>
              )}
            </button>
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedProvider === 'claude' ? 'Claude API Key' : 'OpenAI API Key'}
            </label>

            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    selectedProvider === 'claude'
                      ? 'sk-ant-api03-...'
                      : 'sk-...'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {selectedProvider === 'claude' ? (
                <>
                  Ottieni la tua API key su:{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </>
              ) : (
                <>
                  Ottieni la tua API key su:{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    platform.openai.com
                  </a>
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSaveApiKey}
              disabled={saving || !apiKey.trim()}
              className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <KeyIcon className="w-5 h-5" />
                  <span>Salva e Testa</span>
                </>
              )}
            </button>

            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {testing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <span>Test Connessione</span>
              )}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-lg border-2 ${
                testResult.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                {testResult.success ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {testResult.success ? 'Test Superato!' : 'Test Fallito'}
                  </p>
                  <p className={`text-sm mt-1 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Box */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Importante - Sicurezza API Keys</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li>Le API keys vengono salvate in modo sicuro nel file .env del server</li>
              <li>Non condividere mai le API keys con terze parti</li>
              <li>Ruota le keys periodicamente (ogni 3-6 mesi)</li>
              <li>Monitora l'uso su console.anthropic.com o platform.openai.com</li>
              <li>Il test automatico verifica la validità prima del salvataggio</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-2">ℹ️ Informazioni Costi</p>
          <p className="mb-2">I costi sono basati sull'uso effettivo (pay-as-you-go):</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>Claude 3.5 Sonnet:</strong> ~$3 per 1M input tokens, ~$15 per 1M output tokens</li>
            <li><strong>GPT-4 Turbo:</strong> ~$10 per 1M input tokens, ~$30 per 1M output tokens</li>
            <li><strong>Stima uso normale:</strong> 100 messaggi/giorno = ~$18/mese (Claude) o ~$42/mese (GPT-4)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsAIPage;
