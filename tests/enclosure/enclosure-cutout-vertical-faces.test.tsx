import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A part that mates along +Z exits through the enclosure face on the side of the
 * board it is mounted on, centered on the part itself. `from_above` survives the
 * footprint flip transform unchanged, so the PCB layer is what picks the face.
 */
test("a from_above aperture cuts the face on its own side of the board", () => {
  const { circuit } = getTestFixture()
  let enclosureSolverEvent: SolverStartedEvent | undefined
  circuit.on("solver:started", (event) => {
    if (event.solverName === "CreateFdmEnclosureSolver") {
      enclosureSolverEvent = event
    }
  })

  const verticalFootprint = (
    <footprint insertionDirection="from_above">
      <smtpad portHints={["pin1"]} width="2mm" height="2mm" shape="rect" />
    </footprint>
  )

  circuit.add(
    <group>
      <board name="B1" width="30mm" height="20mm" routingDisabled>
        {/* Top-side button: exits through the lid. */}
        <chip name="SW1" pcbX="6mm" pcbY="-3mm" footprint={verticalFootprint}>
          <enclosure.cutoutaperture shape="circle" radius="3mm" />
        </chip>
        {/* Bottom-side LED: exits through the floor. */}
        <chip
          name="LED1"
          pcbX="-8mm"
          pcbY="4mm"
          layer="bottom"
          footprint={verticalFootprint}
        >
          <enclosure.cutoutaperture shape="circle" radius="1.5mm" />
        </chip>
      </board>
      <enclosure.fdm.box boardRef=".B1" />
    </group>,
  )
  circuit.render()

  const apertures = enclosureSolverEvent?.solverParams.apertures
  expect(apertures).toHaveLength(2)

  const top = apertures.find((a: any) => a.face === "z_pos")
  const bottom = apertures.find((a: any) => a.face === "z_neg")
  expect(top).toBeDefined()
  expect(bottom).toBeDefined()

  // Both in-plane coordinates are meaningful for a horizontal face, and both
  // come straight from the component placement -- no inference involved.
  expect(top.center.x).toBeCloseTo(6)
  expect(top.center.y).toBeCloseTo(-3)
  expect(bottom.center.x).toBeCloseTo(-8)
  expect(bottom.center.y).toBeCloseTo(4)

  // A horizontal aperture takes its height from the plate it pierces, so it
  // never needs a height offset.
  expect(top.heightDimensionOffset).toBeUndefined()
})
