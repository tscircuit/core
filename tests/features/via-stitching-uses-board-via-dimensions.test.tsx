import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("via stitching uses board default via dimensions", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      pcbStyle={{ viaHoleDiameter: "0.25mm", viaPadDiameter: "0.5mm" }}
    >
      <copperpour connectsTo="net.GND" layer="top" />
      <copperpour connectsTo="net.GND" layer="bottom" />
      <pcbnotetext
        pcbY={4.65}
        fontSize="0.25mm"
        anchorAlignment="center"
        text="Board vias: 0.25mm hole / 0.5mm pad"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]
  if (!pcbBoard) throw new Error("Expected a PCB board")
  expect(pcbBoard.min_via_hole_diameter).toBe(0.25)
  expect(pcbBoard.min_via_pad_diameter).toBe(0.5)

  const stitchedVias = circuit.db.pcb_via
    .list()
    .filter((via) => via.is_tented === true)
  expect(stitchedVias.length).toBeGreaterThan(0)
  expect(
    stitchedVias.every(
      (via) =>
        via.hole_diameter === pcbBoard.min_via_hole_diameter &&
        via.outer_diameter === pcbBoard.min_via_pad_diameter,
    ),
  ).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
