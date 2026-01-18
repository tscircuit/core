import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel auto-layout positions boards relative to panel center", async () => {
  const { circuit } = getTestFixture()

  // Panel at (25, 25) with two unpositioned boards
  // The boards should be auto-laid out centered around the panel position
  circuit.add(
    <panel width="30mm" height="30mm" pcbX="25mm" pcbY="25mm" layoutMode="grid">
      <board width="10mm" height="10mm" routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
      <board width="10mm" height="10mm" routingDisabled>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
  })
})
