import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <net name="VCC" />
      <net name="GND" />
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "OUT",
        }}
        connections={{
          VCC: "net.VCC",
          OUT: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
