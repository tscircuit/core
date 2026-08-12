import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * `pcbRotationOffset` aligns a raw CAD asset's native axes to its footprint. It
 * must rotate only model-local geometry; inheriting it into a footprint-owned
 * aperture turns a correct slot merely because a downloaded OBJ needed repair.
 */
test("a lid aperture ignores the CAD asset rotation offset", async () => {
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
          pcbX={0}
          pcbY={0}
          pcbRotation={20}
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
            objUrl: "https://example.com/switch-native-y.obj",
            pcbRotationOffset: 90,
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

  expect(aperture.face).toBe("z_pos")
  expect(aperture.rotation).toBeCloseTo(20)
  expect(cadComponent.rotation?.z).toBeCloseTo(110)
})
