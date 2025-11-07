import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("direct minTraceWidth prop with PCB snapshot", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="direct-prop-group" minTraceWidth={0.5}>
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={2}
          pcbX={2}
        />
        <capacitor
          capacitance="1000pF"
          footprint="0402"
          name="C1"
          schX={-2}
          pcbX={-2}
        />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      </group>
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
