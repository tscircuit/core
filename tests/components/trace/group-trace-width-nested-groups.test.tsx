import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested groups with different minTraceWidth values", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="15mm">
      <group name="outer-group" minTraceWidth={0.2}>
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={4}
          pcbX={4}
        />
        <capacitor
          capacitance="1000pF"
          footprint="0402"
          name="C1"
          schX={-4}
          pcbX={-4}
        />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" />

        <group name="inner-group" minTraceWidth={0.4}>
          <resistor
            resistance="2k"
            footprint="0402"
            name="R2"
            schX={0}
            pcbX={0}
            schY={3}
            pcbY={3}
          />
          <capacitor
            capacitance="1000pF"
            footprint="0402"
            name="C2"
            schX={0}
            schY={-3}
            pcbX={0}
            pcbY={-3}
          />
          <trace from=".R2 > .pin1" to=".C2 > .pin1" />
        </group>
      </group>
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
