import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schPinStyle accepts pinLabels", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "PWR", pin8: "GND" }}
        schPinStyle={{ PWR: { bottomMargin: 1 }, GND: { bottomMargin: 0.5 } }}
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
