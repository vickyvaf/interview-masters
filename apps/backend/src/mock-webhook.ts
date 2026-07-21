import dotenv from 'dotenv'
import path from 'path'
import { createHash, createHmac } from 'crypto'

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') })

const email = process.argv[2]
if (!email) {
  console.error('Error: Please provide an email address. Example: pnpm --filter apps-backend tsx src/mock-webhook.ts user@example.com')
  process.exit(1)
}

const secret = process.env.DOKU_SECRET_KEY || ''
const clientId = process.env.DOKU_CLIENT_ID || 'dummy_client_id'
if (!secret) {
  console.error('Error: DOKU_SECRET_KEY is not configured in .env.local')
  process.exit(1)
}

const planType = process.argv[3] || 'pro'
const amount = planType === 'sprint' ? 390000 : 99000

const payload = {
  order: {
    invoice_number: 'mock-inv-' + Date.now(),
    amount: amount
  },
  payment: {
    payment_channel: 'QRIS',
    payment_code: 'mock-code-123',
    payment_date: new Date().toISOString(),
    transaction_status: 'SUCCESS',
    transaction_id: 'mock-tx-' + Date.now()
  },
  customer: {
    name: 'Mock Candidate',
    email: email
  }
}

const rawBody = JSON.stringify(payload)
const digest = createHash('sha256').update(rawBody).digest('base64')

const requestId = `REQ-MOCK-${Date.now()}`
const formattedTimestamp = new Date().toISOString().replace(/\.\d{3}/, '')
const targetPath = '/webhook/doku'

const stringToSign = 
  `Client-Id:${clientId}\n` +
  `Request-Id:${requestId}\n` +
  `Request-Timestamp:${formattedTimestamp}\n` +
  `Request-Target:${targetPath}\n` +
  `Digest:${digest}`

const signature = `HMACSHA256=${createHmac('sha256', secret)
  .update(stringToSign)
  .digest('base64')}`

console.log(`Sending mock DOKU webhook for ${email}...`)
console.log(`Signature: ${signature}`)

fetch('http://localhost:5005/webhook/doku', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'signature': signature,
    'client-id': clientId,
    'request-id': requestId,
    'request-timestamp': formattedTimestamp
  },
  body: rawBody
})
  .then(async (res) => {
    console.log(`Response Status: ${res.status}`)
    try {
      console.log('Response Body:', await res.json())
    } catch {
      console.log('Response is not JSON')
    }
  })
  .catch((err) => {
    console.error('Error sending request:', err)
  })
