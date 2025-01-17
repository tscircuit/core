import { runBenchmark } from "benchmarking/benchmark-lib/run-benchmark"
import { BENCHMARKS } from "benchmarking/all-benchmarks"
import { RenderTimingsBar } from "./RenderTimingsBar"
import { useState, useEffect } from "react"

const STORAGE_KEY = "benchmark_history"

interface HistoryDataPoint {
  timestamp: number
  totalTime: number
}

export const BenchmarksPage = () => {
  const benchmarkNames = Object.keys(BENCHMARKS)
  const [benchmarkResults, setBenchmarkResults] = useState<
    Record<string, Record<string, number>>
  >({})
  const [isRunningAll, setIsRunningAll] = useState(false)
  const [history, setHistory] = useState<HistoryDataPoint[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setHistory(JSON.parse(stored))
    }
  }, [])

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

    // Calculate total execution time across all benchmarks
    const totalExecutionTime = Object.values(benchmarkResults).reduce(
      (sum, benchmarkResult) =>
        sum + Object.values(benchmarkResult).reduce((a, b) => a + b, 0),
      0,
    )

    // Record new history point
    const newPoint = {
      timestamp: Date.now(),
      totalTime: totalExecutionTime,
    }

    const newHistory = [...history, newPoint]
    setHistory(newHistory)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))

    setIsRunningAll(false)
  }

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY)
    setHistory([])
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">@tscircuit/core Benchmark</h1>
        <div className="space-x-4">
          <button
            onClick={runAllBenchmarks}
            disabled={isRunningAll}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            type="button"
          >
            {isRunningAll ? "Running..." : "Run All"}
          </button>
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            type="button"
          >
            Clear Recorded Runs
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Historical Performance</h2>
          <div className="h-64 relative">
            <div className="absolute left-0 h-full flex flex-col justify-between text-sm text-gray-500">
              <span>
                {Math.max(...history.map((h) => h.totalTime)).toFixed(0)}ms
              </span>
              <span>0ms</span>
            </div>
            <div className="ml-8 h-full relative">
              <svg
                className="absolute w-full h-full"
                aria-label="Performance history graph"
              >
                {history.map((point, i) => {
                  const maxTime = Math.max(...history.map((h) => h.totalTime))
                  const x = (i / (history.length - 1)) * 100
                  const y = (point.totalTime / maxTime) * 100

                  return i < history.length - 1 ? (
                    <line
                      key={`line-${point.timestamp}`}
                      x1={`${x}%`}
                      y1={`${y}%`}
                      x2={`${((i + 1) / (history.length - 1)) * 100}%`}
                      y2={`${(history[i + 1].totalTime / maxTime) * 100}%`}
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />
                  ) : null
                })}
              </svg>
              {history.map((point, i) => {
                const maxTime = Math.max(...history.map((h) => h.totalTime))
                const x = (i / (history.length - 1)) * 100
                const y = (point.totalTime / maxTime) * 100
                return (
                  <div
                    key={point.timestamp}
                    className="absolute w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1 hover:w-3 hover:h-3 transition-all"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    title={`Time: ${point.totalTime.toFixed(2)}ms\nDate: ${new Date(point.timestamp).toLocaleString()}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

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
