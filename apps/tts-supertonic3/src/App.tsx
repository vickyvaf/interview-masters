import { useState, useRef } from 'react';

// Helper to encode Float32 PCM to 44.1kHz WAV Blob (equivalent to Python tts.save_audio)
function encodeWAV(samples: Float32Array, sampleRate: number = 44100): Blob {
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
  const [text, setText] = useState('Supertonic is a lightning fast, on-device TTS system.');
  const [voiceName, setVoiceName] = useState('F1');
  const [lang, setLang] = useState('en');
  const [totalSteps, setTotalSteps] = useState<number>(8);
  const [speed, setSpeed] = useState<number>(1.05);
  const [status, setStatus] = useState('Ready (Supertonic JS Web Worker API)');
  const [lastWavBlob, setLastWavBlob] = useState<Blob | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // JS equivalent of Python: tts.synthesize(text, lang, voice_style, total_steps, speed)
  const handleSynthesize = async () => {
    if (typeof window === 'undefined') return;

    setStatus(`Synthesizing Supertonic audio in Web Worker (voice: ${voiceName}, steps: ${totalSteps}, speed: ${speed}x)...`);

    try {
      const worker = new Worker(new URL('./workers/supertonicWorker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e: MessageEvent) => {
        const { status: resultStatus, wavBuffer, duration, sampleRate, voiceName: resolvedVoice } = e.data;

        if (resultStatus === 'SUCCESS' && wavBuffer) {
          const wavSamples = new Float32Array(wavBuffer);
          const wavBlob = encodeWAV(wavSamples, sampleRate);
          setLastWavBlob(wavBlob);

          setStatus(`Generated ${duration.toFixed(2)}s of audio at ${sampleRate} Hz (${resolvedVoice})`);

          // Play audio using 44.1kHz WebAudio API
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

          source.onended = () => {
            worker.terminate();
          };

          source.start(0);
        } else {
          setStatus('Supertonic Web Worker synthesis failed.');
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error('[Supertonic Worker Error]', err);
        setStatus('Supertonic Web Worker error.');
        worker.terminate();
      };

      // Post message matching Supertonic Python params
      worker.postMessage({
        action: 'SYNTHESIZE',
        text,
        lang,
        voiceName,
        totalSteps,
        speed
      });
    } catch (err: any) {
      console.error(err);
      setStatus(`Worker Exception: ${err.message}`);
    }
  };

  // JS equivalent of Python: tts.save_audio(wav, "output.wav")
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
      <h1>Supertonic TTS Web Worker (JS API)</h1>
      <p style={{ color: '#666' }}>Engine: <strong>On-Device Supertonic Worker (Python TTS JS Port)</strong></p>

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
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Voice Name (voice_style):</label>
        <select
          style={{ width: '100%', padding: '8px' }}
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
        >
          <option value="F1">F1 / Lily (Female Bright - Recommended)</option>
          <option value="F2">F2 / Sarah (Female Professional)</option>
          <option value="M1">M1 (Male Deep)</option>
          <option value="M2">M2 (Male Soft)</option>
          <option value="Jessica">Jessica (Female Friendly)</option>
          <option value="Olivia">Olivia (Female Warm)</option>
          <option value="Emily">Emily (Female Expressive)</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Language (lang):</label>
          <input
            type="text"
            style={{ width: '100%', padding: '8px' }}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Quality (total_steps: 5 - 12):</label>
          <input
            type="number"
            min={5}
            max={12}
            style={{ width: '100%', padding: '8px' }}
            value={totalSteps}
            onChange={(e) => setTotalSteps(Number(e.target.value))}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Speed (speed: 0.7 - 2.0):</label>
          <input
            type="number"
            step="0.05"
            min={0.7}
            max={2.0}
            style={{ width: '100%', padding: '8px' }}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={handleSynthesize}
          style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          ⚡ Synthesize & Play (44.1 kHz)
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
          💾 save_audio("output.wav")
        </button>
      </div>

      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}
