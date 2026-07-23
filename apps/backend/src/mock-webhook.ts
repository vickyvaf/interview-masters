import dotenv from 'dotenv'
import path from 'path'

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') })

const email = process.argv[2]
if (!email) {
  console.error('Error: Please provide an email address. Example: pnpm --filter apps-backend tsx src/mock-webhook.ts user@example.com')
  process.exit(1)
}

const token = process.env.MAYAR_WEBHOOK_TOKEN || ''
const planType = process.argv[3] || 'pro'
let amount = 49000
if (planType === 'starter') amount = 19000
else if (planType === 'sprint') amount = 99000

const payload = {
  event: 'payment.received',
  data: {
    id: 'mock-tx-' + Date.now(),
    status: 'paid',
    amount: amount,
    customer: {
      name: 'Mock Candidate',
      email: email
    },
    paymentMethod: 'QRIS'
  }
}

const rawBody = JSON.stringify(payload)
console.log(`Sending mock Mayar webhook for ${email}...`)

fetch('http://localhost:5005/webhook/mayar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-mayar-token': token
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
