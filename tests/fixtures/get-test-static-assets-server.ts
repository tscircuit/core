import { serve } from "bun"
import { afterEach } from "bun:test"
import { join } from "path"

export const getTestStaticAssetsServer = () => {
  const root = join(import.meta.dir, "assets")
  const server = serve({
    port: 0,
    fetch: async (req) => {
      const url = new URL(req.url)
      const filePath = join(root, url.pathname.replace(/^\//, ""))
      try {
        const file = Bun.file(filePath)
        if (!(await file.exists())) {
          return new Response("Not found", { status: 404 })
        }
        return new Response(file, {
          headers: { "Content-Type": "application/octet-stream" },
        })
      } catch (err) {
        return new Response("Not found", { status: 404 })
      }
    },
  })

  afterEach(() => {
    server.stop()
  })

  return { url: `http://localhost:${server.port}`, close: () => server.stop() }
}
