import { expect, test } from "bun:test"
import { orderedRenderPhases } from "lib"
import { runBenchmark } from "../benchmark-lib/run-benchmark"
import { Benchmark3Rv1106g2CircuitJson } from "./benchmark3-rv1106g2-circuit-json"

test("RV1106G2 Circuit JSON benchmark records render phase timings", async () => {
  const phaseTimings = await runBenchmark({
    Component: Benchmark3Rv1106g2CircuitJson,
  })

  expect(Object.keys(phaseTimings)).toHaveLength(orderedRenderPhases.length)
  expect(phaseTimings.SchematicPortRender).toBeGreaterThan(0)
})
