import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Core reports the part's physical facts as a normalized body envelope; the FDM
 * solver owns what they mean for a cut. An authored `depth` stays
 * explicit and suppresses the envelope entirely.
 */
const footprint = (
  <footprint insertionDirection="from_bottom">
    <smtpad portHints={["pin1"]} width="2mm" height="2mm" shape="rect" />
  </footprint>
)

const renderWith = (
  apertureProps: Record<string, unknown>,
  cadSize?: unknown,
) => {
  const { circuit } = getTestFixture()
  let event: SolverStartedEvent | undefined
  circuit.on("solver:started", (e) => {
    if (e.solverName === "CreateFdmEnclosureSolver") event = e
  })
  circuit.add(
    <group>
      <board name="B1" width="30mm" height="20mm" routingDisabled>
        <connector
          name="J1"
          pcbX="0mm"
          pcbY="9mm"
          footprint={footprint}
          cadModel={
            cadSize
              ? ({ objUrl: "https://example.com/x.obj", size: cadSize } as any)
              : undefined
          }
        >
          <enclosure.cutoutaperture
            shape="rect"
            width="6mm"
            height="4mm"
            {...apertureProps}
          />
        </connector>
      </board>
      <enclosure.fdm.box boardRef=".B1" />
    </group>,
  )
  circuit.render()
  return event!.solverParams.apertures[0]
}

test("the CAD body is reported in the part's own frame", () => {
  // Footprint is a single 2mm pad; the declared body is 15mm deep.
  const aperture = renderWith({}, { x: 6, y: 15, z: 8 })
  expect(aperture.componentBody.size).toMatchObject({ x: 6, y: 15, z: 8 })
  expect(aperture.depth).toBeUndefined()
})

test("the footprint is reported when a part declares no body size", () => {
  const aperture = renderWith({})
  expect(aperture.componentBody.size).toBeUndefined()
  // The pcb_component extents still describe how far the part reaches.
  expect(aperture.componentBody.footprint.width).toBeGreaterThan(0)
  expect(aperture.componentBody.footprint.height).toBeGreaterThan(0)
  expect(aperture.depth).toBeUndefined()
})

test("board rotation is reported so the solver can project the body", () => {
  const aperture = renderWith({}, { x: 6, y: 15, z: 8 })
  expect(aperture.componentBody.rotation).toBe(0)
})

test("an authored depth wins, but the body is still reported", () => {
  const aperture = renderWith({ depth: "22mm" }, { x: 6, y: 15, z: 8 })
  expect(aperture.depth).toBeCloseTo(22)

  // The body used to be withheld here, on the grounds that an authored depth
  // made it redundant. It is not: placement needs it too, because a side-face
  // opening is centred on the part's reach above the board. The solver already
  // prefers the authored depth, so reporting the body cannot override it.
  expect(aperture.componentBody).toBeDefined()
  expect(aperture.componentBody.size).toMatchObject({ x: 6, y: 15, z: 8 })
})
