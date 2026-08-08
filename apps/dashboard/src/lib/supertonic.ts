/**
 * Supertonic TTS Client & Available Preset Voices
 */

export const SupertonicVoice = {
  /**
   * Female Voices
   */
  Lily: 'F1',
  Sarah: 'F2',
  Jessica: 'F3',
  Olivia: 'F4',
  Emily: 'F5',

  /**
   * Male Voices
   */
  Alex: 'M1',
  James: 'M2',
  Robert: 'M3',
  Sam: 'M4',
  Daniel: 'M5',
} as const;

export type SupertonicVoiceKey = keyof typeof SupertonicVoice;
export type SupertonicVoiceValue = (typeof SupertonicVoice)[SupertonicVoiceKey];

export class SupertonicTTS {
  private static instance: SupertonicTTS | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private preloadCache = new Map<string, Promise<HTMLAudioElement | null>>();

  public static getInstance(): SupertonicTTS {
    if (!SupertonicTTS.instance) {
      SupertonicTTS.instance = new SupertonicTTS();
    }
    return SupertonicTTS.instance;
  }

  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Pre-fetches audio from Supertonic server in background so playback is instant.
   */
  public preload(text: string, voice: string = SupertonicVoice.Lily): Promise<HTMLAudioElement | null> {
    const cleanedText = text.replace(/\*/g, '').trim();
    if (!cleanedText) return Promise.resolve(null);

    const cacheKey = `${voice}:${cleanedText}`;
    if (this.preloadCache.has(cacheKey)) {
      return this.preloadCache.get(cacheKey)!;
    }

    const promise = (async () => {
      try {
        const baseUrl = import.meta.env.VITE_TTS_URL || '/api-tts';
        const endpoint = `${baseUrl}/v1/audio/speech`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'supertonic-3',
            input: cleanedText,
            voice,
            language: 'id',
            speed: 1.0,
          }),
        });

        if (!res.ok) throw new Error(`Supertonic server HTTP ${res.status}`);

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = 'auto';
        return audio;
      } catch (err) {
        console.warn('[Supertonic Preload Error]', err);
        return null;
      }
    })();

    this.preloadCache.set(cacheKey, promise);
    return promise;
  }

  public speakNative(text: string, onStart?: () => void): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve();

    this.stop();
    const cleanedText = text.replace(/\*/g, '').trim();

    return new Promise<void>((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'id-ID';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
        if (idVoice) utterance.voice = idVoice;

        utterance.onstart = () => {
          if (onStart) onStart();
        };
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[Native Speech Synthesis Error]', err);
        resolve();
      }
    });
  }

  public async speak(
    text: string,
    voice: string = SupertonicVoice.Lily,
    onStart?: () => void
  ): Promise<void> {
    if (typeof window === 'undefined' || !text.trim()) return;

    this.stop();
    const cleanedText = text.replace(/\*/g, '').trim();

    try {
      const cacheKey = `${voice}:${cleanedText}`;
      let audio: HTMLAudioElement | null = null;

      if (this.preloadCache.has(cacheKey)) {
        audio = await this.preloadCache.get(cacheKey)!;
        this.preloadCache.delete(cacheKey);
      }

      if (!audio) {
        // Fetch audio with 4-second timeout limit for server response
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        audio = await Promise.race([this.preload(text, voice), timeoutPromise]);
      }

      // If server TTS audio is slow (>4s) or unavailable, fallback instantly to client-side synthesis
      if (!audio) {
        console.warn('[Supertonic TTS] Server response exceeded 4s timeout. Using high-speed local browser synthesis fallback.');
        return this.speakNative(cleanedText, onStart);
      }

      this.currentAudio = audio;

      return new Promise<void>((resolve) => {
        audio!.onended = () => {
          if (audio!.src) URL.revokeObjectURL(audio!.src);
          this.currentAudio = null;
          resolve();
        };
        audio!.onerror = (err) => {
          console.warn('[Supertonic Audio Error]', err);
          if (audio!.src) URL.revokeObjectURL(audio!.src);
          this.currentAudio = null;
          this.speakNative(cleanedText, onStart).then(resolve);
        };
        audio!.play().then(() => {
          if (onStart) onStart();
        }).catch((err) => {
          console.warn('[Supertonic Play Error]', err);
          if (audio!.src) URL.revokeObjectURL(audio!.src);
          this.currentAudio = null;
          this.speakNative(cleanedText, onStart).then(resolve);
        });
      });
    } catch (err) {
      console.error('[Supertonic TTS Exception]', err);
      return this.speakNative(cleanedText, onStart);
    }
  }

  public async speakInBrowserWorker(text: string): Promise<void> {
    return this.speak(text);
  }

  public init(): void { }
}

export const supertonic = SupertonicTTS.getInstance();
