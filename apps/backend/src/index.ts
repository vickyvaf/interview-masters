import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config()
const isProd = process.env.NODE_ENV === 'production'
dotenv.config({ path: path.resolve(process.cwd(), isProd ? '../../.env.production' : '../../.env.local') })

const app = new Hono()
app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'healthy' }))

// Create Mayar Payment Link Checkout Session
app.post('/payments/create-checkout', async (c) => {
  try {
    const { email, name } = await c.req.json()
    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    const MAYAR_API_KEY = process.env.MAYAR_API_KEY
    if (!MAYAR_API_KEY) {
      return c.json({ error: 'Mayar API Key is not configured on server' }, 500)
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const mayarDomain = isProduction ? 'api.mayar.id' : 'api.mayar.club'

    const response = await fetch(`https://${mayarDomain}/hl/v1/invoice/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAYAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name || 'Candidate',
        email: email,
        amount: 99000,
        mobile: '08123456789',
        redirectUrl: `${process.env.PUBLIC_DASHBOARD_URL || 'http://localhost:5173'}/billing?payment=success`,
        description: 'Pro Subscription - Interview Masters'
      })
    })

    const data: any = await response.json()
    if (data.status === 'success' && data.data?.link) {
      return c.json({ checkoutUrl: data.data.link })
    } else {
      console.error('Mayar Error response:', data)
      const errorMsg = data.message || (data.errors ? JSON.stringify(data.errors) : JSON.stringify(data))
      return c.json({ error: errorMsg }, 500)
    }
  } catch (err: any) {
    console.error('Checkout error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// Mayar Webhook Signature Validation & Database Update
app.post('/webhook/mayar', async (c) => {
  try {
    const signature = c.req.header('x-mayar-signature')
    const rawBody = await c.req.text()
    
    // Validate signature
    const secret = process.env.MAYAR_WEBHOOK_SECRET || ''
    const { createHmac } = await import('crypto')
    const computedSignature = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    if (signature !== computedSignature) {
      console.error('[Webhook] Invalid webhook signature. Received:', signature, 'Computed:', computedSignature)
      return c.json({ error: 'Invalid signature' }, 401)
    }

    const body = JSON.parse(rawBody)
    console.log('[Webhook] Received validated Mayar event:', body.event)

    const allowedEvents = ['payment.received', 'payment.success', 'subscription.created']
    if (allowedEvents.includes(body.event) || body.event?.startsWith('payment')) {
      const customerEmail = body.data?.customerEmail
      if (customerEmail) {
        console.log(`[Webhook] Upgrading user with email: ${customerEmail} to PRO tier.`)
        
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SECRET_KEY

        // 1. Fetch user by email to get their ID
        const userRes = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(customerEmail)}`, {
          headers: {
            'apikey': supabaseKey || '',
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        if (!userRes.ok) {
          throw new Error(`Failed to query user: ${await userRes.text()}`)
        }
        const users = await userRes.json()
        const user = users?.[0]
        
        if (user) {
          // 2. Update user tier to PRO
          const updateRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tier: 'pro',
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
          })
          if (!updateRes.ok) {
            console.error(`[Webhook] Failed to update user tier: ${await updateRes.text()}`)
          }

          // 3. Insert or update subscriptions table
          const subRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              user_id: user.id,
              tier: 'pro',
              status: 'active',
              price: body.data?.amount || 99000,
              billing_cycle: 'monthly',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          })
          
          let subscriptionId = null
          if (subRes.ok) {
            const subs = await subRes.json()
            subscriptionId = subs?.[0]?.id
          } else {
            console.error(`[Webhook] Failed to create subscription row: ${await subRes.text()}`)
          }

          // 4. Insert into payments table
          const payRes = await fetch(`${supabaseUrl}/rest/v1/payments`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: user.id,
              subscription_id: subscriptionId,
              invoice_id: body.data?.id || 'INV-' + Date.now(),
              payment_gateway: 'mayar',
              transaction_id: body.data?.id || 'TX-' + Date.now(),
              amount: body.data?.amount || 99000,
              status: 'settlement',
              payment_method: body.data?.paymentMethod || 'va',
              paid_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            })
          })
          if (!payRes.ok) {
            console.error(`[Webhook] Failed to create payment row: ${await payRes.text()}`)
          }

          console.log(`[Webhook] Successfully updated and synced ${customerEmail} in database.`)
        } else {
          console.warn(`[Webhook] User with email ${customerEmail} not found in database.`)
        }
      }
    }

    return c.json({ received: true })
  } catch (err: any) {
    console.error('[Webhook] Error handling webhook:', err)
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
