import { migrate, openDatabase } from './db.js'

const db = openDatabase()
const applied = migrate(db)
console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.')
db.close()
