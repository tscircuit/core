import { fp } from "@tscircuit/footprinter"
// Fake server implementation for testing loadFootprintUrl
export class FakeFootprintServer {
  private requestCount = 0
  private shouldFailAfterFirst = false

  constructor(failAfterFirst = false) {
    this.shouldFailAfterFirst = failAfterFirst
  }

  getRequestCount() {
    return this.requestCount
  }

  async handleRequest(url: string): Promise<Response> {
    this.requestCount++

    if (this.shouldFailAfterFirst && this.requestCount > 1) {
      throw new Error(
        "Server is down - this should not be called if cache is working!",
      )
    }

    // Extract the URL path and generate circuit JSON using footprinter
    const urlPath = new URL(url).pathname

    return {
      ok: true,
      json: async () => fp.string(urlPath).circuitJson(),
    } as Response
  }
}
