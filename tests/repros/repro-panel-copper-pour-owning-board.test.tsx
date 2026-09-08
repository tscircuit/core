import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Remove .failing and update the PCB snapshot when board selection is fixed.
// Core currently uses the first pcb_board for both subcircuits.
test.failing(
  "panel copper pours should use their owning board outline",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <panel
        row={1}
        col={2}
        layoutMode="grid"
        boardGap="6mm"
        panelizationMethod="none"
      >
        {["LEFT", "RIGHT"].map((name) => (
          <board key={name} name={name} width="20mm" height="12mm">
            <net name="GND" isGroundNet />
            <copperpour
              connectsTo="net.GND"
              layer="bottom"
              boardEdgeMargin="1mm"
            />
            <pcbnotetext
              text={`${name}: GND should fill this board`}
              fontSize="0.55mm"
              pcbY={3}
            />
            <pcbnotetext
              text="Expected: 1 mm edge clearance"
              fontSize="0.5mm"
              pcbY={-3}
            />
          </board>
        ))}
      </panel>,
    )

    await circuit.renderUntilSettled()

    // Capture the reproduction: both pours currently occupy the left board,
    // leaving the right board empty despite its separate GND net and pour.
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const pcbBoards = circuit.db.pcb_board.list()
    const copperPours = circuit.db.pcb_copper_pour.list()
    expect(pcbBoards).toHaveLength(2)
    expect(copperPours).toHaveLength(2)

    for (const pcbBoard of pcbBoards) {
      const sourceBoard = circuit.db.source_board.get(
        pcbBoard.source_board_id!,
      )!
      const sourceGroup = circuit.db.source_group.get(
        sourceBoard.source_group_id,
      )!
      const boardPours = copperPours.filter(
        (pour): pour is PcbCopperPourBRep =>
          pour.shape === "brep" &&
          pour.subcircuit_id === sourceGroup.subcircuit_id,
      )
      expect(boardPours).toHaveLength(1)

      // These are emitted positions in circuit world space (mm, +X right,
      // +Y up), so panel translation is included in both board and pour bounds.
      const vertices = boardPours[0]!.brep_shape.outer_ring.vertices
      expect({
        minX: Math.min(...vertices.map((vertex) => vertex.x)),
        maxX: Math.max(...vertices.map((vertex) => vertex.x)),
        minY: Math.min(...vertices.map((vertex) => vertex.y)),
        maxY: Math.max(...vertices.map((vertex) => vertex.y)),
      }).toEqual({
        minX: pcbBoard.center.x - pcbBoard.width / 2 + 1,
        maxX: pcbBoard.center.x + pcbBoard.width / 2 - 1,
        minY: pcbBoard.center.y - pcbBoard.height / 2 + 1,
        maxY: pcbBoard.center.y + pcbBoard.height / 2 - 1,
      })
    }
  },
)
