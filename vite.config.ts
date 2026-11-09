import fs from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

const usersFile = path.resolve(process.cwd(), 'public/DB/users.json')

interface UserRecord {
  id_user: string
  nombre: string
  email: string
  password: string
  emailVerified?: boolean
  [key: string]: unknown
}

const DEMO_VERIFICATION_CODE = '1234'

const usersApi = (): Plugin => {
  return {
    name: 'users-json-api',
    configureServer(server) {
      const readBody = (req: import('node:http').IncomingMessage) =>
        new Promise<unknown>((resolve, reject) => {
          let content = ''
          req.on('data', (chunk: Buffer) => {
            content += chunk.toString()
            if (content.length > 16_384) {
              reject(new Error('La solicitud es demasiado grande.'))
              req.destroy()
            }
          })
          req.on('end', () => {
            try {
              resolve(JSON.parse(content))
            } catch {
              reject(new Error('El cuerpo de la solicitud no es JSON válido.'))
            }
          })
          req.on('error', reject)
        })

      const respond = (res: import('node:http').ServerResponse, status: number, body: unknown) => {
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
      }

      server.middlewares.use('/api/users', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const newUser = await readBody(req) as UserRecord
          if (!newUser || typeof newUser.email !== 'string' || typeof newUser.nombre !== 'string' || typeof newUser.password !== 'string') {
            respond(res, 400, { error: 'Faltan datos obligatorios para crear la cuenta.' })
            return
          }

          const users = JSON.parse(await fs.readFile(usersFile, 'utf8')) as UserRecord[]
          const normalizedEmail = newUser.email.trim().toLowerCase()
          if (users.some((user) => user.email.trim().toLowerCase() === normalizedEmail)) {
            respond(res, 409, { error: 'Ya existe una cuenta con ese correo.' })
            return
          }

          users.push(newUser)
          await fs.writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`)
          respond(res, 201, { success: true })
        } catch (error) {
          console.error('Error al registrar la cuenta de demostración:', error)
          respond(res, 500, { error: 'No se pudo guardar la cuenta.' })
        }
      })

      server.middlewares.use('/api/verification/resend', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await readBody(req) as { email?: string }
          const email = body.email?.trim()
          if (!email || !email.includes('@')) {
            respond(res, 400, { error: 'Introduce un correo válido.' })
            return
          }

          const users = JSON.parse(await fs.readFile(usersFile, 'utf8')) as UserRecord[]
          const user = users.find((item) => item.email.trim().toLowerCase() === email.toLowerCase())
          if (!user || user.emailVerified !== false) {
            respond(res, 404, { error: 'No hay una cuenta pendiente de verificación con ese correo.' })
            return
          }

          respond(res, 200, { success: true, demoCode: DEMO_VERIFICATION_CODE })
        } catch (error) {
          console.error('Error al reenviar el código de demostración:', error)
          respond(res, 500, { error: 'No se pudo generar el código de demostración.' })
        }
      })

      server.middlewares.use('/api/verification/verify', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await readBody(req) as { email?: string; code?: string }
          const email = body.email?.trim().toLowerCase()
          const code = body.code?.trim()
          if (!email || !code || code !== DEMO_VERIFICATION_CODE) {
            respond(res, 400, { error: 'El código no es válido. En esta demo, el código es 1234.' })
            return
          }

          const users = JSON.parse(await fs.readFile(usersFile, 'utf8')) as UserRecord[]
          const user = users.find((item) => item.email.trim().toLowerCase() === email)
          if (!user) {
            respond(res, 404, { error: 'No se encontró la cuenta pendiente de verificación.' })
            return
          }
          user.emailVerified = true
          await fs.writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`)
          await fs.writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`)
          respond(res, 200, { success: true })
        } catch (error) {
          console.error('Error al verificar el código:', error)
          const message = error instanceof Error ? error.message : 'No se pudo verificar el código.'
          respond(res, 500, { error: message })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), usersApi()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
