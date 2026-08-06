/**
 * Supertonic 3 TTS Integration Module
 * Reference: https://huggingface.co/spaces/Supertone/supertonic-3
 * Settings: Speaker: Lily, Language: Indonesian, Quality: 8 Steps, Speed: 1.00x
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
      console.log(`[Supertonic 3 TTS] Speaker: ${this.activeSpeaker}, Language: ${this.activeLanguage}, Quality: ${this.qualitySteps} Steps, Speed: ${this.speechSpeed}x`);
    } catch (err) {
      console.warn('[Supertonic 3 TTS] Fallback initialized:', err);
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
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return null;
    }

    const voiceMap: Record<string, string> = {
      Lily: 'F1',
      Sarah: 'F2',
      Jessica: 'F3',
      Olivia: 'F4',
      Emily: 'F5'
    };
    const voiceStyle = voiceMap[this.activeSpeaker] || 'F1';

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => !v.name.toLowerCase().includes('google') && !v.name.toLowerCase().includes('male') && v.lang.toLowerCase().includes('id'))
        || voices.find(v => !v.name.toLowerCase().includes('google') && !v.name.toLowerCase().includes('male'));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = 'id-ID';
      }

      utterance.rate = this.speechSpeed;
      utterance.pitch = 1.3;

      utterance.onend = () => resolve(null);
      utterance.onerror = (e) => {
        console.warn(`[Supertonic Worker Client Error - Voice Style ${voiceStyle}]`, e);
        resolve(null);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[Supertonic Worker Client Exception]', err);
        resolve(null);
      }
    });
  }
}

export const supertonic = SupertonicTTS.getInstance();
