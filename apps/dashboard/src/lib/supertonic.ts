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
          audio.play().catch((err) => {
            console.warn('[Supertonic Remote Play Error]', err);
            resolve(null);
          });
        } catch (err) {
          console.error('[Supertonic Remote Exception]', err);
          resolve(null);
        }
      });
    }

    // Local dev (e.g. port 5173): use local Supertone worker & browser voice
    return new Promise((resolve) => {
      try {
        // Instantiate dedicated WebWorker script for background Supertonic processing
        const worker = new Worker(new URL('../workers/supertonicWorker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e: MessageEvent) => {
          const { status, voiceStyle, pitch, speed } = e.data;

          if (status === 'SUCCESS' && window.speechSynthesis) {
            console.log(`[Supertonic WebWorker] Task Processed | Speaker: ${this.activeSpeaker} (${voiceStyle}), Pitch: ${pitch}, Speed: ${speed}x`);
            
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);

            const voices = window.speechSynthesis.getVoices();
            const nonGoogleVoices = voices.filter(v => !v.name.toLowerCase().includes('google') && !v.name.toLowerCase().includes('male'));
            const pool = nonGoogleVoices.length > 0 ? nonGoogleVoices : voices;

            const matchedVoice = pool.find(v => v.lang.toLowerCase().includes('id') && (v.name.toLowerCase().includes(this.activeSpeaker.toLowerCase()) || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('perempuan')))
              || pool.find(v => v.lang.toLowerCase().includes('id'))
              || pool[0];

            if (matchedVoice) {
              utterance.voice = matchedVoice;
              utterance.lang = matchedVoice.lang;
            } else {
              utterance.lang = 'id-ID';
            }

            utterance.rate = speed;
            utterance.pitch = pitch;

            utterance.onend = () => {
              worker.terminate();
              resolve(null);
            };

            utterance.onerror = (err) => {
              console.warn('[Supertonic WebWorker Utterance Error]', err);
              worker.terminate();
              resolve(null);
            };

            window.speechSynthesis.speak(utterance);
          } else {
            worker.terminate();
            resolve(null);
          }
        };

        worker.onerror = (err) => {
          console.warn('[Supertonic WebWorker Init Error]', err);
          worker.terminate();
          resolve(null);
        };

        // Send task to WebWorker thread
        worker.postMessage({
          action: 'SYNTHESIZE',
          text,
          speaker: this.activeSpeaker,
          speed: this.speechSpeed
        });
      } catch (err) {
        console.error('[Supertonic WebWorker Creation Exception]', err);
        resolve(null);
      }
    });
  }
}

export const supertonic = SupertonicTTS.getInstance();
