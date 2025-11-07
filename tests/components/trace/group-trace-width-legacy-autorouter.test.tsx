import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouter.minTraceWidth still works for backward compatibility", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="legacy-group" autorouter={{ minTraceWidth: 0.7 } as any}>
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
        <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      </group>
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
