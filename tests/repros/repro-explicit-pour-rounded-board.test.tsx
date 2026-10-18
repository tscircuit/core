import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit pour on rounded board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10} borderRadius={1.5}>
      <net name="GND" />
      <copperpour
        layer="bottom"
        connectsTo="net.GND"
        boardEdgeMargin={0.3}
        outline={[
          { x: -5, y: 0 },
          { x: 5, y: 0 },
          { x: 5, y: 5 },
          { x: -5, y: 5 },
        ]}
      />
      <pcbnotetext
        text="Explicit GND pour on rounded board"
        pcbY={-2}
        fontSize={0.35}
      />
      <pcbnotetext
        text="Expected: 0.3 mm clearance at corners"
        pcbY={-3}
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const clearanceErrors = circuit.db.pcb_placement_error.list()
  expect(clearanceErrors).toHaveLength(1)
  expect(clearanceErrors[0]!.message).toContain(
    "violates copper-to-board-edge clearance (measured 0.000mm",
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
