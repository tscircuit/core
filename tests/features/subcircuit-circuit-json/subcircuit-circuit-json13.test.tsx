import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: subcircuit-circuit-json13 incorrect net labels", async () => {
  const { circuit } = await getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" schMaxTraceDistance={20}>
      <subcircuit name="S1">
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          connections={{ pin1: "C1.pin1" }}
        />
        <capacitor name="C1" capacitance="10uF" footprint="0402" />
      </subcircuit>
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: ".S1 .R1 .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
