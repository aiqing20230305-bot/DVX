import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env file manually for ESM compatibility
try {
  const envPath = resolve(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
} catch {
  // .env file not found, rely on environment variables
}

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required environment variable: ${key}`)
  return val
}

// Support persistent storage for deployment platforms
const dataDir = process.env['DATA_DIR'] || process.cwd()

export const config = {
  anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
  anthropicBaseUrl: process.env['ANTHROPIC_BASE_URL'] || undefined,
  anthropicModel: process.env['ANTHROPIC_MODEL'] || 'claude-sonnet-4-5-20250929',
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  uploadsDir: resolve(dataDir, 'uploads'),
  kbDataDir: resolve(dataDir, 'kb-data'),
  dbPath: resolve(dataDir, 'data.db'),
}
