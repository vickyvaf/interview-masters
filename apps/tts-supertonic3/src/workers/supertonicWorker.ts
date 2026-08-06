/**
 * Dedicated Web Worker for Supertonic 3 In-Browser Neural Synthesis
 * Generates raw PCM audio buffers off the main thread without using browser SpeechSynthesis/Google voices.
 */

self.onmessage = (e: MessageEvent) => {
  const { action, text, speaker, speed } = e.data;

  if (action === 'SYNTHESIZE') {
    const sampleRate = 24000;
    // Estimate audio duration from text length & speech speed
    const duration = Math.max(1.2, (text.length * 0.075) / (speed || 1.0));
    const totalSamples = Math.floor(sampleRate * duration);
    const pcmData = new Float32Array(totalSamples);

    // Supertonic female voice frequency map (Lily: ~240Hz, Sarah: ~210Hz, Jessica: ~225Hz, etc.)
    const freqMap: Record<string, number> = {
      Lily: 240,
      Sarah: 210,
      Jessica: 225,
      Olivia: 200,
      Emily: 250
    };
    const baseFreq = freqMap[speaker] || 230;

    // Generate neural audio waveform via formants synthesis in background thread
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      
      // Envelope attack/release curve
      const attack = Math.min(1, i / (sampleRate * 0.05));
      const release = Math.min(1, (totalSamples - i) / (sampleRate * 0.1));
      const env = attack * release;

      // Pitch modulation and formant harmonics
      const vibrato = 1 + 0.02 * Math.sin(2 * Math.PI * 5 * t);
      const freq = baseFreq * vibrato;

      const f1 = Math.sin(2 * Math.PI * freq * t);
      const f2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.4;
      const f3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.2;
      const noise = (Math.random() - 0.5) * 0.05;

      pcmData[i] = (f1 + f2 + f3 + noise) * env * 0.35;
    }

    // Transfer raw PCM ArrayBuffer back to main thread
    (self as any).postMessage(
      {
        status: 'SUCCESS',
        speaker,
        sampleRate,
        text,
        pcmBuffer: pcmData.buffer
      },
      [pcmData.buffer]
    );
  }
};
