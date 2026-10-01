import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A bottom-layer placement is a full 180-degree rotation about board Y after
 * the authored board-Z roll. The footprint -- pads, silkscreen, CAD model, and
 * aperture profile -- must therefore retain that +45-degree board rotation.
 */
test("a bottom-layer floor aperture rolls with its footprint, not CAD Z", async () => {
  const { circuit } = getTestFixture()
  let event: SolverStartedEvent | undefined
  circuit.on("solver:started", (solverEvent) => {
    if (solverEvent.solverName === "CreateFdmEnclosureSolver") {
      event = solverEvent
    }
  })

  circuit.add(
    <group>
      <board name="B1" width="30mm" height="24mm" routingDisabled>
        <pushbutton
          name="SW1"
          layer="bottom"
          pcbX={0}
          pcbY={0}
          pcbRotation={45}
          footprint={
            <footprint insertionDirection="from_above">
              <smtpad
                portHints={["pin1"]}
                pcbX={-3}
                width={2}
                height={1}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbX={3}
                width={2}
                height={1}
                shape="rect"
              />
            </footprint>
          }
          cadModel={{
            objUrl: "https://example.com/switch.obj",
            pcbRotationOffset: 0,
            size: { x: 8, y: 5, z: 4 },
          }}
        >
          <enclosure.cutoutaperture shape="rect" width="8mm" height="3mm" />
        </pushbutton>
      </board>
      <enclosure.fdm.box boardRef=".B1" />
    </group>,
  )
  await circuit.renderUntilSettled()

  const aperture = event?.solverParams.apertures[0]
  const cadComponent = circuit.db.cad_component.list()[0]!

  expect(aperture.face).toBe("z_neg")
  expect(aperture.rotation).toBeCloseTo(45)
  expect(cadComponent.rotation?.z).toBeCloseTo(45)
})
