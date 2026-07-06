import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') })

const app = new Hono()
app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'healthy' }))

// Basic fallback endpoints (matching FastAPI endpoints, though browser uses WS)
app.post('/chat', async (c) => {
  try {
    const body = await c.req.json()
    const reply = await generateGeminiResponse(body.message, body.history)
    return c.json({ response: reply, tokens_used: reply.split(/\s+/).length })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

const port = Number(process.env.PORT) || 5005
const server = serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`[Backend] Server running on http://localhost:${info.port}`)
})

// Attach WebSocket Server
const wss = new WebSocketServer({ server: server as any })

// Environment configurations
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const SYSTEM_LANGUAGE = process.env.SYSTEM_LANGUAGE || 'id'
const LLM_MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash'

const SYSTEM_INSTRUCTION = SYSTEM_LANGUAGE === 'en'
  ? "You are a professional, helpful, and friendly job interview evaluator. Always respond in English. Keep your responses concise and interactive. Start the conversation with natural, human-like small talk (e.g. greeting the candidate, asking how their day is going) before asking about the job position or explaining the STAR methodology. Only introduce and guide the candidate through the STAR (Situation, Task, Action, Result) methodology once the interview topic formally begins."
  : "Anda adalah penilai simulasi wawancara kerja yang profesional, membantu, dan ramah. Selalu berikan respons dalam Bahasa Indonesia yang ringkas dan interaktif. Mulailah percakapan dengan basa-basi yang santai dan alami layaknya manusia (seperti menyapa hangat, menanyakan kabar, atau menanyakan hari mereka) sebelum menanyakan posisi pekerjaan atau menjelaskan metode STAR. Hanya jelaskan dan pandu kandidat menggunakan metode STAR (Situation, Task, Action, Result) setelah obrolan wawancara secara formal dimulai."

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

async function generateGeminiResponse(message: string, history: GeminiMessage[] = []): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `[No API Key] Terima kasih atas jawaban Anda mengenai '${message}'. Bisakah Anda menjelaskan lebih detail menggunakan metode STAR (Situation, Task, Action, Result)?`
  }

  const modelsToTry = [LLM_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  let lastError: any = null

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ]
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const resData: any = await response.json()
      const candidates = resData.candidates || []
      if (candidates.length > 0) {
        const text = candidates[0].content?.parts?.[0]?.text
        if (text) {
          return text
        }
      }
      throw new Error('No valid response candidate from model.')
    } catch (err) {
      lastError = err
      // ponytail: fallback loop to try the next model
      continue
    }
  }

  return `[Gemini Error: ${lastError?.message || lastError}] Terima kasih atas jawaban Anda. Bisakah Anda menjelaskan lebih detail menggunakan metode STAR?`
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', 'http://localhost')
  if (url.pathname !== '/ws/voice') {
    ws.close(1008, 'Unsupported path')
    return
  }

  console.log(`\n[WS] Client connected. SYSTEM_LANGUAGE is '${SYSTEM_LANGUAGE}'`)

  // Local connection state to maintain conversation context
  const connectionHistory: GeminiMessage[] = []

  // Send session.started event
  ws.send(JSON.stringify({
    event: 'session.started',
    data: {
      message: 'Connected to voice socket session.',
      system_language: SYSTEM_LANGUAGE
    }
  }))

  ws.on('message', async (data) => {
    try {
      const payload = JSON.parse(data.toString())
      const eventType = payload.event
      const eventData = payload.data || {}

      if (eventType === 'user.transcript') {
        const userText = eventData.text || ''
        console.log(`\n[WS] Received user.transcript: '${userText}'`)
        console.log(`[LLM] Processing response using model: ${LLM_MODEL}...`)

        // 1. Generate Chat Response
        const assistantText = await generateGeminiResponse(userText, connectionHistory)
        console.log(`[LLM] Generated response: '${assistantText}'`)

        // 2. Update session history
        connectionHistory.push(
          { role: 'user', parts: [{ text: userText }] },
          { role: 'model', parts: [{ text: assistantText }] }
        )

        // 3. Send back to client
        ws.send(JSON.stringify({
          event: 'assistant.text',
          data: { text: assistantText }
        }))
        console.log(`[WS] Sent assistant.text back to client.`)
      } else {
        console.log(`[WS] Received unsupported event type: '${eventType}'`)
        ws.send(JSON.stringify({
          event: 'error',
          data: { message: `Unsupported event type: ${eventType}` }
        }))
      }
    } catch (err: any) {
      console.error(`[WS] Error processing payload: ${err}`)
      ws.send(JSON.stringify({
        event: 'error',
        data: { message: `Internal error processing payload: ${err.message}` }
      }))
    }
  })

  ws.on('close', () => {
    console.log('[WS] Client disconnected')
  })
})
