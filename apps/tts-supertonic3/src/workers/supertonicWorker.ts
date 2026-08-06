import { pipeline, env, Tensor } from '@huggingface/transformers';

// Enable persistent browser CacheStorage for ONNX model files & WASM modules
env.allowLocalModels = false;
env.useBrowserCache = true;

class SupertonicNeuralPipeline {
  private static instance: any = null;

  public static async getInstance(progressCallback?: (progress: any) => void) {
    if (!this.instance) {
      // Load ONNX neural text-to-speech model with persistent CacheStorage
      this.instance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        progress_callback: progressCallback,
      });
    }
    return this.instance;
  }
}

// Global cached Tensor for speaker embeddings [1, 512]
let cachedSpeakerEmbeddings: Tensor | null = null;

async function getSpeakerEmbeddingsTensor(): Promise<Tensor> {
  if (!cachedSpeakerEmbeddings) {
    const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin';
    try {
      // Persist speaker embeddings in browser CacheStorage so closing browser never deletes it
      if ('caches' in self) {
        const cache = await caches.open('supertonic-embeddings-v1');
        let res = await cache.match(url);
        if (!res) {
          res = await fetch(url);
          await cache.put(url, res.clone());
        }
        const arrayBuffer = await res.arrayBuffer();
        const floatData = new Float32Array(arrayBuffer);
        cachedSpeakerEmbeddings = new Tensor('float32', floatData, [1, 512]);
      } else {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const floatData = new Float32Array(arrayBuffer);
        cachedSpeakerEmbeddings = new Tensor('float32', floatData, [1, 512]);
      }
    } catch (err) {
      console.warn('[Speaker Embeddings Cache Fallback]', err);
      cachedSpeakerEmbeddings = new Tensor('float32', new Float32Array(512), [1, 512]);
    }
  }
  return cachedSpeakerEmbeddings;
}

// Track file download progress map to prevent UI progress reset loops
const fileProgressMap: Record<string, number> = {};

self.onmessage = async (e: MessageEvent) => {
  const { action, text, speaker } = e.data;

  if (action === 'SYNTHESIZE') {
    try {
      (self as any).postMessage({
        status: 'LOADING',
        message: 'Loading ONNX model from local browser CacheStorage...'
      });

      const synthesizer = await SupertonicNeuralPipeline.getInstance((progress: any) => {
        if (progress && progress.file) {
          const fileName = progress.file;
          if (progress.status === 'progress') {
            fileProgressMap[fileName] = Math.round(progress.progress || 0);
          } else if (progress.status === 'done') {
            fileProgressMap[fileName] = 100;
          }

          const fileNames = Object.keys(fileProgressMap);
          const totalProgress = Math.round(
            fileNames.reduce((acc, curr) => acc + fileProgressMap[curr], 0) / Math.max(1, fileNames.length)
          );

          (self as any).postMessage({
            status: 'PROGRESS',
            file: fileName,
            filePercent: fileProgressMap[fileName],
            totalPercent: totalProgress,
            loadedFiles: fileNames.length
          });
        }
      });

      (self as any).postMessage({
        status: 'SYNTHESIZING',
        message: `Synthesizing neural speech for "${text.slice(0, 35)}..."`
      });

      // Load speaker embeddings Tensor [1, 512] from CacheStorage
      const speaker_embeddings = await getSpeakerEmbeddingsTensor();

      const output = await synthesizer(text, { speaker_embeddings });

      const wavSamples: Float32Array = output.audio;
      const sampleRate: number = output.sampling_rate || 16000;
      const duration = wavSamples.length / sampleRate;

      (self as any).postMessage(
        {
          status: 'SUCCESS',
          speaker: speaker || 'Lily',
          duration,
          sampleRate,
          text,
          wavBuffer: wavSamples.buffer
        },
        [wavSamples.buffer]
      );
    } catch (err: any) {
      console.error('[Supertonic Worker Error]', err);
      (self as any).postMessage({
        status: 'ERROR',
        error: err.message || String(err)
      });
    }
  }
};
