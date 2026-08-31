import { defineConfig } from 'vite'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const customersFile = resolve('data/customers.json')

function customerFileApi() {
  return {
    name: 'customer-file-api',
    configureServer(server) {
      server.middlewares.use('/api/customers', async (request, response, next) => {
        response.setHeader('Content-Type', 'application/json')

        if (request.method === 'GET') {
          try {
            response.end(await readFile(customersFile, 'utf8'))
          } catch (error) {
            if (error.code === 'ENOENT') return response.end('null')
            next(error)
          }
          return
        }

        if (request.method === 'PUT') {
          try {
            const chunks = []
            for await (const chunk of request) chunks.push(chunk)
            const customers = JSON.parse(Buffer.concat(chunks).toString())
            if (!Array.isArray(customers)) throw new Error('Customer data must be an array')

            await mkdir(dirname(customersFile), { recursive: true })
            const temporaryFile = `${customersFile}.tmp`
            await writeFile(temporaryFile, `${JSON.stringify(customers, null, 2)}\n`)
            await rename(temporaryFile, customersFile)
            response.end('{"saved":true}')
          } catch (error) {
            response.statusCode = 400
            response.end(JSON.stringify({ error: error.message }))
          }
          return
        }

        response.statusCode = 405
        response.end('{"error":"Method not allowed"}')
      })
    },
  }
}

export default defineConfig({
  base: '/BankDemo/',
  plugins: [customerFileApi()],
})