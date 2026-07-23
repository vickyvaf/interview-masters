import app from '../../src/index'
import { handle } from 'hono/netlify'

export const handler = handle(app)
