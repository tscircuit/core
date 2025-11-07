import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group-level trace width applies to traces without explicit thickness", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="G1" autorouter={{ minTraceWidth: 0.8 } as any}>
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <capacitor
          capacitance="1000pF"
          footprint="0402"
          name="C1"
          schX={-3}
          pcbX={-3}
        />
        <capacitor capacitance="1000pF" footprint="0402" name="C2" schX={-3} />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" thickness={1.2} />
        <trace from=".R1 > .pin2" to=".C2 > .pin1" />
      </group>
    </board>,
  )

  circuit.render()

  const source_traces = circuit.db.source_trace.list()
  expect(source_traces).toHaveLength(2)

  // First trace has explicit thickness
  const explicit_trace = source_traces.find(
    (t) => t.min_trace_thickness === 1.2,
  )
  expect(explicit_trace).toBeDefined()
  expect(explicit_trace!.min_trace_thickness).toBe(1.2)

  // Second trace should use group default
  const default_trace = source_traces.find((t) => t.min_trace_thickness === 0.8)
  expect(default_trace).toBeDefined()
  expect(default_trace!.min_trace_thickness).toBe(0.8)
})

test("trace explicit thickness overrides group default", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="G1" autorouter={{ minTraceWidth: 0.5 } as any}>
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <capacitor
          capacitance="1000pF"
          footprint="0402"
          name="C1"
          schX={-3}
          pcbX={-3}
        />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" thickness={1.5} />
      </group>
    </board>,
  )

  circuit.render()

  const source_trace = circuit.db.source_trace.list()[0]
  expect(source_trace.min_trace_thickness).toBeDefined()
  expect(source_trace.min_trace_thickness).toBe(1.5) // explicit thickness, not group default
})
