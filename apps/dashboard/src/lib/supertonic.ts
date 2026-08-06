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

  public async speakWithServer(text: string, serverUrl = '/api-tts'): Promise<HTMLAudioElement | null> {
    try {
      const voiceMap: Record<string, string> = {
        Lily: 'F1',
        Sarah: 'F2',
        Jessica: 'F3',
        Olivia: 'F4',
        Emily: 'F5'
      };
      const voiceStyle = voiceMap[this.activeSpeaker] || 'F1';

      const res = await fetch(`${serverUrl}/v1/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: voiceStyle,
          lang: 'id',
          speed: this.speechSpeed
        })
      });

      if (!res.ok) {
        throw new Error(`Supertonic Serve status ${res.status}`);
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      return new Audio(audioUrl);
    } catch (err) {
      console.warn('[Supertonic Serve] Local server unavailable, falling back to Web Speech API:', err);
      return null;
    }
  }

  public speakInBrowserWorker(text: string, onComplete?: () => void): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onComplete) onComplete();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Dynamically query available non-Google female voices
    const voices = window.speechSynthesis.getVoices();
    const bannedKeywords = ['google', 'male', 'david', 'mark', 'george', 'stefan', 'adam', 'paul'];
    const cleanVoices = voices.filter(v => !bannedKeywords.some(k => v.name.toLowerCase().includes(k)));
    const pool = cleanVoices.length > 0 ? cleanVoices : voices;

    const idSarahVoice = pool.find(v => v.lang.toLowerCase().includes('id') && v.name.toLowerCase().includes('sarah'))
    const idLilyVoice = pool.find(v => v.lang.toLowerCase().includes('id') && v.name.toLowerCase().includes('lily'))
    const idFemaleVoice = pool.find(v => v.lang.toLowerCase().includes('id') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('gadis') || v.name.toLowerCase().includes('perempuan') || !v.name.toLowerCase().includes('male')))
    const genericLilyVoice = pool.find(v => v.name.toLowerCase().includes('lily') || v.name.toLowerCase().includes('sarah'))
    const anyIdVoice = pool.find(v => v.lang.toLowerCase().includes('id'))
    const fallbackFemaleVoice = pool.find(v => v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male'))

    const matchedVoice = idSarahVoice || idLilyVoice || idFemaleVoice || genericLilyVoice || anyIdVoice || fallbackFemaleVoice;
    
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = 'id-ID';
    }

    // Acoustic voice tuning for female speaker (Sarah/Lily accent profile)
    utterance.rate = this.speechSpeed;
    utterance.pitch = 1.3;

    if (onComplete) {
      utterance.onend = onComplete;
      utterance.onerror = (e) => {
        console.warn('[Supertonic Worker Client Error]', e);
        onComplete();
      };
    }

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[Supertonic Worker Client Exception]', err);
      if (onComplete) onComplete();
    }
  }
}

export const supertonic = SupertonicTTS.getInstance();
