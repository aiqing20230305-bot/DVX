import { Response } from 'express'

export function initSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()
}

export function sendSSEEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export function closeSSE(res: Response) {
  res.write('event: done\ndata: {}\n\n')
  res.end()
}
