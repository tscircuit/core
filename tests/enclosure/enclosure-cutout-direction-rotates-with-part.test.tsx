import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** The aperture axis uses the same component transform as footprint geometry. */
test("cutoutApertureDirection rotates with the part", () => {
  const { circuit } = getTestFixture()
  let event: SolverStartedEvent | undefined
  circuit.on("solver:started", (nextEvent) => {
    if (nextEvent.solverName === "CreateFdmEnclosureSolver") event = nextEvent
  })

  circuit.add(
    <group>
      <board name="B1" width="40mm" height="24mm" routingDisabled>
        <pushbutton
          name="SW1"
          pcbY="9mm"
          pcbRotation="90deg"
          footprint={
            <footprint
              insertionDirection="from_above"
              cutoutApertureDirection="from_right"
            >
              <smtpad
                portHints={["pin1"]}
                width="2mm"
                height="2mm"
                shape="rect"
              />
            </footprint>
          }
        >
          <enclosure.cutoutaperture shape="circle" radius="1.6mm" />
        </pushbutton>
      </board>
      <enclosure.fdm.box boardRef=".B1" />
    </group>,
  )
  circuit.render()

  expect(event?.solverParams.apertures[0]?.face).toBe("y_pos")
  expect(event?.solverParams.apertures[0]?.apertureAxisDirection.x).toBeCloseTo(
    0,
  )
  expect(event?.solverParams.apertures[0]?.apertureAxisDirection.y).toBeCloseTo(
    1,
  )
})
