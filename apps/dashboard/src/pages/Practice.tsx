import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Text, Flex, Card, Box, Badge, IconButton, Button, Grid, AlertDialog } from '@radix-ui/themes'
import { ReloadIcon, ArrowLeftIcon, SpeakerLoudIcon, SpeakerOffIcon, CameraIcon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const getRoleLabel = (roleKey?: string) => {
  switch (roleKey) {
    case 'software_engineer':
      return 'Software Engineer'
    case 'product_manager':
      return 'Product Manager'
    case 'data_analyst':
      return 'Data Analyst'
    case 'marketing_associate':
      return 'Marketing Associate'
    default:
      return roleKey
        ? roleKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Umum'
  }
}

export default function Practice() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role } = location.state || {}
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [errorDialogText, setErrorDialogText] = useState<string | null>(null)

  // Fetch candidate's profile full name
  const { data: userProfile } = useQuery({
    queryKey: ['userProfileName'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (error) return null
      return data
    }
  })

  const displayName = userProfile?.full_name || 'Candidate'

  // Webcam refs & state
  const videoRef = useRef<HTMLVideoElement>(null)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const webcamStreamRef = useRef<MediaStream | null>(null)
  const [webcamError, setWebcamError] = useState<string | null>(null)

  // WebSocket state
  const wsRef = useRef<WebSocket | null>(null)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting')
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(() => localStorage.getItem('isMicMuted') === 'true')
  const [isCameraOff, setIsCameraOff] = useState(() => localStorage.getItem('isCameraOff') === 'true')
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [hasGreeted, setHasGreeted] = useState(false)
  const [greetingActive, setGreetingActive] = useState(false)
  const [showReadyModal, setShowReadyModal] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
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

  // Unmount cleanup: release all hardware and network resources
  useEffect(() => {
    return () => {
      // 1. Stop webcam stream tracks
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      // 2. Cancel speech synthesis (TTS)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      // 3. Stop speech recognition (STT)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) { }
      }
      // 4. Close WebSocket connection
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch (e) { }
      }
    }
  }, [])

  // Prompt warning before reload or closing tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Apakah Anda yakin ingin keluar? Sesi wawancara aktif akan dihentikan.'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

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
        webcamStreamRef.current = null
        return
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false
        })
        activeStream = mediaStream
        webcamStreamRef.current = mediaStream
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
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5005/ws/voice'
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
        socket.onopen = () => {
          try {
            socket.close()
          } catch (e) { }
        }
      }
    }
  }, [])

  // 2b. Trigger "Apakah Anda Sudah Siap" modal on connection success
  useEffect(() => {
    if (wsStatus === 'connected' && !hasGreeted && !showReadyModal && countdown === null) {
      setShowReadyModal(true)
    }
  }, [wsStatus, hasGreeted])

  const handleStartPractice = () => {
    setShowReadyModal(false)
    setCountdown(3)
  }

  // 2c. Countdown tick effect
  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      triggerGreeting()
      setCountdown(null)
    }
  }, [countdown])

  const triggerGreeting = () => {
    setHasGreeted(true)
    setGreetingActive(true)
    
    const getGreetingTime = () => {
      const hour = new Date().getHours()
      if (hour < 11) return 'pagi'
      if (hour < 15) return 'siang'
      if (hour < 18) return 'sore'
      return 'malam'
    }

    const roleLabel = getRoleLabel(role)
    const greetingText = `Halo, selamat ${getGreetingTime()}. Saya adalah pewawancara AI Anda hari ini. Selamat datang di simulasi wawancara untuk posisi ${roleLabel}. Mari kita mulai. Silakan perkenalkan diri Anda terlebih dahulu.`

    setHistory((prev) => [...prev, { role: 'assistant', text: greetingText }])

    setIsThinking(false)
    const utterance = new SpeechSynthesisUtterance(greetingText)
    utterance.lang = systemLanguageRef.current === 'id' ? 'id-ID' : 'en-US'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      setGreetingActive(false)
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      setGreetingActive(false)
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

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
    if (!SpeechRecognition || wsStatus !== 'connected' || isMicMuted || isSpeaking || isThinking || greetingActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) { }
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
        setErrorDialogText("Microphone permission denied. Please allow microphone access in your browser settings to use the voice feature.")
      } else if (err.error === 'audio-capture') {
        isMicMutedRef.current = true
        setIsMicMuted(true)
        setErrorDialogText("Microphone hardware not found or cannot be accessed. Please check your connection and system sound settings.")
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
        if (!isMicMutedRef.current && !isSpeakingRef.current && !isThinkingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            recognition.start()
          } catch (e) { }
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
        } catch (e) { }
      }
    }
  }, [wsStatus, isMicMuted, isSpeaking, isThinking, systemLanguage, greetingActive])

  return (
    <Flex direction="column" gap="4" style={{
      height: '100vh',
      width: '100vw',
      padding: '24px',
      boxSizing: 'border-box',
      backgroundColor: 'var(--color-background)',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <Flex align="center" justify="between" style={{ height: '40px' }}>
        <Button size="2" variant="soft" color="gray" onClick={() => setShowLeaveDialog(true)} style={{ cursor: 'pointer' }}>
          <ArrowLeftIcon /> Back
        </Button>
        <Text size="3" weight="bold">Simulasi Wawancara AI - {getRoleLabel(role)}</Text>
        <div style={{ width: '70px' }} /> {/* Spacer to balance header */}
      </Flex>

      {/* Main Grid Area */}
      <Grid columns={isMobile ? '1' : '2'} gap="4" style={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* AI Box (Left) */}
        <Card size="3" style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'var(--gray-2)',
          border: '1px solid var(--gray-4)',
          borderRadius: '14px',
          overflow: 'hidden',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          {/* Status Badge */}
          <Box style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
            <Badge color={wsStatus === 'connected' ? 'green' : 'red'} size="2">
              <Flex align="center" gap="1">
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: wsStatus === 'connected' ? 'var(--green-9)' : 'var(--red-9)'
                }} />
                AI INTERVIEWER ({wsStatus.toUpperCase()})
              </Flex>
            </Badge>
          </Box>

          {/* AI Pulse Circle & Status */}
          <style>{`
            @keyframes waveScale {
              0% {
                transform: scale(1);
                opacity: 0.8;
              }
              100% {
                transform: scale(2.2);
                opacity: 0;
              }
            }
            .pulse-wave {
              position: absolute;
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background-color: var(--blue-a4);
              animation: waveScale 2s infinite linear;
              z-index: 1;
            }
            .wave-2 {
              animation-delay: 1s;
            }
            .ai-speaking-pulse {
              box-shadow: 0 0 20px var(--blue-6);
            }
          `}</style>
          <Flex direction="column" align="center" gap="3" style={{ marginBottom: '40px' }}>
            <div 
              className={isSpeaking ? "ai-speaking-pulse" : ""}
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--blue-a3)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              {isSpeaking && (
                <>
                  <div className="pulse-wave wave-1" />
                  <div className="pulse-wave wave-2" />
                </>
              )}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--blue-9)',
                  zIndex: 2,
                  transform: isSpeaking ? 'scale(1.2)' : isThinking ? 'scale(1.1)' : 'scale(1.0)',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <Text size="3" color="gray" style={{ transition: 'opacity 0.15s ease-in-out', opacity: statusOpacity }}>
              {statusText}
            </Text>
          </Flex>

          {/* Conversation History */}
          <Box style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            width: 'calc(100% - 48px)',
            maxHeight: '180px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '8px',
            boxSizing: 'border-box'
          }}>
            {history.map((msg, idx) => (
              <Flex key={idx} gap="2" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                <Text size="2" weight="bold" color={msg.role === 'user' ? 'green' : 'blue'} style={{ minWidth: '75px' }}>
                  {msg.role === 'user' ? `${displayName}:` : 'AI:'}
                </Text>
                <Text size="2" color="gray" style={{ flexGrow: 1 }}>{msg.text.replace(/\*/g, '')}</Text>
              </Flex>
            ))}
            <div ref={historyEndRef} />
          </Box>
        </Card>

        {/* User Box (Right) */}
        <Card size="3" style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'var(--gray-2)',
          border: '1px solid var(--gray-4)',
          borderRadius: '14px',
          overflow: 'hidden',
          padding: 0,
          boxSizing: 'border-box'
        }}>
          {/* Status Badge */}
          <Box style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
            <Badge color={webcamStream ? 'green' : 'red'} size="2">
              <Flex align="center" gap="1">
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: webcamStream ? 'var(--green-9)' : 'var(--red-9)'
                }} />
                {displayName.toUpperCase()}
              </Flex>
            </Badge>
          </Box>

          {webcamError ? (
            <Flex direction="column" align="center" gap="3" style={{ padding: '24px', textAlign: 'center' }}>
              <Text color="red" size="3">Camera Error: {webcamError}</Text>
              <Button onClick={() => window.location.reload()} size="2">
                <ReloadIcon /> Retry
              </Button>
            </Flex>
          ) : isCameraOff ? (
            <Flex direction="column" align="center" justify="center" style={{ width: '100%', height: '100%', backgroundColor: 'var(--gray-3)' }}>
              <CameraIcon width="48" height="48" style={{ color: 'var(--gray-8)' }} />
              <Text color="gray" size="2" style={{ marginTop: '12px' }}>Camera is turned off</Text>
            </Flex>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)'
              }}
            />
          )}

          {/* Toggle Controls */}
          {!webcamError && (
            <Flex gap="3" style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100
            }}>
              <IconButton
                onClick={() => setIsMicMuted(prev => !prev)}
                size="4"
                radius="full"
                color={isMicMuted ? 'red' : 'blue'}
                variant={isMicMuted ? 'solid' : 'soft'}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                style={{ cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                {isMicMuted ? (
                  <SpeakerOffIcon width="20" height="20" />
                ) : (
                  <SpeakerLoudIcon width="20" height="20" />
                )}
              </IconButton>
              <IconButton
                onClick={() => setIsCameraOff(prev => !prev)}
                size="4"
                radius="full"
                color={isCameraOff ? 'red' : 'blue'}
                variant={isCameraOff ? 'solid' : 'soft'}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                style={{ cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                {isCameraOff ? (
                  <CameraIcon width="20" height="20" style={{ opacity: 0.6 }} />
                ) : (
                  <CameraIcon width="20" height="20" />
                )}
              </IconButton>
            </Flex>
          )}
        </Card>
      </Grid>

      {/* AlertDialog for Leaving */}
      <AlertDialog.Root open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialog.Content style={{ maxWidth: 450 }}>
          <AlertDialog.Title>Keluar dari Sesi?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Apakah Anda yakin ingin keluar? Sesi wawancara aktif akan dihentikan dan progres sesi ini tidak akan tersimpan.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>
                Batal
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                Keluar
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* AlertDialog for Audio/Microphone Errors */}
      <AlertDialog.Root open={errorDialogText !== null} onOpenChange={(open) => !open && setErrorDialogText(null)}>
        <AlertDialog.Content style={{ maxWidth: 450 }}>
          <AlertDialog.Title>Koneksi Mikrofon Gagal</AlertDialog.Title>
          <AlertDialog.Description size="2">
            {errorDialogText}
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Action>
              <Button variant="solid" color="blue" onClick={() => setErrorDialogText(null)} style={{ cursor: 'pointer' }}>
                Oke
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* AlertDialog for Readiness Prompt */}
      <AlertDialog.Root open={showReadyModal} onOpenChange={setShowReadyModal}>
        <AlertDialog.Content style={{ maxWidth: 400 }}>
          <AlertDialog.Title>Apakah Anda Sudah Siap?</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Koneksi ke AI pewawancara telah terhubung. Pastikan kamera dan mikrofon Anda berfungsi dengan baik sebelum memulai simulasi.
          </AlertDialog.Description>
          <Flex gap="3" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" onClick={() => navigate('/interview')} style={{ cursor: 'pointer' }}>Batal</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button onClick={handleStartPractice} style={{ cursor: 'pointer' }}>Mulai Sekarang</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Full-screen Countdown Overlay */}
      {countdown !== null && (
        <Flex
          position="fixed"
          inset="0"
          align="center"
          justify="center"
          style={{
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Flex direction="column" align="center" gap="4">
            <Text size="9" weight="bold" style={{ fontSize: '120px', color: 'var(--accent-9)', textShadow: '0 0 20px var(--accent-5)' }}>
              {countdown}
            </Text>
            <Text size="5" weight="bold" color="gray">Bersiaplah...</Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
