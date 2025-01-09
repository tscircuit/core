export const handleBenchmarkFileRequest = (req: Request) => {
  const benchmarkName = req.url.split("/").pop()
  const benchmark = BENCHMARKS[benchmarkName]
  return new Response(benchmark.default.toString())
}
