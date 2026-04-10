import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  email_verified: number
  last_login_at?: number
  created_at: number
  updated_at: number
}

export interface PublicUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  email_verified: number
  last_login_at?: number
  created_at: number
  updated_at: number
}

export interface CreateUserInput {
  email: string
  password_hash: string
  name: string
  avatar?: string
  role?: 'admin' | 'user'
}

export interface UpdateUserInput {
  name?: string
  avatar?: string
  email_verified?: number
  last_login_at?: number
  status?: 'active' | 'inactive' | 'suspended'
}

export const userRepo = {
  create(input: CreateUserInput): User {
    const db = getDb()
    const id = genId()
    const now = Date.now()

    const user: User = {
      id,
      email: input.email,
      password_hash: input.password_hash,
      name: input.name,
      avatar: input.avatar,
      role: input.role || 'user',
      status: 'active',
      email_verified: 0,
      created_at: now,
      updated_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO users (
        id, email, password_hash, name, avatar, role, status,
        email_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      user.id,
      user.email,
      user.password_hash,
      user.name,
      user.avatar || null,
      user.role,
      user.status,
      user.email_verified,
      user.created_at,
      user.updated_at
    )

    return user
  },

  findById(id: string): User | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const row = stmt.get(id) as User | undefined
    return row || null
  },

  findByEmail(email: string): User | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
    const row = stmt.get(email) as User | undefined
    return row || null
  },

  findAll(options?: { status?: 'active' | 'inactive' | 'suspended' }): User[] {
    const db = getDb()
    let query = 'SELECT * FROM users'
    const params: any[] = []

    if (options?.status) {
      query += ' WHERE status = ?'
      params.push(options.status)
    }

    query += ' ORDER BY created_at DESC'

    const stmt = db.prepare(query)
    return stmt.all(...params) as User[]
  },

  update(id: string, input: UpdateUserInput): User | null {
    const db = getDb()
    const existing = this.findById(id)
    if (!existing) return null

    const updates: string[] = []
    const params: any[] = []

    if (input.name !== undefined) {
      updates.push('name = ?')
      params.push(input.name)
    }
    if (input.avatar !== undefined) {
      updates.push('avatar = ?')
      params.push(input.avatar || null)
    }
    if (input.email_verified !== undefined) {
      updates.push('email_verified = ?')
      params.push(input.email_verified)
    }
    if (input.last_login_at !== undefined) {
      updates.push('last_login_at = ?')
      params.push(input.last_login_at)
    }
    if (input.status !== undefined) {
      updates.push('status = ?')
      params.push(input.status)
    }

    updates.push('updated_at = ?')
    params.push(Date.now())

    params.push(id)

    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    stmt.run(...params)

    return this.findById(id)
  },

  updatePassword(id: string, password_hash: string): boolean {
    const db = getDb()
    const stmt = db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?
    `)
    const result = stmt.run(password_hash, Date.now(), id)
    return result.changes > 0
  },

  delete(id: string): boolean {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  // Remove password_hash from user object (for API responses)
  toPublicUser(user: User): PublicUser {
    const { password_hash, ...publicUser } = user
    return publicUser
  }
}
