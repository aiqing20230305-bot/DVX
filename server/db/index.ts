import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  // 测试环境：使用测试数据库
  if ((global as any).__TEST_DB__) {
    return (global as any).__TEST_DB__
  }

  // 生产环境：使用单例数据库
  if (!_db) {
    _db = new Database(config.dbPath)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')

    const schema = readFileSync(resolve(__dirname, 'schema.sql'), 'utf-8')
    _db.exec(schema)
  }
  return _db
}

export default getDb
