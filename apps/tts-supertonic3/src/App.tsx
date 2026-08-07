import { useState, useEffect } from 'react';
import { pipeline, env, Tensor } from '@huggingface/transformers';

// Clear previous cache state to prevent ONNX tensor binding mismatch
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false;

interface DownloadItem {
  name: string;
  progress: number;
  status: string;
}

let synthesizerInstance: any = null;
let speakerEmbeddingsTensor: Tensor | null = null;
let modelInitPromise: Promise<any> | null = null;

async function getSpeakerEmbeddings(): Promise<Tensor> {
  if (speakerEmbeddingsTensor) return speakerEmbeddingsTensor;

  try {
    const res = await fetch('https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const floatData = new Float32Array(512);
    const view = new DataView(buf);
    for (let i = 0; i < Math.min(512, Math.floor(buf.byteLength / 4)); i++) {
      floatData[i] = view.getFloat32(i * 4, true);
    }
    speakerEmbeddingsTensor = new Tensor('float32', floatData, [1, 512]);
  } catch (e) {
    console.warn('[Speaker Embeddings fallback]', e);
    const fallback = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      fallback[i] = (i % 2 === 0 ? 0.04 : -0.04);
    }
    speakerEmbeddingsTensor = new Tensor('float32', fallback, [1, 512]);
  }
  return speakerEmbeddingsTensor;
}

function initModel(onProgress?: (progressData: any) => void) {
  if (!modelInitPromise) {
    modelInitPromise = (async () => {
      synthesizerInstance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        vocoder: 'Xenova/speecht5_hifigan',
        progress_callback: (info: any) => {
          if (onProgress) onProgress(info);
        },
      } as any);
      await getSpeakerEmbeddings();
      return synthesizerInstance;
    })();
  }
  return modelInitPromise;
}

async function speak(text: string, onProgress?: (progressData: any) => void) {
  const synthesizer = await initModel(onProgress);
  const speaker_embeddings = await getSpeakerEmbeddings();

  const output = await synthesizer(text, { speaker_embeddings });
  const sampleRate = output.sampling_rate || 16000;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  const buffer = ctx.createBuffer(1, output.audio.length, sampleRate);
  buffer.getChannelData(0).set(output.audio);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}

export default function App() {
  const [text, setText] = useState('Halo! Ini adalah suara Supertonic.');
  const [speaker, setSpeaker] = useState('Lily');
  const [loading, setLoading] = useState(false);
  const [downloads, setDownloads] = useState<Record<string, DownloadItem>>({});

  const handleProgress = (info: any) => {
    if (!info || !info.file) return;

    let p = 0;
    if (typeof info.progress === 'number') {
      p = Math.round(info.progress);
    } else if (typeof info.loaded === 'number' && typeof info.total === 'number' && info.total > 0) {
      p = Math.round((info.loaded / info.total) * 100);
    }

    if (info.status === 'done') {
      p = 100;
    }

    setDownloads((prev) => ({
      ...prev,
      [info.file]: {
        name: info.file,
        progress: p,
        status: info.status || 'downloading',
      },
    }));
  };

  useEffect(() => {
    initModel(handleProgress);
  }, []);

  const handlePlay = async () => {
    setLoading(true);
    try {
      await speak(text, handleProgress);
    } catch (err: any) {
      console.error(err);
      alert(`Error playing sound: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadList = Object.values(downloads);

  return (
    <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Supertonic TTS</h2>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>Text</label>
        <textarea
          rows={3}
          style={{ width: '100%', padding: '8px' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>Speaker Profile</label>
        <select style={{ width: '100%', padding: '8px' }} value={speaker} onChange={(e) => setSpeaker(e.target.value)}>
          <option value="Lily">Lily</option>
          <option value="Sarah">Sarah</option>
        </select>
      </div>

      <button
        onClick={handlePlay}
        disabled={loading}
        style={{ padding: '8px 16px', cursor: loading ? 'wait' : 'pointer', marginBottom: '24px' }}
      >
        {loading ? 'Processing...' : 'Play Sound'}
      </button>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>Download & Model Progress:</h4>
        {downloadList.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#888' }}>Ready / Checking local cache...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {downloadList.map((item) => (
              <div key={item.name} style={{ fontSize: '12px', background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500', wordBreak: 'break-all' }}>{item.name}</span>
                  <span>{item.progress}%</span>
                </div>
                <div style={{ width: '100%', background: '#e0e0e0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.progress}%`,
                      background: item.progress === 100 ? '#28a745' : '#0066cc',
                      height: '100%',
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
