import fs from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

const usersFile = path.resolve(process.cwd(), 'public/DB/users.json')

const usersApi = (): Plugin => ({
  name: 'users-json-api',
  configureServer(server) {
    server.middlewares.use('/api/users', async (req, res, next) => {
      if (req.method !== 'POST') {
        next()
        return
      }

      try {
        const body = await new Promise<string>((resolve, reject) => {
          let content = ''
          req.on('data', (chunk: Buffer) => { content += chunk.toString() })
          req.on('end', () => resolve(content))
          req.on('error', reject)
        })
        const newUser = JSON.parse(body)
        const users = JSON.parse(await fs.readFile(usersFile, 'utf8'))
        users.push(newUser)
        await fs.writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`)
        res.statusCode = 201
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(newUser))
      } catch {
        res.statusCode = 400
        res.end('No se pudo guardar el usuario')
      }
    })
  }
})

export default defineConfig({
  plugins: [react(), usersApi()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
