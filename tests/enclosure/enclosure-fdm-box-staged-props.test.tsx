import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Core forwards the complete optional Props surface in one solver migration. */
test("enclosure.fdm.box forwards staged sizing props and disableCutouts", () => {
  const { circuit } = getTestFixture()
  let event: SolverStartedEvent | undefined
  circuit.on("solver:started", (nextEvent) => {
    if (nextEvent.solverName === "CreateFdmEnclosureSolver") event = nextEvent
  })

  circuit.add(
    <group>
      <board name="B1" width="40mm" height="24mm" routingDisabled>
        <connector
          name="J1"
          footprint={
            <footprint insertionDirection="from_right">
              <smtpad
                portHints={["pin1"]}
                width="2mm"
                height="2mm"
                shape="rect"
              />
            </footprint>
          }
        >
          <enclosure.cutoutaperture shape="circle" radius="2mm" />
        </connector>
      </board>
      <enclosure.fdm.box
        name="case"
        boardRef=".B1"
        width="50mm"
        height="34mm"
        depth="25mm"
        wallThickness="2.4mm"
        floorThickness="2.2mm"
        lidThickness="1.8mm"
        boardClearance="1.2mm"
        standoffHeight="3mm"
        topHeadroom="13mm"
        lidLipDepth="3.5mm"
        disableCutouts
      />
    </group>,
  )
  circuit.render()

  expect(event?.solverParams).toMatchObject({
    width: 50,
    height: 34,
    depth: 25,
    wallThickness: 2.4,
    floorThickness: 2.2,
    lidThickness: 1.8,
    boardClearance: 1.2,
    standoffHeight: 3,
    topHeadroom: 13,
    lidLipDepth: 3.5,
    apertures: [],
  })
})
