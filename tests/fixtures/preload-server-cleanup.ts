import { afterEach } from "bun:test"

declare global {
  var servers: { url: string; close: () => void }[] | undefined
}

if (!global.servers) {
  global.servers = []
}

afterEach(() => {
  if (!global.servers) return
  for (const server of global.servers) {
    server.close()
  }
  global.servers = []
})
