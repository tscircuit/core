import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("breakout applies pcb padding", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="8mm" height="6mm" routingDisabled>
      <pcbnotetext
        text={'breakout padding="2mm"; expected group: 5.56 × 4.64 mm'}
        pcbY={2.3}
        fontSize="0.25mm"
        anchorAlignment="center"
      />
      <breakout name="B" padding="2mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </breakout>
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })

  const group = circuit.db.pcb_group.getWhere({ name: "B" })!
  expect(group.width).toBeCloseTo(5.56)
  expect(group.height).toBeCloseTo(4.64)
})
