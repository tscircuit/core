import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro schpinspacing width", async () => {
  const { circuit } = getTestFixture()

  // Test with left/right pins
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

  // Test with top/bottom pins
  circuit.add(
    <chip
      name="U3"
      schY={3}
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
      name="U4"
      schX={3}
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

  expect(schematicComponents.length).toBe(4)

  const [u1, u2, u3, u4] = schematicComponents

  // For left/right pins: width should be same, height should differ
  expect(u1.size.width).toBe(u2.size.width)
  expect(u1.size.height).not.toBe(u2.size.height)

  // For top/bottom pins: width should differ, height should be same
  expect(u3.size.width).not.toBe(u4.size.width)
  expect(u3.size.height).toBe(u4.size.height)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
