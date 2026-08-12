import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const apertureWith = async (props: Record<string, unknown>) => {
  const { circuit } = getTestFixture()
  let event: SolverStartedEvent | undefined
  circuit.on("solver:started", (e) => {
    if (e.solverName === "CreateFdmEnclosureSolver") event = e
  })

  circuit.add(
    <group>
      <board name="B1" width="40mm" height="24mm" routingDisabled>
        <chip
          name="J1"
          pcbX={0}
          pcbY={11}
          footprint={
            <footprint insertionDirection={"from_top" as any}>
              <smtpad
                shape="rect"
                portHints={["pin1"]}
                pcbX={0}
                pcbY={0}
                width={2}
                height={2}
              />
            </footprint>
          }
          cadModel={{
            objUrl: "https://example.com/x.obj",
            size: { x: 8, y: 4, z: 6 },
            modelOriginPosition: { x: 0, y: 0, z: -3 },
            modelBounds: {
              min: { x: -4, y: -2, z: -3 },
              max: { x: 4, y: 2, z: 3 },
            },
          }}
        >
          <enclosure.cutoutaperture
            shape="rect"
            width="6mm"
            height="3mm"
            {...props}
          />
        </chip>
      </board>
      <enclosure.fdm.box boardRef=".B1" />
    </group>,
  )
  await circuit.renderUntilSettled()
  return (event as any)?.solverParams.apertures[0]
}

// The model sits entirely above the board: bounds z span -3..3 with the origin
// at -3, so it reaches 6mm up. A side-face opening therefore centres 3mm above
// the mounting surface without anyone authoring a height.
test("a side opening centres on the part's measured body", async () => {
  const aperture = await apertureWith({})
  expect(aperture.face).toBe("y_pos")
  expect(aperture.componentBody.aboveBoardHeight).toBeCloseTo(6, 6)
  expect(aperture.heightDimensionOffset).toBeUndefined()
})

test("the offsets are passed through, signed", async () => {
  const up = await apertureWith({ heightDimensionOffset: "1.5mm" })
  expect(up.heightDimensionOffset).toBeCloseTo(1.5, 6)

  const down = await apertureWith({ heightDimensionOffset: "-1.5mm" })
  expect(down.heightDimensionOffset).toBeCloseTo(-1.5, 6)

  const across = await apertureWith({ widthDimensionOffset: "-2mm" })
  expect(across.widthDimensionOffset).toBeCloseTo(-2, 6)
})

// Both are Distances, so unit suffixes are parsed before the solver sees them.
test("offsets accept units", async () => {
  const aperture = await apertureWith({ heightDimensionOffset: "0.25in" })
  expect(aperture.heightDimensionOffset).toBeCloseTo(6.35, 3)
})
