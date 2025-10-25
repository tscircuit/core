import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro68: schPinSpacing should not change box dimensions", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schPinSpacing={0.2}
        footprint="soic8"
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4], direction: "top-to-bottom" },
          rightSide: { pins: [5, 6, 7, 8], direction: "bottom-to-top" },
        }}
      />
      <chip
        name="U2"
        schX={3}
        schPinSpacing={0.8}
        footprint="soic8"
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4], direction: "top-to-bottom" },
          rightSide: { pins: [5, 6, 7, 8], direction: "bottom-to-top" },
        }}
      />
      <chip
        name="U3"
        schY={3}
        schPinSpacing={0.2}
        footprint="soic8"
        schPinArrangement={{
          topSide: { pins: [1, 2, 3, 4], direction: "left-to-right" },
          bottomSide: { pins: [5, 6, 7, 8], direction: "right-to-left" },
        }}
      />
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
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const soup = circuit.getCircuitJson()
  const schematicComponents = soup.filter(
    (el: any) => el.type === "schematic_component",
  ) as any[]

  expect(schematicComponents.length).toBe(4)

  const [u1, u2, u3, u4] = schematicComponents

  // U1 and U2 have left/right pins
  // Width should be the same despite different schPinSpacing
  expect(u1.size.width).toBe(u2.size.width)
  // Height should be different because pins are on left/right sides
  expect(u1.size.height).not.toBe(u2.size.height)

  // U3 and U4 have top/bottom pins
  // Width should be different because pins are on top/bottom sides
  expect(u3.size.width).not.toBe(u4.size.width)
  // Height should be the same despite different schPinSpacing
  expect(u3.size.height).toBe(u4.size.height)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
