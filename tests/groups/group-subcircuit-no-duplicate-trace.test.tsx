import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit should not have multiple traces between the same pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="30mm">
      <group name="G1">
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-8}
          pcbY={0}
          connections={{
            pin1: "R4.pin1",
          }}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </group>
      <subcircuit name="S1" pcbY={-10} autorouter="sequential-trace">
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={0}
          pcbY={0}
          connections={{
            pin1: "C2.pin1",
          }}
        />
        <capacitor
          name="C2"
          capacitance="100nF"
          footprint="0402"
          pcbX={5}
          pcbY={0}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(2)
})
