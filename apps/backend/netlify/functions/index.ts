import app from '../../src/index'

export const handler = async (event: any, context: any) => {
  // Netlify Functions V2 (Web Request)
  if (typeof Request !== 'undefined' && event instanceof Request) {
    return app.fetch(event, { context })
  }

  // Netlify Functions V1 (AWS Lambda Event)
  const host = event.headers?.host || event.headers?.Host || 'backend-interviewmasters.netlify.app'
  const proto = event.headers?.['x-forwarded-proto'] || 'https'
  const rawUrl = event.rawUrl || `${proto}://${host}${event.path || '/'}${event.rawQuery ? '?' + event.rawQuery : ''}`
  
  const headers = new Headers()
  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      if (value) headers.append(key, value as string)
    }
  }

  const method = event.httpMethod || 'GET'
  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : (event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : event.body)

  const req = new Request(rawUrl, {
    method,
    headers,
    body
  })

  const res = await app.fetch(req, { context })

  const resHeaders: Record<string, string> = {}
  res.headers.forEach((val, key) => {
    resHeaders[key] = val
  })

  const resBody = await res.text()

  return {
    statusCode: res.status,
    headers: resHeaders,
    body: resBody
  }
}
