import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const BOARD_SIZE = "10mm"

const VIA_HOLE_DIAMETER = "0.6mm"
const VIA_OUTER_DIAMETER = "1.2mm"

const VIA_POSITION = {
  pcbX: "0mm",
  pcbY: "0mm",
}

test("copper pour surrounds centered via on the same net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={BOARD_SIZE} height={BOARD_SIZE}>
      <via
        {...VIA_POSITION}
        connectsTo="net.GND"
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={VIA_HOLE_DIAMETER}
        outerDiameter={VIA_OUTER_DIAMETER}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
