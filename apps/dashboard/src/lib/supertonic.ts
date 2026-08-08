/**
 * Supertonic TTS Client (Indonesian, Female - Sarah)
 */

export class SupertonicTTS {
  private static instance: SupertonicTTS | null = null;
  private currentAudio: HTMLAudioElement | null = null;

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

  public async speak(text: string): Promise<void> {
    if (typeof window === 'undefined' || !text.trim()) return;

    this.stop();

    try {
      const baseUrl = import.meta.env.VITE_TTS_URL || '/api-tts';
      const endpoint = `${baseUrl}/v1/audio/speech`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'supertonic-3',
          input: text,
          voice: 'Lily',
          language: 'id',
          speed: 1.0,
        }),
      });

      if (!res.ok) {
        throw new Error(`Supertonic server HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.currentAudio = audio;

      return new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          resolve();
        };
        audio.onerror = (err) => {
          console.warn('[Supertonic Audio Error]', err);
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          resolve();
        };
        audio.play().catch((err) => {
          console.warn('[Supertonic Play Error]', err);
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          resolve();
        });
      });
    } catch (err) {
      console.error('[Supertonic TTS Exception]', err);
    }
  }

  public async speakInBrowserWorker(text: string): Promise<void> {
    return this.speak(text);
  }

  public init(): void {}
}

export const supertonic = SupertonicTTS.getInstance();
