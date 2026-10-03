import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("tear reliefs follow rotated groups and their owning boards in a panel", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      row={1}
      col={4}
      layoutMode="grid"
      boardGap={3}
      panelizationMethod="none"
    >
      {[0, 90, 180, 270].map((rotation) => (
        <board
          key={rotation}
          name={`rotation${rotation}`}
          width={16}
          height={16}
          material="flex"
          schematicDisabled
          routingDisabled
        >
          <group pcbX={1} pcbY={2} pcbRotation={rotation}>
            <pcbbend
              x1={-3}
              y1={-5}
              x2={-3}
              y2={5}
              bendAngle={0}
              bendRadius={1}
              bendSide="left"
              tearReliefRadius={0.5}
            />
          </group>
          <pcbnotetext text={`${rotation} degrees`} pcbY={-6} fontSize={1} />
        </board>
      ))}
    </panel>,
  )
  await circuit.renderUntilSettled()
  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)
  expect(new Set(boards.map((board) => board.center.x)).size).toBe(4)
  const expectedLocalCenters = [
    [
      { x: -2, y: -3 },
      { x: -2, y: 7 },
    ],
    [
      { x: 6, y: -1 },
      { x: -4, y: -1 },
    ],
    [
      { x: 4, y: 7 },
      { x: 4, y: -3 },
    ],
    [
      { x: -4, y: 5 },
      { x: 6, y: 5 },
    ],
  ]
  for (const [index, board] of boards.entries()) {
    const bend = circuit.db.pcb_bend
      .list()
      .find((record) => record.pcb_board_id === board.pcb_board_id)!
    const cutouts = circuit.db.pcb_cutout
      .list()
      .filter((record) => record.pcb_board_id === board.pcb_board_id)
    expect(cutouts).toHaveLength(2)
    for (const [endpointIndex, cutout] of cutouts.entries()) {
      if (cutout.shape !== "circle") throw new Error("Expected circular relief")
      // Actual world-space points, in right-handed PCB mm (+X right, +Y top,
      // +Z above). Explicit quarter-turn expectations catch wrong rotation order.
      const local = expectedLocalCenters[index]![endpointIndex]!
      expect(cutout.center.x).toBeCloseTo(board.center.x + local.x)
      expect(cutout.center.y).toBeCloseTo(board.center.y + local.y)
      expect(cutout.radius).toBe(0.5)
      expect(cutout.pcb_group_id).toBe(bend.pcb_group_id)
      expect(cutout.subcircuit_id).toBe(bend.subcircuit_id)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showBendLines: true,
  })
})
