import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a board with only minViaHoleDiameter sizes vias like its pcb_board minimums", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm" minViaHoleDiameter={0.3} routingDisabled>
      <via pcbX={0} pcbY={0} fromLayer="top" toLayer="bottom" />
      <pcbnotetext
        pcbX={0}
        pcbY={2.5}
        fontSize={0.45}
        text="minViaHoleDiameter 0.3mm: via 0.3mm drill / 0.45mm pad"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.db.pcb_board.list()[0]
  const [via] = circuit.db.pcb_via.list()
  expect([via.hole_diameter, via.outer_diameter]).toEqual([
    board.min_via_hole_diameter!,
    board.min_via_pad_diameter!,
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
