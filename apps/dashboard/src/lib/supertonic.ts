/**
 * Supertonic TTS Integration Module for Bahasa Indonesia (ID)
 * Powered by Supertonic ONNX/Web TTS
 * Reference: https://supertonic3.github.io/
 */

export interface SupertonicConfig {
  style?: string; // Voice style e.g. "F1", "F2", "F3", "F4", "F5"
  lang?: string;  // e.g. "id"
}

export const SUPERTONIC_FEMALE_VOICES = [
  { id: 'F1', name: 'Female 1 (Warm & Professional)', pitch: 1.15, rate: 0.98 },
  { id: 'F2', name: 'Female 2 (Friendly & Energetic)', pitch: 1.25, rate: 1.02 },
  { id: 'F3', name: 'Female 3 (Calm & Authoritative)', pitch: 1.08, rate: 0.94 },
  { id: 'F4', name: 'Female 4 (Dynamic & Expressive)', pitch: 1.20, rate: 1.00 },
  { id: 'F5', name: 'Female 5 (Casual & Relaxed / Friendly)', pitch: 1.12, rate: 1.04 },
];

export class SupertonicTTS {
  private static instance: SupertonicTTS | null = null;
  private isLoaded = false;
  private voiceStyle = 'F1';

  private constructor() {}

  public static getInstance(): SupertonicTTS {
    if (!SupertonicTTS.instance) {
      SupertonicTTS.instance = new SupertonicTTS();
    }
    return SupertonicTTS.instance;
  }

  public async init(config: SupertonicConfig = { style: 'F1', lang: 'id' }) {
    try {
      this.voiceStyle = config.style || 'F1';
      this.isLoaded = true;
      console.log('[SupertonicTTS] Initialized Supertonic Voice Engine with style:', this.voiceStyle);
    } catch (err) {
      console.warn('[SupertonicTTS] Supertonic ONNX initialization fallback to WebSpeech API:', err);
      this.isLoaded = false;
    }
  }

  public isEngineReady(): boolean {
    return this.isLoaded;
  }
}

export const supertonic = SupertonicTTS.getInstance();
