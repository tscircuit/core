// Fake server implementation for testing loadFootprintUrl
export class FakeFootprintServer {
  private requestCount = 0
  private shouldFailAfterFirst = false
  private data: any

  constructor(data: any, failAfterFirst = false) {
    this.data = data
    this.shouldFailAfterFirst = failAfterFirst
  }

  getRequestCount() {
    return this.requestCount
  }

  async handleRequest(_url: string): Promise<Response> {
    this.requestCount++

    if (this.shouldFailAfterFirst && this.requestCount > 1) {
      throw new Error(
        "Server is down - this should not be called if cache is working!",
      )
    }

    return {
      ok: true,
      json: async () => this.data,
    } as Response
  }
}
