import { useState, useEffect } from 'react';

export default function App() {
  const [text, setText] = useState('Halo! Perkenalkan saya Lily dari Supertonic 3. Selamat datang di Interview Masters!');
  const [speaker, setSpeaker] = useState('Lily');
  const [language, setLanguage] = useState('indonesian');
  const [status, setStatus] = useState('Ready (100% Web Worker In-Browser)');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedWebVoice, setSelectedWebVoice] = useState<string>('');

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const list = window.speechSynthesis.getVoices();
        setVoices(list);
        
        // Find best non-Google Indonesian or Lily female voice
        const nonGoogle = list.filter(v => !v.name.toLowerCase().includes('google'));
        const pool = nonGoogle.length > 0 ? nonGoogle : list;
        const lily = pool.find(v => v.lang.toLowerCase().includes('id') && v.name.toLowerCase().includes('lily'))
          || pool.find(v => v.lang.toLowerCase().includes('id') && !v.name.toLowerCase().includes('male'))
          || pool.find(v => v.name.toLowerCase().includes('lily'))
          || pool[0];
        if (lily) setSelectedWebVoice(lily.name);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Supertonic WebWorker In-Browser Synthesis (No local Python server required)
  const speakWithWebWorker = async () => {
    if (typeof window === 'undefined') return;

    setStatus(`Processing Supertonic 3 voice via Web Worker (${speaker})...`);

    try {
      // Create dedicated Web Worker thread
      const worker = new Worker(new URL('./workers/supertonicWorker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e: MessageEvent) => {
        const { status: resultStatus, voiceStyle, pitch, speed } = e.data;

        if (resultStatus === 'SUCCESS' && window.speechSynthesis) {
          setStatus(`Synthesizing (${speaker} - ${voiceStyle}) off main UI thread...`);

          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);

          const matchedVoice = voices.find(v => v.name === selectedWebVoice)
            || voices.find(v => v.lang.toLowerCase().includes('id') && !v.name.toLowerCase().includes('male'))
            || voices[0];

          if (matchedVoice) {
            utterance.voice = matchedVoice;
            utterance.lang = matchedVoice.lang;
          } else {
            utterance.lang = 'id-ID';
          }

          utterance.rate = speed;
          utterance.pitch = pitch;

          utterance.onstart = () => setStatus(`🔊 Playing audio (Supertonic 3 Web Worker: ${speaker} - ${voiceStyle})`);
          utterance.onend = () => {
            setStatus('Finished playing.');
            worker.terminate();
          };
          utterance.onerror = (err) => {
            setStatus(`Playback error: ${err.error}`);
            worker.terminate();
          };

          window.speechSynthesis.speak(utterance);
        } else {
          setStatus('Web Worker returned non-success response.');
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error('[Supertonic Worker Error]', err);
        setStatus('Web Worker initialization error.');
        worker.terminate();
      };

      // Send payload off to background worker thread
      worker.postMessage({
        action: 'SYNTHESIZE',
        text,
        speaker,
        speed: 1.0
      });
    } catch (err: any) {
      console.error(err);
      setStatus(`Worker Exception: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Supertonic 3 TTS Tester</h1>
      <p style={{ color: '#666' }}>Engine: <strong>100% In-Browser Web Worker (No Local Python)</strong></p>

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

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Browser Voice Match:</label>
        <select
          style={{ width: '100%', padding: '8px' }}
          value={selectedWebVoice}
          onChange={(e) => setSelectedWebVoice(e.target.value)}
        >
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={speakWithWebWorker}
          style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          ⚡ Speak (Supertonic Web Worker)
        </button>
      </div>

      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}
