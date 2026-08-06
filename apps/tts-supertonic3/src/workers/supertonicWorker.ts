import { pipeline, env, Tensor } from '@huggingface/transformers';

// Configure transformers for public HuggingFace CDN & browser CacheStorage
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

class SupertonicNeuralPipeline {
  private static instance: any = null;

  public static async getInstance(progressCallback?: (progress: any) => void) {
    if (!this.instance) {
      // Load public ONNX SpeechT5 model with paired HiFi-GAN vocoder
      this.instance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        vocoder: 'Xenova/speecht5_hifigan',
        progress_callback: progressCallback,
      } as any);
    }
    return this.instance;
  }
}

// Cached speaker embeddings Tensor [1, 512]
let cachedSpeakerEmbeddings: Tensor | null = null;

async function loadSpeakerEmbeddingsTensor(): Promise<Tensor> {
  if (!cachedSpeakerEmbeddings) {
    const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      const floatData = new Float32Array(buffer);
      cachedSpeakerEmbeddings = new Tensor('float32', floatData, [1, 512]);
    } catch (err) {
      console.warn('[Speaker Embeddings Fetch Warning, using generated tensor]', err);
      const data = new Float32Array(512);
      for (let i = 0; i < 512; i++) {
        data[i] = Math.sin(i * 0.1) * 0.05;
      }
      cachedSpeakerEmbeddings = new Tensor('float32', data, [1, 512]);
    }
  }
  return cachedSpeakerEmbeddings;
}

// Track file download progress map
const fileProgressMap: Record<string, number> = {};

self.onmessage = async (e: MessageEvent) => {
  const { action, text, speaker } = e.data;

  if (action === 'SYNTHESIZE') {
    try {
      (self as any).postMessage({
        status: 'LOADING',
        message: 'Loading neural ONNX SpeechT5 + HiFi-GAN vocoder...'
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

      // Load 512-dim Float32 Tensor for speaker embeddings
      const speaker_embeddings = await loadSpeakerEmbeddingsTensor();

      // Run SpeechT5 neural ONNX TTS inference with paired vocoder and Tensor speaker_embeddings
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
