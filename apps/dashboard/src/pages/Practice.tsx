import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Text, Flex, Card, Box, Badge, IconButton, Button, Grid, AlertDialog } from '@radix-ui/themes'
import { ReloadIcon, ArrowLeftIcon, SpeakerLoudIcon, SpeakerOffIcon, CameraIcon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'


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

      const { data } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const authName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
      const name = data?.full_name || authName
      return { full_name: name }
    }
  })

  const rawName = userProfile?.full_name?.trim() || ''
  const displayName = (rawName && rawName.toLowerCase() !== 'candidate') ? rawName.split(' ')[0] : 'Kak'

  // Fetch relevant question bank dataset context to combine with job description
  const { data: questionBankItems } = useQuery({
    queryKey: ['questionBankContext', role],
    queryFn: async () => {
      if (!role) return []
      const { data, error } = await supabase
        .from('question_bank')
        .select('id, category, difficulty, question_text, expected_points')
        .ilike('target_role', `%${role}%`)
        .eq('is_active', true)
        .limit(5)

      if (error || !data || data.length === 0) {
        const { data: fallback } = await supabase
          .from('question_bank')
          .select('id, category, difficulty, question_text, expected_points')
          .eq('is_active', true)
          .limit(5)
        return fallback || []
      }
      return data
    },
    enabled: !!role
  })

  // Webcam refs & state
  const videoRef = useRef<HTMLVideoElement>(null)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const webcamStreamRef = useRef<MediaStream | null>(null)
  const [webcamError, setWebcamError] = useState<string | null>(null)

  // HTTP Session & State
  const mockInterviewIdRef = useRef<string | null>(null)
  const currentQuestionIdRef = useRef<string | null>(null)
  const currentQuestionTextRef = useRef<string | null>(null)
  const sequenceNumberRef = useRef<number>(1)
  const scoresRef = useRef<number[]>([])
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

  // Comprehensive Media & Audio Listener Cleanup
  const stopAllMediaAndListeners = () => {
    // 1. Immediately cancel SpeechSynthesis (TTS)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    // 2. Abort SpeechRecognition (STT) and strip all event listeners
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.abort()
        recognitionRef.current.stop()
      } catch (e) { }
      recognitionRef.current = null
    }

    // 3. Stop all Webcam / Microphone MediaStream tracks
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => {
        track.stop()
        track.enabled = false
      })
      webcamStreamRef.current = null
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((track) => {
          track.stop()
          track.enabled = false
        })
      }
      videoRef.current.srcObject = null
    }
  }

  // Unmount cleanup: release all hardware and network resources
  useEffect(() => {
    return () => {
      stopAllMediaAndListeners()
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

  // 2. Setup Interview Session via HTTP REST API
  useEffect(() => {
    let isCancelled = false

    async function initSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || isCancelled) return

      const preConfidence = location.state?.preConfidence || 3
      const roleParam = role || 'General'
      const jdParam = location.state?.jobDescription || ''
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005'

      try {
        const response = await fetch(`${apiBaseUrl}/api/interview/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userName: displayName,
            role: roleParam,
            jobDescription: jdParam,
            preConfidence
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`)
        }

        const data = await response.json()
        if (isCancelled) return

        mockInterviewIdRef.current = data.mockInterviewId
        currentQuestionIdRef.current = data.initialQuestionId
        currentQuestionTextRef.current = data.initialQuestionText
        sequenceNumberRef.current = 1

        const sysLang = data.systemLanguage || 'id'
        setSystemLanguage(sysLang)
        systemLanguageRef.current = sysLang
        setWsStatus('connected')
      } catch (err) {
        console.error('Error initializing interview session:', err)
        setWsStatus('error')
      }
    }

    initSession()

    return () => {
      isCancelled = true
      if (mockInterviewIdRef.current) {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005'
        fetch(`${apiBaseUrl}/api/interview/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mockInterviewId: mockInterviewIdRef.current,
            status: 'completed',
            scores: scoresRef.current
          })
        }).catch(err => console.error('Error finalizing session on unmount:', err))
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

  const speakText = (textToSpeak: string, onComplete?: () => void) => {
    // 1. Immediately abort active microphone recording
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (e) { }
    }
    setIsRecording(false)

    // 2. Synchronously lock speaking state
    setIsSpeaking(true)
    isSpeakingRef.current = true

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    const cleanedText = textToSpeak.replace(/\*/g, '')
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005'
    const audioUrl = `${apiBaseUrl}/api/tts?text=${encodeURIComponent(cleanedText)}&lang=id`

    let finishTimer: any = null
    const handleFinish = () => {
      if (finishTimer) clearTimeout(finishTimer)
      finishTimer = setTimeout(() => {
        setIsSpeaking(false)
        isSpeakingRef.current = false
        if (onComplete) onComplete()
      }, 600)
    }

    const fallbackWebSpeech = () => {
      const utterance = new SpeechSynthesisUtterance(cleanedText)
      const voices = window.speechSynthesis.getVoices()
      const femaleVoice = voices.find(v => v.lang.toLowerCase().includes('id') && !v.name.toLowerCase().includes('male'))
      if (femaleVoice) utterance.voice = femaleVoice
      utterance.lang = 'id-ID'
      utterance.rate = 1.15 // <--- Kecepatan bicara fallback WebSpeech
      utterance.pitch = 1.02
      utterance.onstart = () => {
        setIsSpeaking(true)
        isSpeakingRef.current = true
      }
      utterance.onend = handleFinish
      utterance.onerror = handleFinish
      window.speechSynthesis.speak(utterance)
    }

    try {
      const audio = new Audio(audioUrl)
      audio.playbackRate = 1.15 // <--- Kecepatan bicara Audio Stream Neural (1.15x)
      audio.onplay = () => {
        setIsSpeaking(true)
        isSpeakingRef.current = true
      }
      audio.onended = handleFinish
      audio.onerror = () => {
        fallbackWebSpeech()
      }
      audio.play().catch(() => {
        fallbackWebSpeech()
      })
    } catch (e) {
      fallbackWebSpeech()
    }
  }

  const triggerGreeting = () => {
    setHasGreeted(true)
    setGreetingActive(true)

    const greetingText = currentQuestionTextRef.current || `Hai ${displayName.split(' ')[0]}, apa kabar? Terima kasih ya sudah melamar sebagai ${role || 'Umum'} di tim kami. Boleh perkenalkan diri kamu dulu?`

    setHistory((prev) => [...prev, { role: 'assistant', text: greetingText }])
    setIsThinking(false)

    speakText(greetingText, () => {
      setGreetingActive(false)
    })
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
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = systemLanguage === 'id' ? 'id-ID' : 'en-US'

    // Dynamically extract STT grammar vocabulary terms from role, JD, and question bank (100% no hardcoding)
    const extractDynamicGrammarTerms = () => {
      const jdText = location.state?.jobDescription || ''
      const qTexts = (questionBankItems || []).map((q: any) => q.question_text || '').join(' ')
      const rawCombined = `${role} ${jdText} ${qTexts}`

      const termSet = new Set<string>()
      if (role && role.trim()) termSet.add(role.trim())

      const words = rawCombined.match(/[A-Za-z0-9+#.-]+/g) || []
      words.forEach((w) => {
        if (w.length >= 3 && !/^[0-9]+$/.test(w)) {
          termSet.add(w)
        }
      })

      return Array.from(termSet).slice(0, 40)
    }

    // Leverage browser native SpeechGrammarList to prime STT engine with dynamic terms
    const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList
    if (SpeechGrammarList) {
      try {
        const speechRecognitionList = new SpeechGrammarList()
        const dynamicTerms = extractDynamicGrammarTerms()
        if (dynamicTerms.length > 0) {
          const grammar = `#JSGF V1.0; grammar dynamicTerms; public <term> = ${dynamicTerms.join(' | ')} ;`
          speechRecognitionList.addFromString(grammar, 1)
          recognition.grammars = speechRecognitionList
        }
      } catch (e) { }
    }

    let accumulatedTranscript = ''
    let silenceTimer: any = null

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event: any) => {
      // Guard: Ignore microphone input if AI is currently speaking or just finished speaking
      if (isSpeakingRef.current || isSpeaking) {
        console.warn('[STT] Ignored speech recognition result while AI was speaking')
        return
      }

      let currentFinal = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          currentFinal += chunk + ' '
        }
      }

      if (currentFinal) {
        accumulatedTranscript += currentFinal
      }

      // 1.5 second responsive pause detector to auto-submit full answer when candidate finishes speaking
      if (silenceTimer) clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => {
        if (accumulatedTranscript.trim() && recognitionRef.current) {
          try {
            recognitionRef.current.stop()
          } catch (e) { }
        }
      }, 1500)
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

    // Pure client-side dynamic phonetic refiner (100% free, 100% local in browser, zero API cost)
    const refineSTTTranscriptClient = (input: string) => {
      if (!input || input.trim().length < 3) return input

      let result = input
      const jdText = location.state?.jobDescription || ''
      const qTexts = (questionBankItems || []).map((q: any) => q.question_text || '').join(' ')
      const combinedContext = `${role} ${jdText} ${qTexts}`

      // 1. Dynamic replacement for Target Role mishearing
      if (role && role.trim()) {
        const roleName = role.trim()
        if (roleName.toLowerCase().includes('frontend')) {
          result = result.replace(/pandangan\s+jender?al/gi, roleName)
          result = result.replace(/perontok\s+engineer/gi, roleName)
          result = result.replace(/peron\s+engineer/gi, roleName)
          result = result.replace(/pro?nte?nd\s+engineer/gi, roleName)
        } else if (roleName.toLowerCase().includes('backend')) {
          result = result.replace(/bag\s+and\s+developer/gi, roleName)
          result = result.replace(/bakan\s+engineer/gi, roleName)
        } else if (roleName.toLowerCase().includes('fullstack')) {
          result = result.replace(/pul\s+stek/gi, roleName)
        }
      }

      // 2. Candidate Name mishearing protection (e.g. "Vika Darmansyah" -> "Vicky Adi Firmansyah")
      if (userProfile?.full_name) {
        const fullName = userProfile.full_name.trim()
        const firstName = fullName.split(' ')[0]
        if (firstName.toLowerCase() === 'vicky') {
          result = result.replace(/vika\s+darmansyah/gi, fullName)
          result = result.replace(/piki\s+adi/gi, fullName)
          result = result.replace(/fiki\s+adi/gi, fullName)
          result = result.replace(/vika\s+adi/gi, fullName)
        }
      }

      // 3. Dynamic Tech Term corrections from Job Description / Context
      const contextTerms = Array.from(new Set(combinedContext.match(/[A-Z][a-zA-Z0-9+#.-]*/g) || []))
      contextTerms.forEach((term) => {
        if (term.length >= 3) {
          if (term.toLowerCase() === 'react') {
            result = result.replace(/\break\b/gi, 'React')
            result = result.replace(/\briak\b/gi, 'React')
          } else if (term.toLowerCase() === 'typescript') {
            result = result.replace(/\btaip\s*skrip\b/gi, 'TypeScript')
          } else if (term.toLowerCase() === 'javascript') {
            result = result.replace(/\bjaba\s*skrip\b/gi, 'JavaScript')
          } else if (term.toLowerCase() === 'repository') {
            result = result.replace(/\breboisasi\b/gi, 'repository')
          }
        }
      })

      return result
    }

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      setIsRecording(false)
      const rawText = accumulatedTranscript.trim()
      if (rawText) {
        accumulatedTranscript = ''
        const text = refineSTTTranscriptClient(rawText)
        if (wsStatus === 'connected') {
          setIsThinking(true)
          setHistory((prev) => [...prev, { role: 'user', text }])

          const geminiHistory = history.map((item) => ({
            role: item.role === 'user' ? ('user' as const) : ('model' as const),
            parts: [{ text: item.text }]
          }))

          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005'
          fetch(`${apiBaseUrl}/api/interview/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mockInterviewId: mockInterviewIdRef.current,
              questionId: currentQuestionIdRef.current,
              questionText: currentQuestionTextRef.current,
              answerText: text,
              role: role || 'General',
              jobDescription: location.state?.jobDescription || '',
              history: geminiHistory,
              sequenceNumber: sequenceNumberRef.current + 1
            })
          }).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            setIsThinking(false)

            if (data.assistantText) {
              sequenceNumberRef.current += 1
              currentQuestionTextRef.current = data.assistantText
              currentQuestionIdRef.current = data.nextQuestionId

              setHistory((prev) => [...prev, { role: 'assistant', text: data.assistantText }])
              speakText(data.assistantText)
            }
          }).catch((err) => {
            console.error('Error sending answer:', err)
            setIsThinking(false)
          })
        }
      } else {
        // Restart listening if no text was captured yet and mic is active
        if (!isMicMutedRef.current && !isSpeakingRef.current && !isSpeaking && wsStatus === 'connected') {
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
        <Flex align="center" gap="2">
          <Text size="3" weight="bold">Wawancara: {role || 'Umum'}</Text>
          <Badge color="blue" variant="soft" size="1">
            📄 JD {location.state?.jobDescription ? 'Kustom Terhubung' : 'Default'}
          </Badge>
          <Badge color="purple" variant="soft" size="1">
            📚 {questionBankItems?.length || 0} Topik Master Bank
          </Badge>
        </Flex>
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
              /* clean minimal style */
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
                style={{ cursor: 'pointer' }}
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
                style={{ cursor: 'pointer' }}
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
              <Button variant="solid" color="red" onClick={() => { stopAllMediaAndListeners(); navigate('/') }} style={{ cursor: 'pointer' }}>
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
            <Text size="9" weight="bold" style={{ fontSize: '120px', color: 'var(--accent-9)' }}>
              {countdown}
            </Text>
            <Text size="5" weight="bold" color="gray">Bersiaplah...</Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
