import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config()
const isProd = process.env.NODE_ENV === 'production'
dotenv.config({ path: path.resolve(process.cwd(), isProd ? '../../.env.production' : '../../.env.local') })

const app = new Hono()
app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'healthy' }))

// Create DOKU Payment Link Checkout Session
app.post('/payments/create-checkout', async (c) => {
  try {
    const { email, name, plan } = await c.req.json()
    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID
    const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY
    if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
      return c.json({ error: 'DOKU credentials are not configured on server' }, 500)
    }

    const isProduction = process.env.DOKU_IS_PRODUCTION === 'true'
    const dokuDomain = isProduction ? 'https://api.doku.com' : 'https://api-sandbox.doku.com'

    let amount = 49000
    let description = 'Pro Subscription - Interview Masters'
    if (plan === 'starter') {
      amount = 19000
      description = 'Starter Pass - Interview Masters'
    } else if (plan === 'sprint') {
      amount = 99000
      description = '14-Day Sprint - Interview Masters'
    }

    const invoiceNumber = `INV-${Date.now()}`
    const callbackUrl = `${process.env.PUBLIC_DASHBOARD_URL || 'http://localhost:5173'}/billing?payment=success`

    const body = {
      order: {
        amount,
        invoice_number: invoiceNumber,
        currency: 'IDR',
        callback_url: callbackUrl,
        line_items: [
          {
            name: description,
            price: amount,
            quantity: 1
          }
        ]
      },
      payment: {
        payment_due_date: 60
      },
      customer: {
        name: name || 'Candidate',
        email: email
      }
    }

    const { createHash, createHmac } = await import('crypto')
    const rawBody = JSON.stringify(body)
    const digest = createHash('sha256').update(rawBody).digest('base64')

    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const formattedTimestamp = new Date().toISOString().replace(/\.\d{3}/, '')
    const targetPath = '/checkout/v1/payment'

    const stringToSign = 
      `Client-Id:${DOKU_CLIENT_ID}\n` +
      `Request-Id:${requestId}\n` +
      `Request-Timestamp:${formattedTimestamp}\n` +
      `Request-Target:${targetPath}\n` +
      `Digest:${digest}`

    const calculatedHmac = createHmac('sha256', DOKU_SECRET_KEY)
      .update(stringToSign)
      .digest('base64')

    const signature = `HMACSHA256=${calculatedHmac}`

    const response = await fetch(`${dokuDomain}${targetPath}`, {
      method: 'POST',
      headers: {
        'Client-Id': DOKU_CLIENT_ID,
        'Request-Id': requestId,
        'Request-Timestamp': formattedTimestamp,
        'Signature': signature,
        'Content-Type': 'application/json'
      },
      body: rawBody
    })

    const data: any = await response.json()
    const url = data.response?.payment?.url || data.payment?.url
    if (url) {
      return c.json({ checkoutUrl: url })
    } else {
      console.error('DOKU Error response:', data)
      const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || JSON.stringify(data))
      return c.json({ error: errorMsg }, 500)
    }
  } catch (err: any) {
    console.error('Checkout error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// DOKU Webhook Signature Validation & Database Update
app.post('/webhook/doku', async (c) => {
  try {
    const signatureHeader = c.req.header('signature')
    const clientIdHeader = c.req.header('client-id')
    const requestIdHeader = c.req.header('request-id')
    const timestampHeader = c.req.header('request-timestamp')
    const rawBody = await c.req.text()

    if (!signatureHeader || !clientIdHeader || !requestIdHeader || !timestampHeader) {
      console.error('[Webhook] Missing required DOKU headers')
      return c.json({ error: 'Missing headers' }, 400)
    }

    const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY
    if (!DOKU_SECRET_KEY) {
      console.error('[Webhook] DOKU_SECRET_KEY is not configured on server')
      return c.json({ error: 'Server configuration error' }, 500)
    }

    const { createHash, createHmac } = await import('crypto')
    const digest = createHash('sha256').update(rawBody).digest('base64')
    const targetPath = '/webhook/doku'

    const stringToSign = 
      `Client-Id:${clientIdHeader}\n` +
      `Request-Id:${requestIdHeader}\n` +
      `Request-Timestamp:${timestampHeader}\n` +
      `Request-Target:${targetPath}\n` +
      `Digest:${digest}`

    const computedSignature = `HMACSHA256=${createHmac('sha256', DOKU_SECRET_KEY)
      .update(stringToSign)
      .digest('base64')}`

    if (signatureHeader !== computedSignature) {
      console.error('[Webhook] Invalid webhook signature. Received:', signatureHeader, 'Computed:', computedSignature)
      return c.json({ error: 'Invalid signature' }, 401)
    }

    const body = JSON.parse(rawBody)
    console.log('[Webhook] Received validated DOKU notification:', body)

    const transactionStatus = body.payment?.transaction_status
    if (transactionStatus === 'SUCCESS' || transactionStatus === 'SETTLEMENT') {
      const customerEmail = body.customer?.email
      if (customerEmail) {
        const paymentAmount = Number(body.order?.amount) || 49000
        const determinedTier = paymentAmount === 19000 ? 'starter' : paymentAmount === 99000 ? 'sprint' : 'pro'
        console.log(`[Webhook] Upgrading user with email: ${customerEmail} to ${determinedTier.toUpperCase()} tier.`)
        
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
          // 2. Update user tier
          const updateRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tier: determinedTier,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
          })
          if (!updateRes.ok) {
            console.error(`[Webhook] Failed to update user tier: ${await updateRes.text()}`)
          }

          // 2.5. Deactivate any previous active subscriptions for this user
          const deactivateRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user.id}&status=eq.active`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'canceled',
              updated_at: new Date().toISOString()
            })
          })
          if (!deactivateRes.ok) {
            console.warn(`[Webhook] Failed to deactivate old subscriptions: ${await deactivateRes.text()}`)
          }

          // 3. Insert or update subscriptions table
          const periodEnd = determinedTier === 'sprint'
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()

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
              tier: determinedTier,
              status: 'active',
              price: paymentAmount,
              billing_cycle: determinedTier === 'sprint' ? 'one-time' : 'monthly',
              current_period_start: new Date().toISOString(),
              current_period_end: periodEnd,
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
              invoice_id: body.order?.invoice_number || 'INV-' + Date.now(),
              payment_gateway: 'doku',
              transaction_id: body.payment?.transaction_id || body.order?.invoice_number || 'TX-' + Date.now(),
              amount: body.order?.amount || 99000,
              status: 'settlement',
              payment_method: body.payment?.payment_channel || 'va',
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

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SECRET_KEY || ''

async function supabaseRequest(path: string, method: 'GET' | 'POST' | 'PATCH', body?: any) {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] Missing credentials for request:', path)
    return null
  }
  try {
    const headers: any = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
    if (method === 'POST') {
      headers['Prefer'] = 'return=representation'
    }
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
    if (!response.ok) {
      console.error(`Supabase error on ${method} ${path}:`, await response.text())
      return null
    }
    return await response.json()
  } catch (err) {
    console.error(`Supabase request exception on ${method} ${path}:`, err)
    return null
  }
}

async function generateEvaluation(questionText: string, answerText: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    return {
      overall_score: 80,
      structure_score: 80,
      relevance_score: 80,
      brevity_score: 80,
      feedback_text: 'Bagus, pertahankan.',
      highlights_rambling: null,
      what_you_could_have_said: 'Saya memiliki pengalaman...'
    }
  }

  const prompt = `Anda adalah penilai simulasi wawancara kerja yang profesional. Evaluasi jawaban kandidat terhadap pertanyaan berikut.

Pertanyaan: "${questionText}"
Jawaban: "${answerText}"

Berikan penilaian dalam format JSON dengan kunci berikut (pastikan hanya mengembalikan JSON valid tanpa format markdown atau penjelasan lain):
{
  "overall_score": (angka antara 0 dan 100),
  "structure_score": (angka antara 0 dan 100),
  "relevance_score": (angka antara 0 dan 100),
  "brevity_score": (angka antara 0 dan 100),
  "feedback_text": "(penjelasan evaluasi terperinci dalam Bahasa Indonesia)",
  "highlights_rambling": "(kutipan bagian jawaban yang bertele-tele atau null jika tidak ada)",
  "what_you_could_have_said": "(saran jawaban alternatif yang lebih baik)"
}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    })

    if (response.ok) {
      const resData: any = await response.json()
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        return JSON.parse(text)
      }
    }
  } catch (err) {
    console.error('Error generating evaluation:', err)
  }

  return {
    overall_score: 70,
    structure_score: 70,
    relevance_score: 70,
    brevity_score: 70,
    feedback_text: 'Evaluasi tidak dapat dihasilkan secara otomatis.',
    highlights_rambling: null,
    what_you_could_have_said: 'Coba berikan jawaban yang lebih terstruktur menggunakan metode STAR.'
  }
}

