import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro schpinspacing width leftright", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <chip
      name="U1"
      schPinSpacing={0.2}
      footprint="soic8"
      schPinArrangement={{
        leftSide: { pins: [1, 2, 3, 4], direction: "top-to-bottom" },
        rightSide: { pins: [5, 6, 7, 8], direction: "bottom-to-top" },
      }}
    />,
  )

  circuit.add(
    <chip
      name="U2"
      schX={3}
      schPinSpacing={0.8}
      footprint="soic8"
      schPinArrangement={{
        leftSide: { pins: [1, 2, 3, 4], direction: "top-to-bottom" },
        rightSide: { pins: [5, 6, 7, 8], direction: "bottom-to-top" },
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

  // Width should be the same despite different schPinSpacing
  // because there are no pins on top/bottom sides
  expect(u1.size.width).toBe(u2.size.width)

  // Height should be different because pins are on left/right sides
  expect(u1.size.height).not.toBe(u2.size.height)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
