import { expect, test } from "bun:test"
import { getBoundFromCenteredRect } from "@tscircuit/math-utils"
import {
  doBoundsShareArea,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen labels move off fiducials and exposed vias, not tented ones", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={2.6}
        fontSize={0.4}
        text="A fiducial, an exposed via and a via left to the fab's tenting cover R1's, R2's and R3's label spots"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      {/* An 0402's default label is centered 1.22 mm above the part */}
      <fiducial name="FID1" pcbX={-4} pcbY={1.22} padDiameter="1mm" />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <via
        pcbX={0}
        pcbY={1.22}
        outerDiameter="0.8mm"
        holeDiameter="0.4mm"
        tented={false}
      />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      {/* Without tenting, the fab's default, usually tented, applies */}
      <via pcbX={4} pcbY={1.22} outerDiameter="0.8mm" holeDiameter="0.4mm" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const getLabel = (name: string) =>
    circuit.db.pcb_silkscreen_text.list().find((text) => text.text === name)!
  const getCopperBounds = (x: number, diameter: number) =>
    getBoundFromCenteredRect({
      center: { x, y: 1.22 },
      width: diameter,
      height: diameter,
    })
  expect(
    doBoundsShareArea(getTextBounds(getLabel("R1")), getCopperBounds(-4, 1)),
  ).toBe(false)
  expect(
    doBoundsShareArea(getTextBounds(getLabel("R2")), getCopperBounds(0, 0.8)),
  ).toBe(false)
  expect(getLabel("R3").anchor_position).toEqual({ x: 4, y: 1.22 })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
