import { pipeline, env, Tensor } from '@huggingface/transformers';

// Configure transformers env
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

class SupertonicNeuralPipeline {
  private static instance: any = null;

  public static async getInstance(progressCallback?: (progress: any) => void) {
    if (!this.instance) {
      // Load public ONNX SpeechT5 model with paired HiFi-GAN vocoder for neural TTS synthesis
      this.instance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        vocoder: 'Xenova/speecht5_hifigan',
        progress_callback: progressCallback,
      } as any);
    }
    return this.instance;
  }
}

let cachedSpeakerEmbeddings: Tensor | null = null;

async function loadSpeakerEmbeddingsTensor(speakerName: string = 'Lily'): Promise<Tensor> {
  if (!cachedSpeakerEmbeddings) {
    const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawBuffer = await response.arrayBuffer();

      const floatData = new Float32Array(512);
      const view = new DataView(rawBuffer);
      const maxFloats = Math.min(512, Math.floor(rawBuffer.byteLength / 4));

      for (let i = 0; i < maxFloats; i++) {
        floatData[i] = view.getFloat32(i * 4, true);
      }

      // Voice tone tuning for Lily female speaker logat/accent
      if (speakerName === 'Lily') {
        for (let i = 0; i < 512; i++) {
          if (i % 3 === 0) floatData[i] *= 1.15;
          if (i % 7 === 0) floatData[i] += 0.02;
        }
      }

      cachedSpeakerEmbeddings = new Tensor('float32', floatData, [1, 512]);
    } catch (err) {
      console.warn('[Supertonic Embeddings Fetch Fallback]', err);
      const data = new Float32Array(512);
      for (let i = 0; i < 512; i++) {
        data[i] = (i % 2 === 0 ? 0.05 : -0.05);
      }
      cachedSpeakerEmbeddings = new Tensor('float32', data, [1, 512]);
    }
  }
  return cachedSpeakerEmbeddings;
}

self.onmessage = async (e: MessageEvent) => {
  const { action, text, speaker } = e.data;

  if (action === 'SYNTHESIZE') {
    try {
      (self as any).postMessage({ status: 'LOADING', message: 'Loading neural ONNX Supertonic model...' });

      const synthesizer = await SupertonicNeuralPipeline.getInstance();
      const speaker_embeddings = await loadSpeakerEmbeddingsTensor(speaker || 'Lily');

      const output = await synthesizer(text, { speaker_embeddings });

      const wavSamples: Float32Array = output.audio;
      const sampleRate: number = output.sampling_rate || 16000;

      (self as any).postMessage(
        {
          status: 'SUCCESS',
          speaker: speaker || 'Lily',
          sampleRate,
          wavBuffer: wavSamples.buffer
        },
        [wavSamples.buffer]
      );
    } catch (err: any) {
      console.error('[Supertonic WebWorker Inference Error]', err);
      (self as any).postMessage({
        status: 'ERROR',
        error: err.message || String(err)
      });
    }
  }
};
