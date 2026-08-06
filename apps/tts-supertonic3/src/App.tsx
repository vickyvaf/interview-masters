import { useState, useRef } from 'react';

export default function App() {
  const [text, setText] = useState('Halo! Perkenalkan saya Lily dari Supertonic 3. Selamat datang di Interview Masters!');
  const [speaker, setSpeaker] = useState('Lily');
  const [language, setLanguage] = useState('indonesian');
  const [status, setStatus] = useState('Ready (Pure Supertonic Web Worker PCM Audio - No Google Voices)');
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Supertonic Pure WebWorker PCM Synthesis (Zero Google/SpeechSynthesis dependency)
  const speakWithSupertonicWorker = async () => {
    if (typeof window === 'undefined') return;

    setStatus(`Synthesizing Supertonic 3 PCM audio in Web Worker thread (${speaker})...`);

    try {
      // Create dedicated Web Worker thread
      const worker = new Worker(new URL('./workers/supertonicWorker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e: MessageEvent) => {
        const { status: resultStatus, pcmBuffer, sampleRate, speaker: voiceSpeaker } = e.data;

        if (resultStatus === 'SUCCESS' && pcmBuffer) {
          setStatus(`Playing Supertonic 3 synthesized PCM audio (${voiceSpeaker})...`);

          // Initialize WebAudio API AudioContext
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
          }

          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') {
            ctx.resume();
          }

          const float32Data = new Float32Array(pcmBuffer);
          const audioBuffer = ctx.createBuffer(1, float32Data.length, sampleRate);
          audioBuffer.getChannelData(0).set(float32Data);

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);

          source.onended = () => {
            setStatus('Finished playing Supertonic 3 audio.');
            worker.terminate();
          };

          source.start(0);
        } else {
          setStatus('Supertonic Web Worker returned non-success response.');
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error('[Supertonic Worker Error]', err);
        setStatus('Supertonic Web Worker initialization error.');
        worker.terminate();
      };

      // Send task to background worker thread
      worker.postMessage({
        action: 'SYNTHESIZE',
        text,
        speaker,
        speed: 1.0
      });
    } catch (err: any) {
      console.error(err);
      setStatus(`Supertonic Worker Exception: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Supertonic 3 TTS Tester</h1>
      <p style={{ color: '#666' }}>Engine: <strong>Pure Supertonic Web Worker PCM (100% No Google Voice)</strong></p>

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
          <option value="Lily">Lily (Female Indonesian - Recommended)</option>
          <option value="Sarah">Sarah (Female Professional)</option>
          <option value="Jessica">Jessica (Female Friendly)</option>
          <option value="Olivia">Olivia (Female Warm)</option>
          <option value="Emily">Emily (Female Expressive)</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Language:</label>
        <input
          type="text"
          style={{ width: '100%', padding: '8px' }}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={speakWithSupertonicWorker}
          style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          ⚡ Speak Pure Supertonic (Web Worker PCM)
        </button>
      </div>

      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}
