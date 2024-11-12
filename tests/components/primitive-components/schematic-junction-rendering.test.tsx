import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic junction rendering with multiple connections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        schX={0}
        schY={0}
        footprint="soic4"
        pinLabels={{
          pin1: "IN1",
          pin2: "IN2",
          pin3: "OUT1",
          pin4: "OUT2",
        }}
      />

      {/* Left side resistors */}
      <resistor name="R2" resistance="10k" schX={-3} schY={-0.5} />
      <resistor name="R3" resistance="10k" schX={-3} schY={0.5} />

      {/* Connect resistors to chip pins */}
      <trace from=".R2 > .pin2" to=".U1 > .IN1" />
      <trace from=".R3 > .pin2" to=".U1 > .IN2" />
    </board>,
  )

  circuit.render()

  // // Get all schematic traces
  // const traces = circuit.db.schematic_trace.list()

  // // Get all junctions from traces
  // const junctions = traces.flatMap((trace) => trace.junctions || [])

  // // There should be junctions where traces intersect
  // expect(junctions.length).toBeGreaterThan(0)

  // // Each junction should have x,y coordinates
  // for (const junction of junctions) {
  //   expect(junction).toHaveProperty("x")
  //   expect(junction).toHaveProperty("y")
  // }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
