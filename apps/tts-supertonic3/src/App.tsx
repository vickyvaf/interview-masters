import { useState } from 'react';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const SERVER_URL = isLocal ? 'http://127.0.0.1:7788' : 'https://vickyvaf-tts-supertonic3.hf.space';

export default function App() {
  const [text, setText] = useState('Halo! Ini adalah sintesis suara resmi Supertonic 3.');
  const [speaker, setSpeaker] = useState('F1');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Supertonic 3 HTTP API Service - Ready');

  const handleSynthesize = async () => {
    setIsLoading(true);
    setStatus('Mengirim permintaan ke Supertonic 3 service...');

    try {
      const response = await fetch(`${SERVER_URL}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'supertonic-3',
          input: text,
          voice: speaker,
          language: 'id',
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Server Supertonic 3 belum siap`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setStatus('Selesai memutar audio Supertonic 3.');
        setIsLoading(false);
      };
      audio.onerror = (err) => {
        console.error('[Audio Error]', err);
        setStatus('Error saat memutar audio.');
        setIsLoading(false);
      };

      await audio.play();
      setStatus('Sedang memutar audio Supertonic 3...');
    } catch (err: any) {
      console.warn('[Fallback Web Speech]', err);
      setStatus(`Gagal terhubung ke Supertonic Service (${SERVER_URL}): ${err?.message || String(err)}`);

      // Fallback to browser Web Speech API if server is unavailable
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.onend = () => setIsLoading(false);
        utterance.onerror = () => setIsLoading(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsLoading(false);
      }
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Supertonic 3 TTS Official</h2>

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
          <option value="F1">Lily / F1 (Female - Supertonic 3)</option>
          <option value="F2">Sarah / F2 (Female Professional - Supertonic 3)</option>
          <option value="M1">M1 (Male - Supertonic 3)</option>
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
        {isLoading ? '⏳ Synthesizing...' : '🔊 Play Supertonic 3 Audio'}
      </button>

      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
        <div><strong>Status:</strong> {status}</div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Endpoint: {SERVER_URL}</div>
      </div>
    </div>
  );
}
