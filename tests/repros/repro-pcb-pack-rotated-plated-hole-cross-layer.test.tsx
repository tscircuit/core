import { expect, test } from "bun:test"
import type { PcbPlatedHoleOval, PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "pcbPack avoids rotated plated-hole copper across layers",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="14mm" height="10mm" pcbPack routingDisabled>
        <chip
          name="J1"
          pcbX={0}
          pcbY={0}
          pcbRotation={90}
          footprint={
            <footprint>
              <platedhole
                shape="pill"
                outerWidth="2mm"
                outerHeight="6mm"
                holeWidth="1mm"
                holeHeight="5mm"
                portHints={["pin1"]}
              />
            </footprint>
          }
        />

        <resistor name="R1" resistance="10k" footprint="0603" layer="bottom" />
        <trace from=".J1 > .pin1" to=".R1 > .pin1" />

        <pcbnotetext
          pcbY={4.2}
          text="BOTTOM SMT MUST AVOID ROTATED THROUGH-HOLE COPPER"
          fontSize="0.4mm"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      shouldDrawRatsNest: true,
      showCourtyards: true,
    })

    const platedHole = circuit.db.pcb_plated_hole.list()[0] as PcbPlatedHoleOval
    const bottomPads = (circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]).filter(
      (pad) => pad.layer === "bottom" && pad.shape === "rect",
    )

    const rotationRadians = ((platedHole.ccw_rotation ?? 0) * Math.PI) / 180
    const rotatedOuterWidth =
      Math.abs(platedHole.outer_width * Math.cos(rotationRadians)) +
      Math.abs(platedHole.outer_height * Math.sin(rotationRadians))
    const rotatedOuterHeight =
      Math.abs(platedHole.outer_width * Math.sin(rotationRadians)) +
      Math.abs(platedHole.outer_height * Math.cos(rotationRadians))

    const hasCopperOverlap = bottomPads.some(
      (pad) =>
        Math.abs(pad.x - platedHole.x) <
          pad.width / 2 + rotatedOuterWidth / 2 &&
        Math.abs(pad.y - platedHole.y) <
          pad.height / 2 + rotatedOuterHeight / 2,
    )

    expect(hasCopperOverlap).toBe(false)
  },
)
