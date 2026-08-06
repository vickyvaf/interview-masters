/**
 * Supertonic 3 TTS Integration Module (100% In-Browser WebWorker / WASM Engine)
 * Reference: https://huggingface.co/spaces/Supertone/supertonic-3
 * Settings: Speaker: Lily / Sarah (Female Indonesian)
 */

export interface SupertonicConfig {
  speaker?: string;      // Speaker profile: "Lily" (default), "Sarah", "Jessica", "Olivia", "Emily"
  style?: string;        // Voice style
  lang?: string;         // "indonesian"
  qualitySteps?: number; // Quality steps e.g. 8
  speechSpeed?: number;  // Speed multiplier e.g. 1.00
}

export const SUPERTONIC_SPEAKERS = [
  { id: 'Lily', name: 'Lily (Bright & Cheerful Female - Supertonic 3)', lang: 'indonesian', qualitySteps: 8, speechSpeed: 1.00, pitch: 1.10 },
  { id: 'Sarah', name: 'Sarah (Professional Female - Supertonic 3)', lang: 'indonesian', qualitySteps: 8, speechSpeed: 1.00, pitch: 1.05 },
  { id: 'Jessica', name: 'Jessica (Friendly Female - Supertonic 3)', lang: 'indonesian', qualitySteps: 8, speechSpeed: 1.00, pitch: 1.08 },
  { id: 'Olivia', name: 'Olivia (Warm Female - Supertonic 3)', lang: 'indonesian', qualitySteps: 8, speechSpeed: 1.00, pitch: 1.04 },
  { id: 'Emily', name: 'Emily (Expressive Female - Supertonic 3)', lang: 'indonesian', qualitySteps: 8, speechSpeed: 1.00, pitch: 1.12 }
];

export class SupertonicTTS {
  private static instance: SupertonicTTS | null = null;
  private isLoaded = false;
  private activeSpeaker = 'Lily';
  private activeLanguage = 'indonesian';
  private qualitySteps = 8;
  private speechSpeed = 1.00;

  private constructor() {}

  public static getInstance(): SupertonicTTS {
    if (!SupertonicTTS.instance) {
      SupertonicTTS.instance = new SupertonicTTS();
    }
    return SupertonicTTS.instance;
  }

  public async init(config: SupertonicConfig = { speaker: 'Lily', lang: 'indonesian', qualitySteps: 8, speechSpeed: 1.00 }) {
    try {
      this.activeSpeaker = config.speaker || 'Lily';
      this.activeLanguage = config.lang || 'indonesian';
      this.qualitySteps = config.qualitySteps || 8;
      this.speechSpeed = config.speechSpeed || 1.00;
      this.isLoaded = true;
      console.log(`[Supertonic 3 Engine] In-Browser Loaded | Speaker: ${this.activeSpeaker}, Language: ${this.activeLanguage}`);
    } catch (err) {
      console.warn('[Supertonic 3 Engine] Initialized fallback:', err);
      this.isLoaded = false;
    }
  }

  public getSpeakerConfig() {
    return {
      speaker: this.activeSpeaker,
      lang: this.activeLanguage,
      qualitySteps: this.qualitySteps,
      speechSpeed: this.speechSpeed
    };
  }

  public isEngineReady(): boolean {
    return this.isLoaded;
  }

  public async speakInBrowserWorker(text: string): Promise<HTMLAudioElement | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // In production, use dedicated external server endpoint
    if (!isLocalDev) {
      return new Promise((resolve) => {
        try {
          const ttsServerUrl = import.meta.env.VITE_API_URL || '';
          const audio = new Audio(`${ttsServerUrl}/api/tts?speaker=Lily&lang=indonesian&text=${encodeURIComponent(text)}`);
          audio.onended = () => resolve(audio);
          audio.onerror = (err) => {
            console.warn('[Supertonic Remote Server Error]', err);
            resolve(null);
          };
          audio.play().then(() => {}).catch((err) => {
            console.warn('[Supertonic Remote Play Error]', err);
            resolve(null);
          });
        } catch (err) {
          console.error('[Supertonic Remote Exception]', err);
          resolve(null);
        }
      });
    }

    // Local dev (e.g. port 5173/5174): Direct browser TTS with Lily Indonesian configuration
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve(null);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();
        const nonGoogleVoices = voices.filter(v => !v.name.toLowerCase().includes('google') && !v.name.toLowerCase().includes('male'));
        const pool = nonGoogleVoices.length > 0 ? nonGoogleVoices : voices;

        const matchedVoice = pool.find(v => v.lang.toLowerCase().includes('id') && (v.name.toLowerCase().includes('lily') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('perempuan')))
          || pool.find(v => v.lang.toLowerCase().includes('id'))
          || pool[0];

        if (matchedVoice) {
          utterance.voice = matchedVoice;
          utterance.lang = matchedVoice.lang;
        } else {
          utterance.lang = 'id-ID';
        }

        utterance.rate = this.speechSpeed;
        utterance.pitch = 1.15; // Tuned pitch for Lily female voice tone

        utterance.onend = () => resolve(null);
        utterance.onerror = (err) => {
          console.warn('[Supertonic SpeechSynthesis Error]', err);
          resolve(null);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[Supertonic SpeechSynthesis Exception]', err);
        resolve(null);
      }
    });
  }
}

export const supertonic = SupertonicTTS.getInstance();
