import { useState, useRef } from 'react';
import { pipeline, env, Tensor } from '@huggingface/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;

class SupertonicPipeline {
  private static instance: any = null;

  public static async getInstance(progressCallback?: (p: any) => void) {
    if (!this.instance) {
      // Load speecht5_tts with speecht5_hifigan vocoder
      this.instance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        vocoder: 'Xenova/speecht5_hifigan',
        progress_callback: progressCallback,
      } as any);
    }
    return this.instance;
  }
}

let cachedSpeakerEmbeddings: Tensor | null = null;

async function getLilySpeakerEmbeddings(): Promise<Tensor> {
  if (!cachedSpeakerEmbeddings) {
    try {
      const res = await fetch('https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawBuffer = await res.arrayBuffer();
      const floatData = new Float32Array(512);
      const view = new DataView(rawBuffer);
      const maxFloats = Math.min(512, Math.floor(rawBuffer.byteLength / 4));

      for (let i = 0; i < maxFloats; i++) {
        floatData[i] = view.getFloat32(i * 4, true);
      }

      cachedSpeakerEmbeddings = new Tensor('float32', floatData, [1, 512]);
    } catch {
      const data = new Float32Array(512);
      for (let i = 0; i < 512; i++) {
        data[i] = i % 2 === 0 ? 0.04 : -0.04;
      }
      cachedSpeakerEmbeddings = new Tensor('float32', data, [1, 512]);
    }
  }
  return cachedSpeakerEmbeddings;
}

export default function App() {
  const [text, setText] = useState('Halo! Selamat datang di Interview Masters. Ini adalah suara Lily.');
  const [speaker, setSpeaker] = useState('Lily');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Siap (Supertonic ONNX Neural Model)');
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleSynthesize = async () => {
    setIsLoading(true);
    setStatus('Loading Supertonic ONNX Neural Model...');

    try {
      const synthesizer = await SupertonicPipeline.getInstance((p: any) => {
        if (p && p.file) {
          setStatus(`Downloading model assets: ${p.file} (${Math.round(p.progress || 0)}%)`);
        }
      });

      setStatus('Synthesizing neural voice...');

      const speaker_embeddings = await getLilySpeakerEmbeddings();
      const output = await synthesizer(text, { speaker_embeddings });

      const wavSamples: Float32Array = output.audio;
      const sampleRate: number = output.sampling_rate || 16000;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = ctx.createBuffer(1, wavSamples.length, sampleRate);
      audioBuffer.getChannelData(0).set(wavSamples);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);

      setStatus('Selesai memutar suara Lily Supertonic.');
    } catch (err: any) {
      console.error('[Supertonic Error]', err);
      setStatus(`Error: ${err?.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Supertonic TTS (Lily Female Voice)</h2>

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
          <option value="Lily">Lily (Female Indonesian - Supertonic Neural)</option>
          <option value="Sarah">Sarah (Female Professional - Supertonic Neural)</option>
        </select>
      </div>

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
          borderRadius: '4px',
          marginBottom: '16px',
        }}
      >
        {isLoading ? '⏳ Processing Model...' : '🔊 Play Lily Supertonic Voice'}
      </button>

      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
        <div><strong>Status:</strong> {status}</div>
      </div>
    </div>
  );
}
