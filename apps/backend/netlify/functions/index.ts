import app from '../../src/index.js'
import { handle } from 'hono/netlify'

export const handler = handle(app)
