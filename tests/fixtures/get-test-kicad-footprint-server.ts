import { serve } from "bun"
import { afterEach } from "bun:test"
import kicad0402Footprint from "tests/fixtures/assets/kicad-0402-footprint.json"

export const getTestKicadFootprintServer = () => {
  const server = serve({
    port: 0,
    fetch: async (req) => {
      const { pathname } = new URL(req.url)

      if (!pathname.endsWith(".circuit.json")) {
        return new Response("Not found", { status: 404 })
      }

      return new Response(JSON.stringify(kicad0402Footprint), {
        headers: { "Content-Type": "application/json" },
      })
    },
  })

  afterEach(() => {
    server.stop()
  })

  return {
    kicadFootprintServerUrl: `http://localhost:${server.port}/`,
    close: () => server.stop(),
  }
}
