import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schPinLength controls the schematic pin stem length", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4], direction: "top-to-bottom" },
          rightSide: { pins: [5, 6, 7, 8], direction: "bottom-to-top" },
        }}
      />
      <chip
        name="U2"
        schX={5}
        {...({ schPinLength: 1 } as any)}
        footprint="soic8"
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4], direction: "top-to-bottom" },
          rightSide: { pins: [5, 6, 7, 8], direction: "bottom-to-top" },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const soup = circuit.getCircuitJson()
  const schematicPorts = soup.filter(
    (el: any) => el.type === "schematic_port",
  ) as any[]

  // U1 ports should have default distance (0.4)
  const u1Ports = schematicPorts.filter(
    (p: any) => p.distance_from_component_edge === 0.4,
  )
  // U2 ports should have distance 1.0
  const u2Ports = schematicPorts.filter(
    (p: any) => p.distance_from_component_edge === 1,
  )

  expect(u1Ports.length).toBe(8)
  expect(u2Ports.length).toBe(8)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
