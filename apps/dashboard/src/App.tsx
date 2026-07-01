import { useEffect, useRef, useState } from 'react'

function App() {
  // Webcam refs & state
  const videoRef = useRef<HTMLVideoElement>(null)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [webcamError, setWebcamError] = useState<string | null>(null)

  // WebSocket state
  const wsRef = useRef<WebSocket | null>(null)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting')
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(() => localStorage.getItem('isMicMuted') === 'true')
  const [isCameraOff, setIsCameraOff] = useState(() => localStorage.getItem('isCameraOff') === 'true')
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const historyEndRef = useRef<HTMLDivElement>(null)

  const isMicMutedRef = useRef(isMicMuted)
  useEffect(() => {
    localStorage.setItem('isMicMuted', String(isMicMuted))
    isMicMutedRef.current = isMicMuted
  }, [isMicMuted])

  useEffect(() => {
    localStorage.setItem('isCameraOff', String(isCameraOff))
  }, [isCameraOff])

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Audio state
  const [isRecording, setIsRecording] = useState(false)
  const [systemLanguage, setSystemLanguage] = useState<string>('id')
  const systemLanguageRef = useRef<string>('id')
  const recognitionRef = useRef<any>(null)

  const isSpeakingRef = useRef(false)
  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

  const isThinkingRef = useRef(false)
  useEffect(() => {
    isThinkingRef.current = isThinking
  }, [isThinking])

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history])

  // Smooth status text transitions
  const [statusText, setStatusText] = useState('Ready to listen')
  const [statusOpacity, setStatusOpacity] = useState(1)

  // 1. Setup Webcam Feed
  useEffect(() => {
    let activeStream: MediaStream | null = null

    async function enableWebcam() {
      if (isCameraOff) {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
          videoRef.current.srcObject = null
        }
        setWebcamStream(null)
        return
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false
        })
        activeStream = mediaStream
        setWebcamStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err: any) {
        console.error('Error accessing webcam:', err)
        setWebcamError(err.message || 'Could not access camera')
      }
    }

    enableWebcam()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isCameraOff])

  // 2. Setup WebSocket Connection to Backend
  useEffect(() => {
    const wsUrl = 'ws://localhost:5005/ws/voice'
    const socket = new WebSocket(wsUrl)
    wsRef.current = socket

    socket.onopen = () => {
      setWsStatus('connected')
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        const eventType = payload.event
        const eventData = payload.data || {}

        if (eventType === 'session.started') {
          const sysLang = eventData.system_language || 'id'
          setSystemLanguage(sysLang)
          systemLanguageRef.current = sysLang
        } else if (eventType === 'user.transcript') {
          const text = eventData.text || ''
          if (text) {
            setHistory((prev) => [...prev, { role: 'user', text }])
          }
        } else if (eventType === 'assistant.text') {
          const text = eventData.text || ''
          setIsThinking(false)
          if (text) {
            setHistory((prev) => [...prev, { role: 'assistant', text }])
            // ponytail: Speak the text using Web Speech API Synthesis matching system language
            const cleanedText = text.replace(/\*/g, '')
            const utterance = new SpeechSynthesisUtterance(cleanedText)
            utterance.lang = systemLanguageRef.current === 'id' ? 'id-ID' : 'en-US'
            utterance.onstart = () => setIsSpeaking(true)
            utterance.onend = () => setIsSpeaking(false)
            utterance.onerror = () => setIsSpeaking(false)
            window.speechSynthesis.cancel()
            window.speechSynthesis.speak(utterance)
          }
        } else if (eventType === 'error') {
          console.error('Backend WS Error:', eventData.message)
          setIsThinking(false)
        }
      } catch (err) {
        console.error('Error processing WS message:', err)
      }
    }

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err)
      setWsStatus('error')
    }

    socket.onclose = () => {
      setWsStatus('disconnected')
    }

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      } else if (socket.readyState === WebSocket.CONNECTING) {
        // Delay closing until connection is established to avoid the browser warning
        socket.onopen = () => {
          try {
            socket.close()
          } catch (e) {}
        }
      }
    }
  }, [])

  // 3. Status text transitions
  let targetText = 'Ready to listen'
  if (isSpeaking) {
    targetText = 'Speaking...'
  } else if (isThinking) {
    targetText = 'Thinking...'
  } else if (isRecording) {
    targetText = 'Listening...'
  }

  useEffect(() => {
    if (statusText !== targetText) {
      setStatusOpacity(0)
      const timeout = setTimeout(() => {
        setStatusText(targetText)
        setStatusOpacity(1)
      }, 150)
      return () => clearTimeout(timeout)
    }
  }, [targetText, statusText])

  // 4. Speech Recognition (STT) implementation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition || wsStatus !== 'connected' || isMicMuted || isSpeaking || isThinking) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
        setIsRecording(false)
      }
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = systemLanguage === 'id' ? 'id-ID' : 'en-US'

    let finalTranscript = ''

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex]
      if (result.isFinal) {
        finalTranscript = result[0].transcript
      }
    }

    recognition.onerror = (err: any) => {
      console.error('Speech recognition error:', err)
      if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
        isMicMutedRef.current = true
        setIsMicMuted(true)
        alert("Microphone permission denied. Please allow microphone access in your browser settings to use the voice feature.")
      } else if (err.error === 'audio-capture') {
        isMicMutedRef.current = true
        setIsMicMuted(true)
        alert("Microphone hardware not found or cannot be accessed. Please check your connection and system sound settings.")
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
      if (finalTranscript.trim()) {
        const text = finalTranscript.trim()
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          setIsThinking(true)
          setHistory((prev) => [...prev, { role: 'user', text }])
          wsRef.current.send(
            JSON.stringify({
              event: 'user.transcript',
              data: { text }
            })
          )
        }
      } else {
        // Automatically restart listening if nothing was transcribed and microphone is still active
        if (!isMicMutedRef.current && !isSpeakingRef.current && !isThinkingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            recognition.start()
          } catch (e) {}
        }
      }
    }

    try {
      recognition.start()
    } catch (e) {
      console.error('Error starting recognition:', e)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
    }
  }, [wsStatus, isMicMuted, isSpeaking, isThinking, systemLanguage])

  const containerStyle = {
    ...styles.container,
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '16px' : '24px',
    height: isMobile ? 'auto' : '100vh',
    padding: isMobile ? '16px' : '24px',
    overflow: isMobile ? 'auto' : 'hidden',
  }

  const boxStyle = {
    ...styles.box,
    padding: isMobile ? '16px' : '24px',
    height: isMobile ? '450px' : '100%',
  }

  return (
    <div style={containerStyle}>
      {/* AI Box (Left) */}
      <div style={boxStyle}>
        <div style={styles.labelContainer}>
          <span
            style={{
              ...styles.indicator,
              backgroundColor: wsStatus === 'connected' ? '#10b981' : '#ef4444'
            }}
          />
          <span style={styles.labelText}>
            AI INTERVIEWER ({wsStatus.toUpperCase()})
          </span>
        </div>

        <div style={styles.aiCenter}>
          <div style={styles.aiAvatar}>
            <div
              style={{
                ...styles.aiPulse,
                transform: isSpeaking ? 'scale(1.25)' : isThinking ? 'scale(1.1)' : 'scale(1.0)',
                opacity: isSpeaking ? 0.9 : isThinking ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          <p
            style={{
              ...styles.aiStatus,
              opacity: statusOpacity,
              transition: 'opacity 0.15s ease-in-out'
            }}
          >
            {statusText}
          </p>
        </div>

        {/* Conversation History (bottom-left corner) */}
        <div style={styles.historyContainer}>
          {history.map((msg, idx) => (
            <div key={idx} style={styles.dialogueRow}>
              <span
                style={{
                  ...styles.dialogueLabel,
                  color: msg.role === 'user' ? '#10b981' : '#3b82f6',
                  minWidth: '75px'
                }}
              >
                {msg.role === 'user' ? 'Candidate:' : 'AI:'}
              </span>
              <span style={styles.dialogueContent}>{msg.text.replace(/\*/g, '')}</span>
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>
      </div>

      {/* User Box (Right) */}
      <div style={boxStyle}>
        <div style={styles.labelContainer}>
          <span
            style={{
              ...styles.indicator,
              backgroundColor: webcamStream ? '#10b981' : '#ef4444'
            }}
          />
          <span style={styles.labelText}>YOU (CANDIDATE)</span>
        </div>

        {webcamError ? (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>Camera Error: {webcamError}</p>
            <button
              onClick={() => window.location.reload()}
              style={styles.retryButton}
            >
              Retry
            </button>
          </div>
        ) : isCameraOff ? (
          <div style={styles.cameraOffPlaceholder}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m4 0h5a2 2 0 0 1 2 2v3m4-2.7L23 8v8l-2.1-1.7M1 1l22 22"></path></svg>
            <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '14px' }}>Camera is turned off</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />
        )}

        {/* Toggle Controls (Mic & Camera) */}
        {!webcamError && (
          <div style={styles.controlBar}>
            <button
              onClick={() => {
                setIsMicMuted(prev => !prev)
              }}
              style={{
                ...styles.controlButton,
                backgroundColor: isMicMuted ? '#ef4444' : 'rgba(0,0,0,0.5)',
              }}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              )}
            </button>
            <button
              onClick={() => setIsCameraOff(prev => !prev)}
              style={{
                ...styles.controlButton,
                backgroundColor: isCameraOff ? '#ef4444' : 'rgba(0,0,0,0.5)',
              }}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m4 0h5a2 2 0 0 1 2 2v3m4-2.7L23 8v8l-2.1-1.7M1 1l22 22"></path></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '24px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
  },
  box: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'var(--bg-box)',
    borderRadius: '12px',
    border: '1px solid var(--border-box)',
    overflow: 'hidden',
    padding: '24px',
    boxSizing: 'border-box' as const,
  },
  labelContainer: {
    position: 'absolute' as const,
    top: '20px',
    left: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-label)',
    padding: '6px 12px',
    borderRadius: '6px',
    backdropFilter: 'blur(4px)',
    zIndex: 10,
  },
  indicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  labelText: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
  },
  aiCenter: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  aiAvatar: {
    position: 'relative' as const,
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'var(--ai-avatar-bg)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPulse: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--ai-pulse-bg)',
  },
  aiStatus: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  historyContainer: {
    position: 'absolute' as const,
    bottom: '20px',
    left: '20px',
    width: 'calc(100% - 40px)',
    maxHeight: '180px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    paddingRight: '8px',
    boxSizing: 'border-box' as const,
  },
  dialogueRow: {
    fontSize: '14px',
    lineHeight: '1.5',
    display: 'flex',
    gap: '8px',
  },
  dialogueLabel: {
    fontWeight: 600,
    color: 'var(--text-secondary)',
    minWidth: '36px',
  },
  dialogueContent: {
    color: 'var(--text-primary)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transform: 'scaleX(-1)', // Mirror effect for webcams
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    textAlign: 'center' as const,
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px',
    margin: 0,
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: 'var(--bg-retry)',
    border: '1px solid var(--border-retry)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    outline: 'none',
  },
  cameraOffPlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#111827',
  },
  controlBar: {
    position: 'absolute' as const,
    bottom: '20px',
    display: 'flex',
    gap: '12px',
    zIndex: 100,
  },
  controlButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
}

export default App
