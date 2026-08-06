import { useState, useEffect } from 'react';

export default function App() {
  const [text, setText] = useState('Halo! Perkenalkan saya Sarah dari Supertonic 3. Selamat datang di Interview Masters!');
  const [speaker, setSpeaker] = useState('Sarah');
  const [language, setLanguage] = useState('indonesian');
  const [serverUrl, setServerUrl] = useState('/api-tts');
  const [status, setStatus] = useState('Ready');
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

  // Mode 1: Supertonic Serve (http://127.0.0.1:7788/tts)
  const speakSupertonicServe = async () => {
    try {
      setStatus('Synthesizing via Supertonic 3 Serve Server...');
      const voiceMap: Record<string, string> = {
        Lily: 'F1',
        Sarah: 'F2',
        Jessica: 'F3',
        Olivia: 'F4',
        Emily: 'F5'
      };
      const voiceStyle = voiceMap[speaker] || 'F1';

      const res = await fetch(`${serverUrl}/v1/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: voiceStyle,
          lang: 'id',
          speed: 1.0
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      setStatus('Playing audio (Supertonic 3 - Lily)...');
      audio.onended = () => setStatus('Finished playing.');
      audio.onerror = (e) => setStatus(`Audio playback error: ${e}`);
      await audio.play();
    } catch (err: any) {
      console.error(err);
      setStatus(`Supertonic Serve Error: ${err.message}. Trying Web Speech fallback...`);
      speakWebSpeechFallback();
    }
  };

  // Mode 2: Web Speech API Fallback (Tuned for female Lily accent)
  const speakWebSpeechFallback = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setStatus('Web Speech API not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const matchedVoice = voices.find(v => v.name === selectedWebVoice);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = 'id-ID';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.3; // Tuned higher pitch for female Lily accent

    utterance.onstart = () => setStatus('Playing audio (Web Speech API Fallback - Lily)...');
    utterance.onend = () => setStatus('Finished playing.');
    utterance.onerror = (e) => setStatus(`Web Speech Error: ${e.error}`);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Supertonic 3 TTS Tester</h1>
      <p style={{ color: '#666' }}>Voice: <strong>Lily (Female Indonesian)</strong></p>

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
          <option value="Lily">Lily (Female - Recommended)</option>
          <option value="Sarah">Sarah (Female)</option>
          <option value="Jessica">Jessica (Female)</option>
          <option value="Olivia">Olivia (Female)</option>
          <option value="Emily">Emily (Female)</option>
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
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Supertonic Serve URL:</label>
        <input
          type="text"
          style={{ width: '100%', padding: '8px' }}
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Fallback Browser Voice:</label>
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
          onClick={speakSupertonicServe}
          style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          🔊 Speak (Supertonic Serve)
        </button>

        <button
          onClick={speakWebSpeechFallback}
          style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          🔊 Speak (Web Speech Fallback)
        </button>
      </div>

      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}
