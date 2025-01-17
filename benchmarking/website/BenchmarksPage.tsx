import { runBenchmark } from "benchmarking/benchmark-lib/run-benchmark"
import { BENCHMARKS } from "benchmarking/all-benchmarks"
import { RenderTimingsBar } from "./RenderTimingsBar"
import { useState } from "react"

export const BenchmarksPage = () => {
  const benchmarkNames = Object.keys(BENCHMARKS)
  const [benchmarkResults, setBenchmarkResults] = useState<
    Record<string, Record<string, number>>
  >({})
  const [isRunningAll, setIsRunningAll] = useState(false)

  const runSingleBenchmark = async (name: string) => {
    const result = await runBenchmark({
      Component: BENCHMARKS[name as keyof typeof BENCHMARKS],
    })
    setBenchmarkResults((prev) => ({
      ...prev,
      [name]: result,
    }))
  }

  const runAllBenchmarks = async () => {
    setIsRunningAll(true)
    for (const name of benchmarkNames) {
      await runSingleBenchmark(name)
    }
    setIsRunningAll(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Benchmarks</h1>
        <button
          onClick={runAllBenchmarks}
          disabled={isRunningAll}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          type="button"
        >
          {isRunningAll ? "Running..." : "Run All"}
        </button>
      </div>

      <div className="space-y-6">
        {benchmarkNames.map((benchmarkName) => (
          <div key={benchmarkName} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{benchmarkName}</h2>
              <button
                onClick={() => runSingleBenchmark(benchmarkName)}
                disabled={isRunningAll}
                className="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                type="button"
              >
                Run
              </button>
            </div>
            {benchmarkResults[benchmarkName] && (
              <RenderTimingsBar
                phaseTimings={benchmarkResults[benchmarkName]}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
