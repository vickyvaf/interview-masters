import { pipeline, env, Tensor } from '@huggingface/transformers';

// Configure transformers for public HuggingFace CDN & browser CacheStorage
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

class SupertonicNeuralPipeline {
  private static instance: any = null;

  public static async getInstance(progressCallback?: (progress: any) => void) {
    if (!this.instance) {
      // Load public ONNX SpeechT5 neural TTS model
      this.instance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        progress_callback: progressCallback,
      } as any);
    }
    return this.instance;
  }
}

// Global cached speaker embeddings Tensor [1, 512]
let cachedSpeakerEmbeddings: Tensor | null = null;

async function getSpeakerEmbeddingsTensor(): Promise<Tensor> {
  if (!cachedSpeakerEmbeddings) {
    const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const floatData = new Float32Array(arrayBuffer);
      cachedSpeakerEmbeddings = new Tensor('float32', floatData, [1, 512]);
    } catch (err) {
      console.warn('[Speaker Embeddings Fetch Error, using fallback]', err);
      // Fallback: 512-dim Float32 Tensor
      const data = new Float32Array(512);
      for (let i = 0; i < 512; i++) {
        data[i] = Math.sin(i * 0.1) * 0.05;
      }
      cachedSpeakerEmbeddings = new Tensor('float32', data, [1, 512]);
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
        message: 'Loading neural ONNX TTS model...'
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
        message: `Synthesizing neural human speech for "${text.slice(0, 35)}..."`
      });

      // Load speaker embeddings Tensor [1, 512]
      const speaker_embeddings = await getSpeakerEmbeddingsTensor();

      // Run SpeechT5 neural ONNX TTS inference
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
