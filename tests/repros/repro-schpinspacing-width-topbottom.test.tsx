import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro schpinspacing width topbottom", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <chip
      name="U1"
      schPinSpacing={0.2}
      footprint="soic8"
      schPinArrangement={{
        topSide: { pins: [1, 2, 3, 4], direction: "left-to-right" },
        bottomSide: { pins: [5, 6, 7, 8], direction: "right-to-left" },
      }}
    />,
  )

  circuit.add(
    <chip
      name="U2"
      schY={3}
      schPinSpacing={0.8}
      footprint="soic8"
      schPinArrangement={{
        topSide: { pins: [1, 2, 3, 4], direction: "left-to-right" },
        bottomSide: { pins: [5, 6, 7, 8], direction: "right-to-left" },
      }}
    />,
  )

  await circuit.renderUntilSettled()

  const soup = circuit.getCircuitJson()
  const schematicComponents = soup.filter(
    (el: any) => el.type === "schematic_component",
  ) as any[]

  expect(schematicComponents.length).toBe(2)

  const [u1, u2] = schematicComponents

  // Width should be different because pins are on top/bottom sides
  expect(u1.size.width).not.toBe(u2.size.width)

  // Height should be the same despite different schPinSpacing
  // because there are no pins on left/right sides
  expect(u1.size.height).toBe(u2.size.height)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
