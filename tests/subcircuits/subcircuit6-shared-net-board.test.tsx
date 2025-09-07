import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuits and board share net", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" autorouter="sequential-trace">
      <subcircuit name="S1">
        <resistor
          resistance="100"
          name="R1"
          footprint="0402"
          pcbX={2}
          connections={{ pin1: "net.GND" }}
        />
      </subcircuit>
      <subcircuit name="S2">
        <resistor
          resistance="100"
          name="R2"
          footprint="0402"
          pcbX={-2}
          connections={{ pin1: "net.GND" }}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
