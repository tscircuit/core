import { expect, test } from "bun:test"
import type { BoardOutlinePoint } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel layout keeps castellated holes aligned with translated board outlines", async () => {
  const { circuit } = getTestFixture()
  const outline = [
    { x: -5, y: -4 },
    { x: 5, y: -4 },
    { x: 5, y: 4 },
    { x: -5, y: 4 },
    {
      x: -5,
      y: 0,
      isCastellatedHole: true,
      holeDiameter: "0.8mm",
      padDiameter: "1.2mm",
    },
  ] satisfies BoardOutlinePoint[]

  circuit.add(
    <panel width="40mm" height="20mm" layoutMode="grid">
      <board name="B1" outline={outline} routingDisabled>
        <pcbnotetext text="B1 CASTELLATION" fontSize="0.4mm" />
      </board>
      <board name="B2" outline={outline} routingDisabled>
        <pcbnotetext text="B2 CASTELLATION" fontSize="0.4mm" />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  const pcbBoards = circuit.db.pcb_board.list()
  const platedHoles = circuit.db.pcb_plated_hole.list()

  expect(pcbBoards).toHaveLength(2)
  expect(platedHoles).toHaveLength(2)

  for (const pcbBoard of pcbBoards) {
    const platedHole = platedHoles.find(
      (hole) =>
        Math.abs(hole.x - (pcbBoard.center.x - 5)) < 1e-6 &&
        Math.abs(hole.y - pcbBoard.center.y) < 1e-6,
    )
    const castellatedOutlinePoint = pcbBoard.outline?.find(
      (point) =>
        Math.abs(point.x - (pcbBoard.center.x - 5)) < 1e-6 &&
        Math.abs(point.y - pcbBoard.center.y) < 1e-6,
    )

    expect(platedHole).toMatchObject({
      x: pcbBoard.center.x - 5,
      y: pcbBoard.center.y,
      hole_diameter: 0.8,
      outer_diameter: 1.2,
    })
    expect(castellatedOutlinePoint).toEqual({
      x: platedHole!.x,
      y: platedHole!.y,
    })
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
  })
})
