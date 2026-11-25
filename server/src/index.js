import { config } from './config.js'
import { migrate, openDatabase } from './db.js'
import { bootstrapAdmin, createApp } from './app.js'

const db = openDatabase()
const applied = migrate(db)
if (applied.length) console.log(`Migrations applied: ${applied.join(', ')}`)
if (bootstrapAdmin(db)) console.log(`Super admin ready: ${config.bootstrapAdmin.email}`)

const app = createApp(db)
const server = app.listen(config.port, () => {
  console.log(`Championship API listening on http://localhost:${config.port}/api`)
})

function shutdown() {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
