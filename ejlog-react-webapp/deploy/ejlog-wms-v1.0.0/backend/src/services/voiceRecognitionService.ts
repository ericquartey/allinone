/**
 * Voice Recognition Service
 * Integrazione I/ML Voice Pick System
 * Supporta Web Speech API e configurazione custom per terminali vocali
 */

export type VoiceCommand =
  | 'conferma'
  | 'annulla'
  | 'ripeti'
  | 'avanti'
  | 'indietro'
  | 'aiuto'
  | 'pausa'
  | 'riprendi'
  | 'numero'
  | 'lettera';

export interface VoiceRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  enabled: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  command?: VoiceCommand;
  value?: string | number;
}

export interface VoiceRecognitionCallbacks {
  onResult: (result: VoiceRecognitionResult) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private config: VoiceRecognitionConfig = {
    language: 'it-IT',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    enabled: false,
  };
  private callbacks: VoiceRecognitionCallbacks | null = null;

  // Comandi vocali riconosciuti (italiano)
  private readonly COMMANDS_MAP: Record<string, VoiceCommand> = {
    'conferma': 'conferma',
    'confermo': 'conferma',
    'ok': 'conferma',
    'sì': 'conferma',
    'si': 'conferma',
    'annulla': 'annulla',
    'cancella': 'annulla',
    'no': 'annulla',
    'ripeti': 'ripeti',
    'ancora': 'ripeti',
    'di nuovo': 'ripeti',
    'avanti': 'avanti',
    'prossimo': 'avanti',
    'successivo': 'avanti',
    'indietro': 'indietro',
    'precedente': 'indietro',
    'torna': 'indietro',
    'aiuto': 'aiuto',
    'help': 'aiuto',
    'pausa': 'pausa',
    'stop': 'pausa',
    'riprendi': 'riprendi',
    'continua': 'riprendi',
  };

  constructor() {
    this.initializeWebSpeechAPI();
  }

  /**
   * Inizializza Web Speech API se disponibile
   */
  private initializeWebSpeechAPI(): void {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      this.recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      // @ts-ignore
      this.recognition = new SpeechRecognition();
    }

    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }

    if (this.recognition) {
      this.setupRecognition();
    }
  }

  /**
   * Configura il riconoscimento vocale
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('[VoicePick] Recognition started');
      this.callbacks?.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('[VoicePick] Recognition ended');
      this.callbacks?.onEnd?.();

      // Auto-restart se continuous è true e enabled
      if (this.config.continuous && this.config.enabled) {
        setTimeout(() => {
          if (this.config.enabled) {
            this.start();
          }
        }, 100);
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      console.log('[VoicePick] Transcript:', transcript, 'Confidence:', confidence);

      // Parse command and value
      const parsed = this.parseTranscript(transcript);

      const voiceResult: VoiceRecognitionResult = {
        transcript,
        confidence,
        isFinal,
        command: parsed.command,
        value: parsed.value,
      };

      this.callbacks?.onResult(voiceResult);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[VoicePick] Recognition error:', event.error);
      this.callbacks?.onError(event.error);

      if (event.error === 'no-speech') {
        // Riprova automaticamente dopo silenzio
        if (this.config.enabled) {
          setTimeout(() => this.start(), 500);
        }
      }
    };
  }

  /**
   * Analizza il transcript per estrarre comandi e valori
   */
  private parseTranscript(transcript: string): { command?: VoiceCommand; value?: string | number } {
    // Normalizza il testo
    const normalized = transcript.toLowerCase().trim();

    // Cerca comandi esatti
    for (const [key, command] of Object.entries(this.COMMANDS_MAP)) {
      if (normalized === key || normalized.includes(key)) {
        return { command };
      }
    }

    // Estrai numeri
    const numberMatch = normalized.match(/(\d+)/);
    if (numberMatch) {
      return {
        command: 'numero',
        value: parseInt(numberMatch[1], 10),
      };
    }

    // Estrai lettere singole (per codici a barre verbali)
    const letterMatch = normalized.match(/^([a-z])$/);
    if (letterMatch) {
      return {
        command: 'lettera',
        value: letterMatch[1].toUpperCase(),
      };
    }

    // Nessun comando riconosciuto, ritorna il testo raw
    return { value: normalized };
  }

  /**
   * Avvia il riconoscimento vocale
   */
  public start(callbacks?: VoiceRecognitionCallbacks): void {
    if (!this.recognition) {
      console.error('[VoicePick] Speech Recognition not supported');
      callbacks?.onError('Speech Recognition not supported in this browser');
      return;
    }

    if (callbacks) {
      this.callbacks = callbacks;
    }

    this.config.enabled = true;

    if (!this.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('[VoicePick] Failed to start recognition:', error);
        if (error instanceof Error) {
          this.callbacks?.onError(error.message);
        }
      }
    }
  }

  /**
   * Ferma il riconoscimento vocale
   */
  public stop(): void {
    this.config.enabled = false;

    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Mette in pausa il riconoscimento
   */
  public pause(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Riprende il riconoscimento
   */
  public resume(): void {
    if (this.config.enabled && !this.isListening) {
      this.start();
    }
  }

  /**
   * Pronuncia un testo (Text-to-Speech)
   */
  public speak(text: string, options?: { lang?: string; rate?: number; pitch?: number; volume?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        console.error('[VoicePick] Speech Synthesis not supported');
        reject(new Error('Speech Synthesis not supported'));
        return;
      }

      // Cancella eventuali speech in corso
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang || this.config.language;
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;

      utterance.onend = () => {
        console.log('[VoicePick] Speech ended');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[VoicePick] Speech error:', event.error);
        reject(new Error(event.error));
      };

      console.log('[VoicePick] Speaking:', text);
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Cancella la sintesi vocale in corso
   */
  public cancelSpeech(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Aggiorna la configurazione
   */
  public updateConfig(config: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  /**
   * Ottiene lo stato corrente
   */
  public getState(): { isListening: boolean; isEnabled: boolean; isSupported: boolean } {
    return {
      isListening: this.isListening,
      isEnabled: this.config.enabled,
      isSupported: this.recognition !== null,
    };
  }

  /**
   * Test del microfono
   */
  public async testMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('[VoicePick] Microphone test failed:', error);
      return false;
    }
  }

  /**
   * Pronuncia un feedback sonoro
   */
  public playFeedback(type: 'success' | 'error' | 'warning' | 'info'): void {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Frequenze diverse per feedback diversi
    switch (type) {
      case 'success':
        oscillator.frequency.value = 800; // Note più alta
        gainNode.gain.value = 0.3;
        break;
      case 'error':
        oscillator.frequency.value = 300; // Note più bassa
        gainNode.gain.value = 0.5;
        break;
      case 'warning':
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.4;
        break;
      case 'info':
        oscillator.frequency.value = 500;
        gainNode.gain.value = 0.3;
        break;
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2); // Beep breve 200ms
  }
}

// Singleton instance
export const voiceRecognitionService = new VoiceRecognitionService();
export default voiceRecognitionService;
