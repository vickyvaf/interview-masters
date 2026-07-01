import { useEffect, useRef, useState } from 'react'

function App() {
  // Webcam refs & state
  const videoRef = useRef<HTMLVideoElement>(null)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [webcamError, setWebcamError] = useState<string | null>(null)

  // WebSocket state
  const wsRef = useRef<WebSocket | null>(null)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting')
  const [userText, setUserText] = useState('')
  const [latestUserText, setLatestUserText] = useState('')
  const [latestAiText, setLatestAiText] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Audio Recording (Microphone) state
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Smooth status text transitions
  const [statusText, setStatusText] = useState('Ready to listen')
  const [statusOpacity, setStatusOpacity] = useState(1)

  // 1. Setup Webcam Feed
  useEffect(() => {
    let activeStream: MediaStream | null = null

    async function enableWebcam() {
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
  }, [])

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

        if (eventType === 'user.transcript') {
          setLatestUserText(eventData.text || '')
        } else if (eventType === 'assistant.text') {
          setLatestAiText(eventData.text || '')
          setIsThinking(false)
        } else if (eventType === 'assistant.audio.ready') {
          const audioBase64 = eventData.audio_base64
          if (audioBase64) {
            const audio = new Audio(`data:audio/wav;base64,${audioBase64}`)
            audio.onplay = () => setIsSpeaking(true)
            audio.onended = () => setIsSpeaking(false)
            audio.onerror = () => setIsSpeaking(false)
            audio.play().catch((err) => {
              console.error('Audio play error:', err)
              setIsSpeaking(false)
            })
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
      socket.close()
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

  // 4. Send text to backend via WebSocket
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userText.trim() || !wsRef.current || wsStatus !== 'connected') return

    const textToSend = userText.trim()
    setLatestUserText(textToSend)
    setLatestAiText('')
    setIsThinking(true)
    setUserText('')

    wsRef.current.send(
      JSON.stringify({
        event: 'user.transcript',
        data: { text: textToSend }
      })
    )
  }

  // 5. Voice Recording triggers
  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        // Convert blob to base64
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1]
          if (wsRef.current && wsStatus === 'connected') {
            setIsThinking(true)
            setLatestUserText('Sending audio response...')
            setLatestAiText('')
            wsRef.current.send(
              JSON.stringify({
                event: 'user.audio',
                data: { audio_base64: base64Data }
              })
            )
          }
        }
        reader.readAsDataURL(audioBlob)

        // Stop all tracks on the audioStream to release microphone
        audioStream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error starting microphone recording:', err)
      alert('Could not access microphone.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div style={styles.container}>
      {/* AI Box (Left) */}
      <div style={styles.box}>
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

        {/* Minimal Dialogue Transcript */}
        <div style={styles.chatDisplay}>
          {latestUserText && (
            <div style={styles.dialogueRow}>
              <span style={styles.dialogueLabel}>You:</span>
              <span style={styles.dialogueContent}>{latestUserText}</span>
            </div>
          )}
          {latestAiText && (
            <div style={styles.dialogueRow}>
              <span style={styles.dialogueLabel}>AI:</span>
              <span style={styles.dialogueContent}>{latestAiText}</span>
            </div>
          )}
        </div>

        {/* Simple Text & Voice Input Form */}
        <form onSubmit={handleSendMessage} style={styles.form}>
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={wsStatus !== 'connected' || isThinking}
            style={{
              ...styles.micButton,
              borderColor: isRecording ? '#ef4444' : 'var(--border-box)',
              backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-app)',
              color: isRecording ? '#ef4444' : 'var(--text-primary)'
            }}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isRecording ? (
                <>
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </>
              ) : (
                <>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </>
              )}
            </svg>
          </button>

          <input
            type="text"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder={isRecording ? "Recording voice..." : "Type a message..."}
            disabled={wsStatus !== 'connected' || isThinking || isRecording}
            style={styles.input}
          />
          <button
            type="submit"
            disabled={wsStatus !== 'connected' || isThinking || !userText.trim() || isRecording}
            style={styles.sendButton}
          >
            Send
          </button>
        </form>
      </div>

      {/* User Box (Right) */}
      <div style={styles.box}>
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
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />
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
  chatDisplay: {
    width: '100%',
    maxWidth: '400px',
    height: '120px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
    overflowY: 'auto' as const,
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
  form: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    gap: '12px',
  },
  micButton: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    border: '1px solid var(--border-box)',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '6px',
    border: '1px solid var(--border-box)',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    padding: '10px 18px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--text-primary)',
    color: 'var(--bg-app)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
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
}

export default App
