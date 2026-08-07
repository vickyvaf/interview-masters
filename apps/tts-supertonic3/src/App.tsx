import { useState, useEffect } from 'react';

export default function App() {
  const [text, setText] = useState('Halo! Ini adalah suara Supertonic.');
  const [speaker, setSpeaker] = useState('Lily');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handlePlay = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setPlaying(true);

    const utterance = new SpeechSynthesisUtterance(text);

    // Pick best matching voice for Indonesian / Lily / Sarah profile
    const nonGoogleVoices = voices.filter((v) => !v.name.toLowerCase().includes('google') && !v.name.toLowerCase().includes('male'));
    const pool = nonGoogleVoices.length > 0 ? nonGoogleVoices : voices;

    const matchedVoice =
      pool.find(
        (v) =>
          v.lang.toLowerCase().includes('id') &&
          (v.name.toLowerCase().includes(speaker.toLowerCase()) || v.name.toLowerCase().includes('female'))
      ) ||
      pool.find((v) => v.lang.toLowerCase().includes('id')) ||
      pool.find((v) => v.lang.toLowerCase().includes('en')) ||
      voices[0];

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = 'id-ID';
    }

    utterance.rate = 1.0;
    utterance.pitch = speaker === 'Lily' ? 1.15 : 1.05;

    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    window.speechSynthesis.speak(utterance);
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
          <option value="Lily">Lily (Female Indonesian)</option>
          <option value="Sarah">Sarah (Female Professional)</option>
        </select>
      </div>

      <button
        onClick={handlePlay}
        disabled={playing}
        style={{ padding: '8px 16px', cursor: playing ? 'wait' : 'pointer' }}
      >
        {playing ? 'Speaking...' : 'Play Sound'}
      </button>
    </div>
  );
}
