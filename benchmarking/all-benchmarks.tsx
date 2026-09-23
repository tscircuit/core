import { Benchmark3ImportedNetResolution } from "./benchmarks/benchmark3-imported-net-resolution"
import { Benchmark1LedMatrix } from "./benchmarks/benchmark1-led-matrix.tsx"
import { Benchmark2Rp2040DecouplingCapacitors } from "./benchmarks/benchmark2-rp2040-decoupling-capacitors.tsx"

export const BENCHMARKS = {
  "benchmark3-imported-net-resolution": Benchmark3ImportedNetResolution,
  "benchmark1-led-matrix": Benchmark1LedMatrix,
  "benchmark2-rp2040-decoupling-capacitors":
    Benchmark2Rp2040DecouplingCapacitors,
}
