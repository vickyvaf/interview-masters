import { pipeline, env, Tensor } from '@huggingface/transformers';

// Configure transformers env
env.allowLocalModels = false;
env.useBrowserCache = true;

class SupertonicNeuralPipeline {
  private static instance: any = null;

  public static async getInstance(progressCallback?: (progress: any) => void) {
    if (!this.instance) {
      // Load ONNX neural text-to-speech model
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
    try {
      const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin';
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      // SpeechT5 expects speaker embeddings Tensor of shape [1, 512]
      const floatData = new Float32Array(arrayBuffer);
      cachedSpeakerEmbeddings = new Tensor('float32', floatData, [1, 512]);
    } catch (err) {
      console.warn('[Speaker Embeddings Fetch Fallback]', err);
      // Fallback: zeros Tensor of shape [1, 512]
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
        message: 'Initializing ONNX neural TTS model...'
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

      // Load speaker embeddings Tensor [1, 512] required by SpeechT5 ONNX
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