// --- INTERVIEW REST ENDPOINTS ---

// 1. Start Interview Session
app.post('/api/interview/start', async (c) => {
  try {
    const { userId, role = 'General', jobDescription = '', preConfidence = 3 } = await c.req.json()
    if (!userId) {
      return c.json({ error: 'userId is required' }, 400)
    }

    let mockInterviewId: string | null = null
    let initialQuestionId: string | null = null
    const greetingText = `Halo. Saya adalah pewawancara AI Anda hari ini. Selamat datang di simulasi wawancara untuk posisi ${role}. Mari kita mulai. Silakan perkenalkan diri Anda terlebih dahulu.`

    const interviewRes = await supabaseRequest('mock_interviews', 'POST', {
      user_id: userId,
      target_role: role,
      job_description: jobDescription,
      pre_confidence_score: Number(preConfidence),
      status: 'started'
    })

    if (interviewRes && interviewRes.length > 0) {
      mockInterviewId = interviewRes[0].id

      const questionRes = await supabaseRequest('interview_questions', 'POST', {
        mock_interview_id: mockInterviewId,
        question_text: greetingText,
        sequence_number: 1
      })
      if (questionRes && questionRes.length > 0) {
        initialQuestionId = questionRes[0].id
      }
    }

    return c.json({
      mockInterviewId,
      initialQuestionId,
      initialQuestionText: greetingText,
      systemLanguage: SYSTEM_LANGUAGE
    })
  } catch (err: any) {
    console.error('[API /interview/start] Error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// 2. Process Answer & Get Next Question
app.post('/api/interview/answer', async (c) => {
  try {
    const {
      mockInterviewId,
      questionId,
      questionText,
      answerText,
      history = [],
      sequenceNumber = 2
    } = await c.req.json()

    if (!answerText) {
      return c.json({ error: 'answerText is required' }, 400)
    }

    // Save candidate's answer and trigger AI evaluation in background
    if (questionId) {
      supabaseRequest('interview_answers', 'POST', {
        interview_question_id: questionId,
        answer_text: answerText,
        response_mode: 'voice'
      }).then(async (answerRes) => {
        if (answerRes && answerRes.length > 0) {
          const answerId = answerRes[0].id
          const evaluation = await generateEvaluation(questionText || '', answerText)
          if (evaluation) {
            await supabaseRequest('ai_feedbacks', 'POST', {
              interview_answer_id: answerId,
              structure_score: evaluation.structure_score || 70,
              relevance_score: evaluation.relevance_score || 70,
              brevity_score: evaluation.brevity_score || 70,
              overall_score: evaluation.overall_score || 70,
              feedback_text: evaluation.feedback_text || 'Bagus.',
              highlights_rambling: evaluation.highlights_rambling,
              what_you_could_have_said: evaluation.what_you_could_have_said || ''
            })
          }
        }
      }).catch(err => console.error('[API /interview/answer] Error saving evaluation:', err))
    }

    // Generate Next AI Question via Gemini
    const assistantText = await generateGeminiResponse(answerText, history)

    // Save next question to database
    let nextQuestionId: string | null = null
    if (mockInterviewId) {
      const questionRes = await supabaseRequest('interview_questions', 'POST', {
        mock_interview_id: mockInterviewId,
        question_text: assistantText,
        sequence_number: sequenceNumber
      })
      if (questionRes && questionRes.length > 0) {
        nextQuestionId = questionRes[0].id
      }
    }

    return c.json({
      assistantText,
      nextQuestionId
    })
  } catch (err: any) {
    console.error('[API /interview/answer] Error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// 3. Finish Interview Session
app.post('/api/interview/finish', async (c) => {
  try {
    const { mockInterviewId, status = 'completed', scores = [] } = await c.req.json()

    if (!mockInterviewId) {
      return c.json({ error: 'mockInterviewId is required' }, 400)
    }

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : null

    await supabaseRequest(`mock_interviews?id=eq.${mockInterviewId}`, 'PATCH', {
      status,
      overall_score: avgScore,
      completed_at: new Date().toISOString()
    })

    return c.json({ success: true })
  } catch (err: any) {
    console.error('[API /interview/finish] Error:', err)
    return c.json({ error: err.message }, 500)
  }
})

const port = Number(process.env.PORT) || 5005
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`[Backend] Server running on http://localhost:${info.port}`)
})

export default app

