import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

beforeAll(async () => {
  const footprint = (
    <footprint>
      <platedhole
        shape="pill"
        outerWidth={4}
        outerHeight={1.4}
        holeWidth={3}
        holeHeight={0.6}
      />
      <smtpad shape="circle" radius={0.2} pcbX={-3} />
      <smtpad shape="circle" radius={0.2} pcbX={3} />
    </footprint>
  )

  circuit.add(
    <board width={24} height={10} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Each slot should align with its two round reference pads"
        pcbY={4}
        fontSize={0.6}
        color="white"
      />
      <pcbnotetext
        text="U1: TOP, 30deg"
        pcbX={-5.5}
        pcbY={2.6}
        fontSize={0.5}
        color="white"
      />
      <chip
        name="U1"
        layer="top"
        isSmt
        pcbX={-5.5}
        pcbRotation={30}
        footprint={footprint}
      />
      <pcbnotetext
        text="U2: BOTTOM, 30deg"
        pcbX={5.5}
        pcbY={2.6}
        fontSize={0.5}
        color="white"
      />
      <chip
        name="U2"
        layer="bottom"
        isSmt
        pcbX={5.5}
        pcbRotation={30}
        footprint={footprint}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Keep snapshot failures outside test.failing so they still fail CI.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing("plated slots follow their footprint axis on both sides", () => {
  for (const hole of circuit.db.pcb_plated_hole.list()) {
    if (hole.shape !== "pill") throw new Error("Expected a pill-shaped slot")
    const [start, end] = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "circle")
      .filter((pad) => pad.pcb_component_id === hole.pcb_component_id)

    // Derive the board-world axis from emitted reference-pad points in mm
    // (+X right, +Y up). This is a direction; translation cancels out. A slot
    // is symmetric under a 180-degree turn, including after a PCB side flip.
    const axisDegrees =
      (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI
    const expectedAxis = ((axisDegrees % 180) + 180) % 180
    expect((hole.ccw_rotation ?? 0) % 180).toBeCloseTo(expectedAxis, 6)

    for (const paste of circuit.db.pcb_solder_paste.list()) {
      if (
        paste.pcb_component_id === hole.pcb_component_id &&
        paste.shape === "rotated_pill"
      ) {
        expect(paste.ccw_rotation % 180).toBeCloseTo(expectedAxis, 6)
      }
    }
  }
})
