import dotenv from 'dotenv'
import path from 'path'
import { createHmac } from 'crypto'

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') })

const email = process.argv[2]
if (!email) {
  console.error('Error: Please provide an email address. Example: pnpm --filter apps-backend tsx src/mock-webhook.ts user@example.com')
  process.exit(1)
}

const secret = process.env.MAYAR_WEBHOOK_SECRET || ''
if (!secret) {
  console.error('Error: MAYAR_WEBHOOK_SECRET is not configured in .env.local')
  process.exit(1)
}

const payload = {
  event: 'payment.success',
  data: {
    id: 'mock-inv-' + Date.now(),
    customerEmail: email,
    customerName: 'Mock Candidate',
    customerMobile: '08123456789',
    amount: 99000,
    paymentMethod: 'qris'
  }
}

const rawBody = JSON.stringify(payload)
const signature = createHmac('sha256', secret)
  .update(rawBody)
  .digest('hex')

console.log(`Sending mock webhook for ${email}...`)
console.log(`Signature: ${signature}`)

fetch('http://localhost:5005/webhook/mayar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-mayar-signature': signature
  },
  body: rawBody
})
  .then(async (res) => {
    console.log(`Response Status: ${res.status}`)
    console.log('Response Body:', await res.json())
  })
  .catch((err) => {
    console.error('Error sending request:', err)
  })
