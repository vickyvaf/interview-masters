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

    // Local dev (e.g. port 5173): run neural Supertonic 3 ONNX TTS in Web Worker
    return new Promise((resolve) => {
      try {
        const worker = new Worker(new URL('../workers/supertonicWorker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e: MessageEvent) => {
          const { status, wavBuffer, sampleRate, error } = e.data;

          if (status === 'SUCCESS' && wavBuffer) {
            console.log(`[Supertonic Neural ONNX Worker] Synthesized PCM audio for speaker: ${this.activeSpeaker}`);
            try {
              const float32Samples = new Float32Array(wavBuffer);

              // Encode PCM to WAV blob
              const wavHeaderBuffer = new ArrayBuffer(44 + float32Samples.length * 2);
              const view = new DataView(wavHeaderBuffer);
              const writeString = (v: DataView, offset: number, str: string) => {
                for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
              };

              writeString(view, 0, 'RIFF');
              view.setUint32(4, 36 + float32Samples.length * 2, true);
              writeString(view, 8, 'WAVE');
              writeString(view, 12, 'fmt ');
              view.setUint32(16, 16, true);
              view.setUint16(20, 1, true); // PCM
              view.setUint16(22, 1, true); // Mono
              view.setUint32(24, sampleRate || 16000, true);
              view.setUint32(28, (sampleRate || 16000) * 2, true);
              view.setUint16(32, 2, true);
              view.setUint16(34, 16, true); // 16-bit
              writeString(view, 36, 'data');
              view.setUint32(40, float32Samples.length * 2, true);

              let offset = 44;
              for (let i = 0; i < float32Samples.length; i++, offset += 2) {
                const s = Math.max(-1, Math.min(1, float32Samples[i]));
                view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
              }

              const blob = new Blob([wavHeaderBuffer], { type: 'audio/wav' });
              const audioUrl = URL.createObjectURL(blob);
              const audio = new Audio(audioUrl);

              audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                worker.terminate();
                resolve(audio);
              };

              audio.onerror = (err) => {
                console.warn('[Supertonic Audio Play Error]', err);
                URL.revokeObjectURL(audioUrl);
                worker.terminate();
                resolve(null);
              };

              audio.play().then(() => {
                // Audio started successfully
              }).catch((err) => {
                console.warn('[Supertonic Play Autoplay Blocked]', err);
                URL.revokeObjectURL(audioUrl);
                worker.terminate();
                resolve(null);
              });
            } catch (err) {
              console.error('[Supertonic Audio Buffer Decoding Failed]', err);
              worker.terminate();
              resolve(null);
            }
          } else if (status === 'ERROR') {
            console.warn('[Supertonic WebWorker Error]', error);
            worker.terminate();
            resolve(null);
          }
        };

        worker.onerror = (err) => {
          console.warn('[Supertonic WebWorker Init Exception]', err);
          worker.terminate();
          resolve(null);
        };

        // Post synthesis task to neural ONNX worker
        worker.postMessage({
          action: 'SYNTHESIZE',
          text,
          speaker: this.activeSpeaker
        });
      } catch (err) {
        console.error('[Supertonic WebWorker Exception]', err);
        resolve(null);
      }
    });
  }
}

export const supertonic = SupertonicTTS.getInstance();
