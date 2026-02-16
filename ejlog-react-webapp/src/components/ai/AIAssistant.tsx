// ============================================================================
// EJLOG WMS - AI Assistant Component
// Floating Action Button + Chat Widget
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  SparklesIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ArrowPathIcon,
  StopCircleIcon,
} from '@heroicons/react/24/outline';
import avatarSofiaUrl from '../../assets/ai/sofia-avatar.svg';
import { selectAISettings } from '../../features/settings/settingsSlice';
import { useAIChat } from '../../hooks/useAIChat';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '../../hooks/useVoiceSynthesis';

export const AIAssistant: React.FC = () => {
  const aiSettings = useSelector(selectAISettings);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const assistantName = 'Sofia';
  const assistantInitial = 'N';
  const avatarUrl = avatarSofiaUrl;

  // Defensive: Handle undefined aiSettings during initial render
  const safeSettings = aiSettings || {
    enabled: false,
    voiceEnabled: false,
    voiceOutput: true,
    autoTrigger: false,
    language: 'it' as const,
    model: 'claude' as const,
    contextDepth: 'standard' as const,
    showAvatar: true,
  };

  const showAvatar = safeSettings.showAvatar && !avatarError;

  const {
    messages,
    sendMessage,
    isLoading,
    clearHistory,
    cancelRequest,
  } = useAIChat();

  const {
    isListening,
    transcript,
    start: startVoice,
    stop: stopVoice,
    isSupported: voiceSupported,
  } = useVoiceRecognition({
    language: safeSettings.language === 'it' ? 'it-IT' : 'en-US',
    enabled: safeSettings.voiceEnabled,
  });

  // Voice Synthesis (Text-to-Speech) con voce femminile
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported,
    selectedVoice,
  } = useVoiceSynthesis({
    language: safeSettings.language === 'it' ? 'it-IT' : 'en-US',
    enabled: safeSettings.voiceOutput,
    rate: 1.0, // Velocita normale
    pitch: 1.1, // Pitch leggermente piu alto per voce femminile
    volume: 1.0,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-speak AI responses when voiceOutput is enabled
  useEffect(() => {
    if (!safeSettings.voiceOutput || !ttsSupported || messages.length === 0) return;

    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // Only speak AI responses (not user messages)
    if (lastMessage.role === 'assistant' && lastMessage.content) {
      // Small delay to let the message render first
      const timer = setTimeout(() => {
        console.log('[AI Assistant] Speaking response with female voice...');
        speak(lastMessage.content);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [messages, safeSettings.voiceOutput, ttsSupported, speak]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setInputText(transcript);
      // Auto-focus input after voice recognition
      inputRef.current?.focus();
    }
  }, [transcript, isListening]);

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const pageTitle =
      typeof document !== 'undefined' ? document.title : 'EjLog';
    const params = new URLSearchParams(location.search);
    const entityId =
      params.get('machineId') ||
      params.get('drawerId') ||
      params.get('udc') ||
      params.get('listId') ||
      null;
    const entityType =
      params.get('machineId')
        ? 'machine'
        : params.get('drawerId') || params.get('udc')
        ? 'drawer'
        : params.get('listId')
        ? 'list'
        : null;

    const context = {
      page: location.pathname,
      pageData: {
        title: pageTitle,
        url: `${location.pathname}${location.search}`,
      },
      entityId,
      entityType,
      pageState: typeof window !== 'undefined' ? (window as any).__ejlogAiPageData : null,
    };

    const response = await sendMessage(inputText, context);
    const executed = response?.executedActions || [];
    if (executed.length > 0) {
      executed.forEach((action) => {
        const listId = action?.params?.listId;
        if (listId) {
          window.dispatchEvent(new CustomEvent('ai:list-updated', {
            detail: { listId, action: action.action },
          }));
        }
      });
    }
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoice();
    } else {
      startVoice();
    }
  };

  const handleClearChat = () => {
    if (confirm('Sei sicuro di voler cancellare la cronologia della chat?')) {
      clearHistory();
    }
  };

  // Don't render if AI disabled
  if (!safeSettings.enabled) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-50 hover:scale-110"
        aria-label={`${assistantName} Assistant`}
        title={`Apri ${assistantName}`}
      >
        {isOpen ? (
          <XMarkIcon className="w-7 h-7 text-white" />
        ) : showAvatar ? (
          <div className={`w-11 h-11 rounded-full bg-white/90 p-[2px] ${isSpeaking ? 'animate-avatarPulse' : ''}`}>
            <img
              src={avatarUrl}
              alt={`${assistantName} avatar`}
              className="w-full h-full rounded-full object-cover"
              onError={() => setAvatarError(true)}
            />
          </div>
        ) : (
          <SparklesIcon className="w-7 h-7 text-white animate-pulse" />
        )}

        {/* Notification badge (if AI has suggestions) */}
        {!isOpen && safeSettings.autoTrigger && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold animate-bounce">
            !
          </span>
        )}

        {/* Tooltip on hover */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {isOpen ? 'Chiudi' : 'Apri'} {assistantName}
        </div>
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm ${isSpeaking ? 'ring-2 ring-pink-300 ring-offset-2 ring-offset-purple-600 animate-avatarPulse' : ''}`}>
                  {showAvatar ? (
                    <img
                      src={avatarUrl}
                      alt={`${assistantName} avatar`}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="text-purple-600 font-bold text-lg">{assistantInitial}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{assistantName} - EjLog</h3>
                  <p className="text-purple-100 text-xs flex items-center space-x-1">
                    {isSpeaking ? (
                      <>
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                      <span className="flex items-center space-x-1">
                        <span>Sto parlando</span>
                        {selectedVoice && (
                          <span className="text-purple-200 text-[10px]">({selectedVoice.name})</span>
                        )}
                      </span>
                      <span className="ml-2 flex items-center space-x-1">
                        <span className="w-1.5 h-3 bg-pink-300 rounded-sm animate-voiceBar" />
                        <span className="w-1.5 h-4 bg-pink-200 rounded-sm animate-voiceBar delay-100" />
                        <span className="w-1.5 h-2.5 bg-pink-300 rounded-sm animate-voiceBar delay-200" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span>Assistente virtuale pronta ad aiutarti</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Stop Speaking Button - appears when AI is speaking */}
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="text-white/90 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                    title="Ferma voce"
                  >
                    <StopCircleIcon className="w-5 h-5" />
                  </button>
                )}

                {/* Clear Chat Button */}
                <button
                  onClick={handleClearChat}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  title="Cancella cronologia"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-24">
                <div className={`w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center ${isSpeaking ? 'ring-2 ring-pink-300 ring-offset-2 ring-offset-purple-50 animate-avatarPulse' : ''}`}>
                  {showAvatar ? (
                    <img
                      src={avatarUrl}
                      alt={`${assistantName} avatar`}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="text-purple-600 font-bold text-2xl">{assistantInitial}</span>
                  )}
                </div>
                <p className="font-medium text-lg text-gray-700">Ciao, sono {assistantName}. Come posso aiutarti?</p>
                <p className="text-sm mt-2">Posso aiutarti con macchine, cassetti, liste ed errori.</p>
                <div className="mt-4 space-y-2 text-xs text-left max-w-xs mx-auto bg-white p-3 rounded-lg border border-gray-200">
                  <p className="font-semibold text-purple-600">Esempi:</p>
                  <p className="text-gray-600">- "Mostrami lo stato macchina MS-100"</p>
                  <p className="text-gray-600">- "Perche il cassetto 42 e bloccato?"</p>
                  <p className="text-gray-600">- "Come risolvo l'errore E001?"</p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center justify-center">
                        {assistantInitial}
                      </span>
                      <span className="text-xs font-semibold text-purple-600">{assistantName}</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      msg.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm">
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="w-4 h-4 text-purple-600 animate-spin" />
                    <span className="text-xs font-semibold text-purple-600">{assistantName} sta pensando...</span>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
            <div className="flex items-end space-x-2">
              {/* Voice Button */}
              {safeSettings.voiceEnabled && voiceSupported && (
                <button
                  onClick={handleVoiceToggle}
                  disabled={isLoading}
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? 'Ferma ascolto' : 'Attiva input vocale'}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
              )}

              {/* Text Input */}
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isListening
                    ? 'Ascolto in corso...'
                    : 'Scrivi qui... (Shift+Enter per nuova riga)'
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none max-h-24"
                rows={2}
                disabled={isLoading || isListening}
              />

              {/* Send/Stop Button */}
              {isLoading ? (
                <button
                  onClick={cancelRequest}
                  className="flex-shrink-0 w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                  title="Ferma generazione"
                >
                  <StopCircleIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title="Invia messaggio"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Voice indicator */}
            {isListening && (
              <div className="mt-2 text-xs text-red-600 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span className="font-medium">Ascolto in corso... parla ora</span>
              </div>
            )}

            {/* Model info */}
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <span>Modello: {safeSettings.model.toUpperCase()}</span>
              <span>Contesto: {safeSettings.contextDepth}</span>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes avatarPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }
        @keyframes voiceBar {
          0%, 100% {
            height: 0.35rem;
            opacity: 0.6;
          }
          50% {
            height: 0.8rem;
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-avatarPulse {
          animation: avatarPulse 1.2s ease-in-out infinite;
        }
        .animate-voiceBar {
          animation: voiceBar 0.9s ease-in-out infinite;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </>
  );
};

export default AIAssistant;





