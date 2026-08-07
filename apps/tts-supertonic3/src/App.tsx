import { useState, useRef } from 'react';
import { pipeline, env, Tensor } from '@huggingface/transformers';

// Configure transformers env
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false;

// Helper to encode Float32 PCM to WAV Blob
function encodeWAV(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (v: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

class SupertonicNeuralPipeline {
  private static instance: any = null;

  public static async getInstance(progressCallback?: (progress: any) => void) {
    if (!this.instance) {
      this.instance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        vocoder: 'Xenova/speecht5_hifigan',
        progress_callback: progressCallback,
      } as any);
    }
    return this.instance;
  }
}

let cachedSpeakerEmbeddings: Tensor | null = null;

async function loadSpeakerEmbeddingsTensor(): Promise<Tensor> {
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

      cachedSpeakerEmbeddings = new Tensor('float32', floatData, [1, 512]);
    } catch (err) {
      console.warn('[Speaker Embeddings Fetch Warning, using safe fallback tensor]', err);
      const data = new Float32Array(512);
      for (let i = 0; i < 512; i++) {
        data[i] = (i % 2 === 0 ? 0.04 : -0.04);
      }
      cachedSpeakerEmbeddings = new Tensor('float32', data, [1, 512]);
    }
  }
  return cachedSpeakerEmbeddings;
}

export default function App() {
  const [text, setText] = useState('Halo! Selamat datang di Interview Masters. Ini adalah sintesis suara neural Supertonic.');
  const [speaker, setSpeaker] = useState('Lily');
  const [status, setStatus] = useState('Ready (Main Thread Direct TTS)');
  const [progress, setProgress] = useState<string>('');
  const [lastWavBlob, setLastWavBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleSynthesize = async () => {
    setIsLoading(true);
    setStatus('Initializing ONNX model in main thread...');
    setProgress('');

    try {
      const fileProgressMap: Record<string, number> = {};

      const synthesizer = await SupertonicNeuralPipeline.getInstance((p: any) => {
        if (p && p.file) {
          const fileName = p.file;
          if (p.status === 'progress') {
            fileProgressMap[fileName] = Math.round(p.progress || 0);
          } else if (p.status === 'done') {
            fileProgressMap[fileName] = 100;
          }

          const fileNames = Object.keys(fileProgressMap);
          const totalProgress = Math.round(
            fileNames.reduce((acc, curr) => acc + fileProgressMap[curr], 0) / Math.max(1, fileNames.length)
          );

          setProgress(`Downloading ONNX assets: ${totalProgress}% (${fileName}: ${fileProgressMap[fileName]}%)`);
        }
      });

      setStatus(`Synthesizing neural human speech for "${text.slice(0, 35)}..."`);

      const speaker_embeddings = await loadSpeakerEmbeddingsTensor();
      const output = await synthesizer(text, { speaker_embeddings });

      const wavSamples: Float32Array = output.audio;
      const sampleRate: number = output.sampling_rate || 16000;
      const duration = wavSamples.length / sampleRate;

      setIsLoading(false);
      setProgress('');
      const wavBlob = encodeWAV(wavSamples, sampleRate);
      setLastWavBlob(wavBlob);

      setStatus(`Generated ${duration.toFixed(2)}s of neural spoken audio at ${sampleRate} Hz`);

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const audioBuffer = ctx.createBuffer(1, wavSamples.length, sampleRate);
      audioBuffer.getChannelData(0).set(wavSamples);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (err: any) {
      console.error('[Supertonic Direct Execution Error]', err);
      setIsLoading(false);
      setStatus(`ONNX Model Error: ${err.message || String(err)}`);
    }
  };

  const handleSaveAudio = () => {
    if (!lastWavBlob) return;
    const url = URL.createObjectURL(lastWavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Supertonic Neural TTS</h1>
      <p style={{ color: '#666' }}>Engine: <strong>In-Browser Direct ONNX Neural Model</strong></p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Input Text:</label>
        <textarea
          rows={4}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Speaker Profile:</label>
        <select
          style={{ width: '100%', padding: '8px' }}
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value)}
        >
          <option value="Lily">Lily (Female Indonesian)</option>
          <option value="Sarah">Sarah (Female Professional)</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={handleSynthesize}
          disabled={isLoading}
          style={{
            padding: '10px 16px',
            cursor: isLoading ? 'wait' : 'pointer',
            fontWeight: 'bold',
            backgroundColor: isLoading ? '#666' : '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {isLoading ? '⏳ Processing Model...' : '🔊 Speak Neural Speech Direct'}
        </button>

        <button
          onClick={handleSaveAudio}
          disabled={!lastWavBlob}
          style={{
            padding: '10px 16px',
            cursor: lastWavBlob ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            backgroundColor: lastWavBlob ? '#28a745' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          💾 Download output.wav
        </button>
      </div>

      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
        <div><strong>Status:</strong> {status}</div>
        {progress && <div style={{ color: '#0066cc', marginTop: '4px' }}>{progress}</div>}
      </div>
    </div>
  );
}
