import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface Session {
  id: string
  user_id: string
  token_hash: string
  refresh_token_hash?: string
  ip_address?: string
  user_agent?: string
  expires_at: number
  created_at: number
}

export interface CreateSessionInput {
  user_id: string
  token_hash: string
  refresh_token_hash?: string
  ip_address?: string
  user_agent?: string
  expires_at: number
}

export const sessionRepo = {
  create(input: CreateSessionInput): Session {
    const db = getDb()
    const id = genId()
    const now = Date.now()

    const session: Session = {
      id,
      user_id: input.user_id,
      token_hash: input.token_hash,
      refresh_token_hash: input.refresh_token_hash,
      ip_address: input.ip_address,
      user_agent: input.user_agent,
      expires_at: input.expires_at,
      created_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO sessions (
        id, user_id, token_hash, refresh_token_hash, ip_address,
        user_agent, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      session.id,
      session.user_id,
      session.token_hash,
      session.refresh_token_hash || null,
      session.ip_address || null,
      session.user_agent || null,
      session.expires_at,
      session.created_at
    )

    return session
  },

  findById(id: string): Session | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?')
    const row = stmt.get(id) as Session | undefined
    return row || null
  },

  findByTokenHash(token_hash: string): Session | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM sessions WHERE token_hash = ?')
    const row = stmt.get(token_hash) as Session | undefined
    return row || null
  },

  findByRefreshTokenHash(refresh_token_hash: string): Session | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM sessions WHERE refresh_token_hash = ?')
    const row = stmt.get(refresh_token_hash) as Session | undefined
    return row || null
  },

  findByUserId(user_id: string): Session[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT * FROM sessions
      WHERE user_id = ? AND expires_at > ?
      ORDER BY created_at DESC
    `)
    return stmt.all(user_id, Date.now()) as Session[]
  },

  updateTokenHash(id: string, token_hash: string, expires_at: number): boolean {
    const db = getDb()
    const stmt = db.prepare(`
      UPDATE sessions SET token_hash = ?, expires_at = ? WHERE id = ?
    `)
    const result = stmt.run(token_hash, expires_at, id)
    return result.changes > 0
  },

  delete(id: string): boolean {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  deleteByUserId(user_id: string): number {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?')
    const result = stmt.run(user_id)
    return result.changes
  },

  deleteExpired(): number {
    const db = getDb()
    const now = Date.now()
    const stmt = db.prepare('DELETE FROM sessions WHERE expires_at < ?')
    const result = stmt.run(now)
    return result.changes
  },

  isValid(session: Session): boolean {
    return session.expires_at > Date.now()
  }
}
