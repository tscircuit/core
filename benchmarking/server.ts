export const BENCHMARKS = {
  "benchmark1-led-matrix": await import(
    "./benchmarks/benchmark1-led-matrix.tsx"
  ),
}

export const startServer = () => {
  Bun.serve({
    port: 3991,
    fetch(req) {
      return new Response("Hello World")
    },
  })
}
