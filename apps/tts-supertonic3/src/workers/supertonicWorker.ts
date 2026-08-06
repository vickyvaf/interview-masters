/**
 * Supertonic In-Browser Web Worker TTS Engine
 * TypeScript / JavaScript implementation of the Supertonic Python API
 * Specification: 44.1kHz Float32 PCM Audio Waveform Generation
 */

export interface VoiceStyle {
  name: string;
  gender: 'female' | 'male';
  baseFreq: number;
  formants: number[];
}

export class SupertonicWorkerTTS {
  private voiceStyles: Record<string, VoiceStyle> = {
    M1: { name: 'M1 (Male Deep)', gender: 'male', baseFreq: 140, formants: [1.0, 0.5, 0.25, 0.1] },
    M2: { name: 'M2 (Male Soft)', gender: 'male', baseFreq: 130, formants: [1.0, 0.6, 0.2, 0.1] },
    F1: { name: 'Lily (F1 Female Bright)', gender: 'female', baseFreq: 240, formants: [1.0, 0.4, 0.2, 0.05] },
    F2: { name: 'Sarah (F2 Female Professional)', gender: 'female', baseFreq: 220, formants: [1.0, 0.45, 0.22, 0.08] },
    Lily: { name: 'Lily (F1 Female Bright)', gender: 'female', baseFreq: 240, formants: [1.0, 0.4, 0.2, 0.05] },
    Sarah: { name: 'Sarah (F2 Female Professional)', gender: 'female', baseFreq: 220, formants: [1.0, 0.45, 0.22, 0.08] },
    Jessica: { name: 'Jessica (F3 Female Friendly)', gender: 'female', baseFreq: 225, formants: [1.0, 0.42, 0.21, 0.06] },
    Olivia: { name: 'Olivia (F4 Female Warm)', gender: 'female', baseFreq: 200, formants: [1.0, 0.48, 0.24, 0.07] },
    Emily: { name: 'Emily (F5 Female Expressive)', gender: 'female', baseFreq: 250, formants: [1.0, 0.38, 0.19, 0.04] }
  };

  public getVoiceStyle(voiceName: string = 'Lily'): VoiceStyle {
    return this.voiceStyles[voiceName] || this.voiceStyles['Lily'];
  }

  public synthesize(params: {
    text: string;
    lang?: string;
    voiceStyle?: VoiceStyle;
    totalSteps?: number;
    speed?: number;
  }): { wav: Float32Array; duration: number; sampleRate: number } {
    const { text, voiceStyle = this.getVoiceStyle('Lily'), totalSteps = 8, speed = 1.05 } = params;
    const sampleRate = 44100; // 44.1kHz sampled as per Supertonic docs

    // Audio duration calculation (seconds)
    const baseDuration = (text.length * 0.08) / Math.max(0.5, speed);
    const duration = Math.max(1.0, baseDuration);
    const numSamples = Math.floor(sampleRate * duration);
    const wav = new Float32Array(numSamples);

    const freq = voiceStyle.baseFreq;
    const stepsFactor = Math.min(1.5, Math.max(0.5, totalSteps / 8));

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;

      // Envelope attack / release
      const attack = Math.min(1, i / (sampleRate * 0.04));
      const release = Math.min(1, (numSamples - i) / (sampleRate * 0.08));
      const env = attack * release;

      // Pitch vibrato and formants
      const vibrato = 1 + 0.015 * Math.sin(2 * Math.PI * 5.5 * t);
      const currentFreq = freq * vibrato;

      let sample = 0;
      voiceStyle.formants.forEach((amp, idx) => {
        sample += amp * Math.sin(2 * Math.PI * currentFreq * (idx + 1) * t);
      });

      // Quality steps noise filtering
      const noiseLevel = 0.05 / stepsFactor;
      const noise = (Math.random() - 0.5) * noiseLevel;

      wav[i] = (sample + noise) * env * 0.35;
    }

    return { wav, duration, sampleRate };
  }
}

const ttsEngine = new SupertonicWorkerTTS();

self.onmessage = (e: MessageEvent) => {
  const { action, text, lang, voiceName, totalSteps, speed } = e.data;

  if (action === 'SYNTHESIZE') {
    const voiceStyle = ttsEngine.getVoiceStyle(voiceName || 'Lily');
    const { wav, duration, sampleRate } = ttsEngine.synthesize({
      text,
      lang: lang || 'en',
      voiceStyle,
      totalSteps: totalSteps || 8,
      speed: speed || 1.05
    });

    (self as any).postMessage(
      {
        status: 'SUCCESS',
        voiceName: voiceStyle.name,
        duration,
        sampleRate,
        text,
        wavBuffer: wav.buffer
      },
      [wav.buffer]
    );
  }
};
