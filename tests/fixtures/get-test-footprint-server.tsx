import { serve } from "bun"
import { afterEach } from "bun:test"

export const getTestFootprintServer = (json: any) => {
  const server = serve({
    port: 0,
    fetch: () => {
      return new Response(JSON.stringify(json), {
        headers: { "Content-Type": "application/json" },
      })
    },
  })

  global.servers?.push({
    url: `http://localhost:${server.port}/`,
    close: () => server.stop(),
  })

  return {
    url: `http://localhost:${server.port}`,
    close: () => server.stop(),
  }
}
