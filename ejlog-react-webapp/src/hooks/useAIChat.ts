// ============================================================================
// Custom Hook - AI Chat Management
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAISettings } from '../features/settings/settingsSlice';
import type { Message, AIChatRequest, AIChatResponse } from '../types/ai';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const getAIBaseCandidates = (): string[] => {
  const fromEnv = import.meta.env.VITE_AI_API_BASE_URL as string | undefined;
  const candidates = [
    fromEnv,
    '/api/ai',
    'http://localhost:7077/api/ai',
    'https://localhost:7079/api/ai',
  ].filter(Boolean) as string[];

  return Array.from(new Set(candidates.map(normalizeBaseUrl)));
};

export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = 'ejlog_ai_chat_history';

  const aiSettings = useSelector(selectAISettings);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Defensive: Handle undefined aiSettings
  const safeSettings = aiSettings || {
    enabled: false,
    voiceEnabled: false,
    voiceOutput: true,
    autoTrigger: false,
    language: 'it' as const,
    model: 'claude' as const,
    contextDepth: 'standard' as const,
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load persisted chat history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load AI chat history:', err);
    }
  }, []);

  // Persist chat history
  useEffect(() => {
    try {
      const trimmed = messages.slice(-50);
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('Failed to persist AI chat history:', err);
    }
  }, [messages]);

  /**
   * Send message to AI
   */
  const sendMessage = useCallback(
    async (content: string, context?: any) => {
      if (!content.trim()) {
        console.warn('Empty message, skipping');
        return null;
      }

      if (!safeSettings.enabled) {
        setError('AI Assistant is disabled. Enable it in Settings.');
        return null;
      }

      const systemPrompt =
        safeSettings.language === 'it'
          ? 'Sei Sofia, l\'amica assistente magazzino di EjLog. Rispondi in italiano con tono femminile, professionale e umano. Aiuti l\'utente a conoscere meglio il verticale in ogni sua sfaccettatura. Sii chiara, fluida e concisa. Usa frasi naturali, evita ripetizioni e aggiungi una breve frase empatica quando serve. Quando mancano dati, fai una sola domanda mirata.'
          : 'You are Sofia, EjLog\'s warehouse assistant. Reply in a warm, professional, human tone. Help the user understand the vertical warehouse system in every facet. Be clear, fluent, and concise. Use natural phrasing and avoid repetition. If data is missing, ask one focused question.';

      const systemMessage: Message = {
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now(),
      };

      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Prepare request
        const baseContext = {
          settings: {
            contextDepth: safeSettings.contextDepth,
          },
          conversationHistory: [systemMessage, ...messages.slice(-12), userMessage],
        };
        const requestPayload: AIChatRequest = {
          message: content.trim(),
          context: context ? { ...baseContext, ...context } : baseContext,
          model: safeSettings.model,
          language: safeSettings.language,
        };

        const postWithTimeout = async (url: string) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('ejlog_token') || ''}`,
              },
              body: JSON.stringify(requestPayload),
              signal: controller.signal,
            });
            return response;
          } finally {
            clearTimeout(timer);
          }
        };

        const candidates = getAIBaseCandidates();
        let response: Response | null = null;
        let lastError: string | null = null;

        for (const baseUrl of candidates) {
          try {
            const attempt = await postWithTimeout(`${baseUrl}/chat`);
            if (attempt.ok) {
              response = attempt;
              break;
            }
            if (attempt.status === 404 || attempt.status === 502 || attempt.status === 503) {
              lastError = `HTTP ${attempt.status}`;
              continue;
            }
            const errorData = await attempt.json().catch(() => ({}));
            throw new Error(
              errorData.message || `AI request failed with status ${attempt.status}`
            );
          } catch (err: any) {
            lastError = err?.message || 'AI request failed';
          }
        }

        if (!response) {
          throw new Error(lastError || 'AI request failed');
        }

        const data: AIChatResponse = await response.json();

        // Add AI response
        const aiMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        return data;

      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('AI request aborted');
          return null;
        }

        console.error('AI chat error:', err);
        const errorMessage = err.message || 'Failed to communicate with AI service';
        setError(errorMessage);

        // Add error message to chat
        const errorMsg: Message = {
          role: 'assistant',
          content: `Mi dispiace, ho avuto un problema: ${errorMessage}. Riproviamo?`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return null;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [safeSettings, messages]
  );

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(storageKey);

    // Cancel any pending TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  /**
   * Cancel ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }

    // Cancel TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  /**
   * Retry last message
   */
  const retryLast = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === 'user');

    if (lastUserMessage) {
      // Remove last assistant message if exists
      setMessages((prev) => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].role === 'assistant') {
          return prev.slice(0, -1);
        }
        return prev;
      });

      // Resend
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    sendMessage,
    clearHistory,
    cancelRequest,
    retryLast,
    isLoading,
    error,
  };
};

