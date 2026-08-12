import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Installation and interaction are independent part-local facts. */
test("cutoutApertureDirection places the opening instead of insertionDirection", () => {
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
          pcbX="14mm"
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

  expect(circuit.db.pcb_component.list()[0]?.insertion_direction).toBe(
    "from_above",
  )
  expect(event?.solverParams.apertures[0]).toMatchObject({
    face: "x_pos",
    apertureAxisDirection: { x: 1, y: 0, z: 0 },
  })
})
