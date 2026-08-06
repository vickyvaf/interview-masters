import { pipeline, env } from '@huggingface/transformers';

// Enable browser cache and HuggingFace CDN loading for ONNX models in Web Worker
env.allowLocalModels = false;
env.useBrowserCache = true;

class SupertonicNeuralPipeline {
  private static instance: any = null;

  public static async getInstance(progressCallback?: (progress: any) => void) {
    if (!this.instance) {
      // Load ONNX neural speech synthesis model in WebWorker background thread
      this.instance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        progress_callback: progressCallback,
      });
    }
    return this.instance;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { action, text, speaker } = e.data;

  if (action === 'SYNTHESIZE') {
    try {
      (self as any).postMessage({
        status: 'LOADING',
        message: 'Downloading / initializing ONNX neural TTS model in WebWorker...'
      });

      const synthesizer = await SupertonicNeuralPipeline.getInstance((progress: any) => {
        (self as any).postMessage({ status: 'PROGRESS', progress });
      });

      (self as any).postMessage({
        status: 'SYNTHESIZING',
        message: `Synthesizing neural speech for "${text.slice(0, 30)}..."`
      });

      // Default speaker embedding binary
      const speaker_embeddings = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin';

      // Perform ONNX model neural speech synthesis
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
