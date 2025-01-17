import { runBenchmark } from "./benchmark-lib/run-benchmark.tsx"
import { renderToString } from "react-dom/server"

import { Benchmark1LedMatrix } from "./benchmarks/benchmark1-led-matrix.tsx"

export const BENCHMARKS = {
  "benchmark1-led-matrix": Benchmark1LedMatrix,
}

Bun.serve({
  port: 3991,
  async fetch(req) {
    const url = new URL(req.url)
    const pathname = url.pathname

    if (pathname === "/") {
      const html = renderToString(<BenchmarksPage />)
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      })
    }

    const BenchmarkComponent =
      BENCHMARKS[pathname.replace("/", "") as keyof typeof BENCHMARKS]
    if (!BenchmarkComponent) {
      return new Response("Benchmark not found", { status: 404 })
    }
    const result = await runBenchmark({ Component: BenchmarkComponent })
    return new Response(JSON.stringify(result))
  },
})

console.log("Server started on port http://localhost:3991")
