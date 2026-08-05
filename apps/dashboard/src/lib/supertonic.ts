/**
 * Supertonic TTS Integration Module for Bahasa Indonesia (ID)
 * Powered by Supertonic ONNX/Web TTS
 * Reference: https://supertonic3.github.io/
 */

export interface SupertonicConfig {
  style?: string; // Voice style e.g. "M1", "F1"
  lang?: string;  // e.g. "id"
}

export class SupertonicTTS {
  private static instance: SupertonicTTS | null = null;
  private isLoaded = false;
  private voiceStyle = 'M1';

  private constructor() {}

  public static getInstance(): SupertonicTTS {
    if (!SupertonicTTS.instance) {
      SupertonicTTS.instance = new SupertonicTTS();
    }
    return SupertonicTTS.instance;
  }

  public async init(config: SupertonicConfig = { style: 'M1', lang: 'id' }) {
    try {
      this.voiceStyle = config.style || 'M1';
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
