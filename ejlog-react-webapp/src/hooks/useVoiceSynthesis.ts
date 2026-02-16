// ============================================================================
// EJLOG WMS - Voice Synthesis Hook
// Text-to-Speech con voce femminile italiana fluida
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceSynthesisOptions {
  language?: string;
  enabled?: boolean;
  rate?: number; // 0.1 - 10 (default 1)
  pitch?: number; // 0 - 2 (default 1)
  volume?: number; // 0 - 1 (default 1)
}

interface VoiceSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

export const useVoiceSynthesis = (
  options: VoiceSynthesisOptions = {}
): VoiceSynthesisReturn => {
  const {
    language = 'it-IT',
    enabled = true,
    rate = 1.0,
    pitch = 1.1, // Leggermente piu alto per voce femminile
    volume = 1.0,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if browser supports Speech Synthesis
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      setAvailableVoices(voices);

      // Trova la voce femminile italiana migliore
      const italianVoices = voices.filter(
        (voice) => voice.lang.startsWith('it') || voice.lang.startsWith('it-IT')
      );

      // Preferenza per voci femminili italiane
      const femaleVoice =
        italianVoices.find((v) => v.name.toLowerCase().includes('elsa')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('lucia')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('silvia')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('paola')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('carla')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('alice')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('female')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('donna')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('google')) ||
        italianVoices.find((v) => v.name.toLowerCase().includes('microsoft')) ||
        italianVoices[0]; // Fallback alla prima voce italiana

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        console.log('[Voice] Voce femminile italiana selezionata:', femaleVoice.name);
      } else {
        console.warn('[Voice] Nessuna voce italiana trovata');
      }
    };

    // Le voci potrebbero non essere disponibili immediatamente
    loadVoices();
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  // Speak function
  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !enabled || !synthRef.current) {
        console.warn('[Voice] Nessuna voce italiana trovata');
        return;
      }

      // Stop any ongoing speech
      synthRef.current.cancel();

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Set voice (prefer selected voice)
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Set language
      utterance.lang = language;

      // Set parameters for a pleasant female voice
      utterance.rate = rate; // Velocita normale
      utterance.pitch = pitch; // Pitch leggermente piu alto per voce femminile
      utterance.volume = volume;

      // Event listeners
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error('[Voice] Errore:', event.error);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      // Start speaking
      synthRef.current.speak(utterance);
    },
    [isSupported, enabled, language, rate, pitch, volume, selectedVoice]
  );

  // Stop speaking
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
    }
  }, [isSpeaking]);

  // Resume speaking
  const resume = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
    }
  }, [isPaused]);

  // Manual voice selection
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    availableVoices,
    selectedVoice,
    setVoice,
  };
};



