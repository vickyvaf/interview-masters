import { useState, useRef, useEffect } from 'react';

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

export default function App() {
  const [text, setText] = useState('Halo! Selamat datang di Interview Masters. Ini adalah sintesis suara neural Supertonic.');
  const [speaker, setSpeaker] = useState('Lily');
  const [status, setStatus] = useState('Ready (ONNX Neural Web Worker TTS)');
  const [progress, setProgress] = useState<string>('');
  const [lastWavBlob, setLastWavBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize persistent Web Worker once
  useEffect(() => {
    if (typeof window !== 'undefined' && !workerRef.current) {
      workerRef.current = new Worker(new URL('./workers/supertonicWorker.ts', import.meta.url), { type: 'module' });
    }
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Neural ONNX WebWorker Synthesis
  const handleSynthesize = async () => {
    if (typeof window === 'undefined' || !workerRef.current) return;

    setIsLoading(true);
    setStatus('Initializing ONNX model in WebWorker...');
    setProgress('');

    const worker = workerRef.current;

    worker.onmessage = (e: MessageEvent) => {
      const { status: msgStatus, message, file, filePercent, totalPercent, wavBuffer, duration, sampleRate, error } = e.data;

      if (msgStatus === 'LOADING' || msgStatus === 'SYNTHESIZING') {
        setStatus(message);
      } else if (msgStatus === 'PROGRESS') {
        if (file) {
          setProgress(`Downloading ONNX assets: ${totalPercent}% (${file}: ${filePercent}%)`);
        }
      } else if (msgStatus === 'SUCCESS' && wavBuffer) {
        setIsLoading(false);
        setProgress('');
        const wavSamples = new Float32Array(wavBuffer);
        const wavBlob = encodeWAV(wavSamples, sampleRate);
        setLastWavBlob(wavBlob);

        setStatus(`Generated ${duration.toFixed(2)}s of neural spoken audio at ${sampleRate} Hz`);

        // Play audio using WebAudio API
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
      } else if (msgStatus === 'ERROR') {
        setIsLoading(false);
        setStatus(`ONNX Model Error: ${error}`);
      }
    };

    worker.onerror = (err) => {
      console.error('[Supertonic Worker Error]', err);
      setIsLoading(false);
      setStatus('Web Worker execution error.');
    };

    worker.postMessage({
      action: 'SYNTHESIZE',
      text,
      speaker
    });
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
      <h1>Supertonic Neural TTS (ONNX Web Worker)</h1>
      <p style={{ color: '#666' }}>Engine: <strong>In-Browser ONNX Neural Model (100% Neural Spoken Speech)</strong></p>

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
          {isLoading ? '⏳ Processing Model...' : '🔊 Speak Neural Speech (ONNX Worker)'}
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
