import { useState, useEffect } from 'react';
import { pipeline, env, Tensor } from '@huggingface/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

let synthesizerPromise: Promise<any> | null = null;
let speakerEmbeddingsPromise: Promise<Tensor> | null = null;

function initModel() {
  if (!synthesizerPromise) {
    // Quantized q8 models: ~35MB total instead of ~140MB fp32 models!
    synthesizerPromise = pipeline('text-to-speech', 'Xenova/speecht5_tts', {
      quantized: true,
      vocoder: 'Xenova/speecht5_hifigan',
    } as any);
  }

  if (!speakerEmbeddingsPromise) {
    speakerEmbeddingsPromise = fetch('https://huggingface.co/datasets/Xenova/transformers.js-docs/raw/main/speaker_embeddings.bin')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const floatData = new Float32Array(512);
        const view = new DataView(buf);
        for (let i = 0; i < Math.min(512, Math.floor(buf.byteLength / 4)); i++) {
          floatData[i] = view.getFloat32(i * 4, true);
        }
        return new Tensor('float32', floatData, [1, 512]);
      })
      .catch(() => new Tensor('float32', new Float32Array(512).fill(0.04), [1, 512]));
  }
}

async function speak(text: string) {
  initModel();
  const [synthesizer, speakerEmbeddings] = await Promise.all([synthesizerPromise, speakerEmbeddingsPromise]);

  const output = await synthesizer(text, { speaker_embeddings: speakerEmbeddings });
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

  useEffect(() => {
    initModel();
  }, []);

  const handlePlay = async () => {
    setLoading(true);
    try {
      await speak(text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        style={{ padding: '8px 16px', cursor: loading ? 'wait' : 'pointer' }}
      >
        {loading ? 'Processing...' : 'Play Sound'}
      </button>
    </div>
  );
}
