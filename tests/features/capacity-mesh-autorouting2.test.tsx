import { test, expect, describe } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Benchmark1LedMatrix } from "benchmarking/benchmarks/benchmark1-led-matrix"
import * as fs from "node:fs"

test("capacity mesh autorouting 2 - benchmark led matrix", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with two components that need to be connected by a trace
  // The capacity mesh autorouter will be used to find the optimal route
  circuit.add(
    <Benchmark1LedMatrix
      // autorouter="auto-local"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
    />,
  )

  circuit.on("autorouting:start", (event) => {
    // console.log("autorouting:start", event)
    fs.writeFileSync(
      "./autorouting-start.json",
      JSON.stringify(event.simpleRouteJson, null, 2),
    )
  })

  // Wait for the render to complete, including autorouting
  await circuit.renderUntilSettled()

  // Verify that we have PCB traces in the output
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBeGreaterThan(0)

  // Match against a PCB snapshot to verify routing
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
