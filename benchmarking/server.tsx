import { BENCHMARKS } from "./all-benchmarks.tsx";
import { runBenchmark } from "./benchmark-lib/run-benchmark.tsx";

Bun.serve({
  port: 3991,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    const BenchmarkComponent =
      BENCHMARKS[pathname.replace("/", "") as keyof typeof BENCHMARKS];
    if (!BenchmarkComponent) {
      return new Response("Benchmark not found", { status: 404 });
    }
    const result = await runBenchmark({ Component: BenchmarkComponent });
    return new Response(JSON.stringify(result));
  },
});

console.log("Server started on port http://localhost:3991");
