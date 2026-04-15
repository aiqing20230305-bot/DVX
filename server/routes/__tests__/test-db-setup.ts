import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { beforeAll, afterAll } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Setup isolated test database for API integration tests
 *
 * This creates a unique in-memory database for each test file,
 * preventing interference between parallel test executions.
 */
export function setupTestDatabase() {
  let testDb: Database.Database

  beforeAll(async () => {
    // Create isolated in-memory database
    testDb = new Database(':memory:')
    testDb.pragma('journal_mode = WAL')
    testDb.pragma('foreign_keys = ON')

    // Load schema
    const schemaPath = resolve(__dirname, '../../db/schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    testDb.exec(schema)

    // Set global test database BEFORE running migrations
    ;(global as any).__TEST_DB__ = testDb

    // Run migrations to create FTS5 tables and other features
    const { runMigrations } = await import('../../db/migrations.js')
    await runMigrations()

    console.log('[Test DB] Isolated test database initialized with migrations')
  })

  afterAll(() => {
    // Cleanup: close database and remove global reference
    if (testDb) {
      testDb.close()
      console.log('[Test DB] Isolated test database closed')
    }
    delete (global as any).__TEST_DB__
  })

  return () => testDb
}
