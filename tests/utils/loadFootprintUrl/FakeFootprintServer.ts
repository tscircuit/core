import { fp } from "@tscircuit/footprinter"

// Fake server implementation for testing loadFootprintUrl using Bun.serve
export class FakeFootprintServer {
  private requestCount = 0
  private shouldFailAfterFirstResponse = false
  private server: any
  private port: number

  constructor({
    failAfterFirstResponse,
  }: { failAfterFirstResponse?: boolean } = {}) {
    this.shouldFailAfterFirstResponse = failAfterFirstResponse ?? false
    this.port = Math.floor(Math.random() * 10000) + 30000 // Random port
  }

  getRequestCount() {
    return this.requestCount
  }

  getUrl() {
    return `http://localhost:${this.port}`
  }

  async start() {
    this.server = Bun.serve({
      port: this.port,
      fetch: (req) => {
        this.requestCount++

        if (this.shouldFailAfterFirstResponse && this.requestCount > 1) {
          return new Response(
            "Server is down - this should not be called if cache is working!",
            {
              status: 500,
            },
          )
        }

        // Extract footprint name from URL path, removing .json if present
        const url = new URL(req.url)
        const footprintName = url.pathname.substring(1).replace(".json", "") // Remove leading '/' and .json

        // Return footprint data for the requested footprint
        return new Response(
          JSON.stringify(fp.string(footprintName).circuitJson()),
          {
            headers: {
              "Content-Type": "application/json",
              "X-Footprint": footprintName, // For debugging
            },
          },
        )
      },
    })

    // Wait a bit for the server to start
    await new Promise((resolve) => setTimeout(resolve, 10))
    return this.server
  }

  async stop() {
    if (this.server) {
      this.server.stop()
      this.server = null
    }
  }
}
