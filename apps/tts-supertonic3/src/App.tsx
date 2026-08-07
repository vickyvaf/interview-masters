import { useState } from 'react';
import { Client } from '@gradio/client';

export default function App() {
  const [text, setText] = useState('Halo! Ini adalah suara Supertonic 3 via official Hugging Face Space.');
  const [speaker, setSpeaker] = useState('F1');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Supertonic 3 Official API - Ready');

  const handleSynthesize = async () => {
    setIsLoading(true);
    setStatus('Menghubungkan ke Official Supertonic 3 Hugging Face Space...');

    try {
      // Connect directly to official public Supertone Space
      const client = await Client.connect('Supertone/supertonic-3');
      setStatus('Synthesizing audio...');

      // Call predicting endpoint with text, voice profile, and language
      const result = await client.predict('/predict', {
        text: text,
        voice: speaker,
        lang: 'id',
        total_steps: 8,
        speed: 1.0,
      });

      const audioData: any = (result as any).data?.[0];
      const audioUrl = typeof audioData === 'string' ? audioData : audioData?.url;

      if (!audioUrl) {
        throw new Error('Gagal menerima URL audio dari server Supertonic 3.');
      }

      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setStatus('Selesai memutar audio Supertonic 3.');
        setIsLoading(false);
      };
      audio.onerror = (err) => {
        console.error('[Audio Playback Error]', err);
        setStatus('Error saat memutar audio.');
        setIsLoading(false);
      };

      await audio.play();
      setStatus('Sedang memutar audio Supertonic 3...');
    } catch (err: any) {
      console.error('[Official Supertonic Error]', err);
      setStatus(`Error: ${err?.message || String(err)}`);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Supertonic 3 TTS (Official Hugging Face API)</h2>
      <p style={{ color: '#666', fontSize: '13px' }}>
        Engine: <strong>Supertone/supertonic-3 (Official Space API)</strong>
      </p>

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
          <option value="F1">Lily / F1 (Female Indonesian - Supertonic 3)</option>
          <option value="F2">Sarah / F2 (Female Professional - Supertonic 3)</option>
          <option value="M1">M1 (Male - Supertonic 3)</option>
          <option value="M2">M2 (Male Professional - Supertonic 3)</option>
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
        {isLoading ? '⏳ Processing Audio...' : '🔊 Play Supertonic 3 Audio'}
      </button>

      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
        <div><strong>Status:</strong> {status}</div>
      </div>
    </div>
  );
}
