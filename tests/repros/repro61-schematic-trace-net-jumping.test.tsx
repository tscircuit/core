import { expect, test } from "bun:test"
import { sel } from "lib/sel"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic trace net jumping", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <capacitor
        name="C1"
        capacitance="0.1uF"
        footprint="cap0402"
        schRotation={90}
        schX={2}
      />
      <capacitor
        name="C2"
        capacitance="10uF"
        footprint="cap0603"
        schRotation={90}
      />
      <netlabel net="GND" anchorSide="top" connection={sel.C1.pin1} />
      <netlabel
        net="VCC"
        anchorSide="bottom"
        connection={sel.C1.pin2}
        schX={2}
        schY={0.55}
      />
      <netlabel net="GND" anchorSide="top" connection={sel.C2.pin1} />
      <netlabel net="VCC" anchorSide="bottom" connection={sel.C2.pin2} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
