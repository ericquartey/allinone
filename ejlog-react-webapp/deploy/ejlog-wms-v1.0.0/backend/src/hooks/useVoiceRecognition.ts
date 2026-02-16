/**
 * useVoiceRecognition Hook
 * Custom React hook per integrare il Voice Recognition Service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import voiceRecognitionService, {
  VoiceRecognitionResult,
  VoiceCommand,
  VoiceRecognitionConfig,
} from '../services/voiceRecognitionService';

export interface UseVoiceRecognitionOptions {
  onCommand?: (command: VoiceCommand, value?: string | number) => void;
  onTranscript?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  language?: string;
}

export interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  lastCommand: VoiceCommand | null;
  lastValue: string | number | null;
  error: string | null;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  speak: (text: string) => Promise<void>;
  playFeedback: (type: 'success' | 'error' | 'warning' | 'info') => void;
  testMicrophone: () => Promise<boolean>;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}): UseVoiceRecognitionReturn {
  const {
    onCommand,
    onTranscript,
    onError,
    autoStart = false,
    language = 'it-IT',
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [lastValue, setLastValue] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCommandRef = useRef(onCommand);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  // Aggiorna refs quando le callback cambiano
  useEffect(() => {
    onCommandRef.current = onCommand;
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onCommand, onTranscript, onError]);

  // Inizializza il servizio
  useEffect(() => {
    const state = voiceRecognitionService.getState();
    setIsSupported(state.isSupported);

    if (language) {
      voiceRecognitionService.updateConfig({ language });
    }

    // Auto-start se richiesto
    if (autoStart && state.isSupported) {
      handleStart();
    }

    return () => {
      // Cleanup al dismount
      voiceRecognitionService.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResult = useCallback((result: VoiceRecognitionResult) => {
    setTranscript(result.transcript);
    setConfidence(result.confidence);
    setError(null);

    // Aggiorna ultimo comando e valore
    if (result.command) {
      setLastCommand(result.command);
      setLastValue(result.value || null);

      // Chiama callback se presente
      if (result.isFinal) {
        onCommandRef.current?.(result.command, result.value);
      }
    }

    // Chiama callback transcript
    if (result.isFinal) {
      onTranscriptRef.current?.(result.transcript, result.confidence);
    }
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setIsListening(false);
    onErrorRef.current?.(errorMsg);
  }, []);

  const handleStart = useCallback(() => {
    setIsListening(true);
    setError(null);
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    voiceRecognitionService.start({
      onResult: handleResult,
      onError: handleError,
      onStart: handleStart,
      onEnd: handleEnd,
    });
  }, [handleResult, handleError, handleStart, handleEnd]);

  const stop = useCallback(() => {
    voiceRecognitionService.stop();
    setIsListening(false);
  }, []);

  const pause = useCallback(() => {
    voiceRecognitionService.pause();
    setIsListening(false);
  }, []);

  const resume = useCallback(() => {
    voiceRecognitionService.resume();
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    try {
      await voiceRecognitionService.speak(text);
    } catch (err) {
      console.error('[useVoiceRecognition] Speech error:', err);
      throw err;
    }
  }, []);

  const playFeedback = useCallback((type: 'success' | 'error' | 'warning' | 'info') => {
    voiceRecognitionService.playFeedback(type);
  }, []);

  const testMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      return await voiceRecognitionService.testMicrophone();
    } catch (err) {
      console.error('[useVoiceRecognition] Microphone test failed:', err);
      return false;
    }
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    lastCommand,
    lastValue,
    error,
    start,
    stop,
    pause,
    resume,
    speak,
    playFeedback,
    testMicrophone,
  };
}

export default useVoiceRecognition;
