import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip port schematic position", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        schX={5}
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin8: "GND",
        }}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: {
      cellSize: 0.5,
      labelCells: true,
    },
  })

  const schematicPorts = circuit.db.schematic_port.list()

  // Find the VCC port (pin1)
  const vccPort = schematicPorts.find(
    (port) => circuit.db.source_port.get(port.source_port_id!)?.name === "VCC",
  )

  expect(vccPort).toBeDefined()
  expect(vccPort!.center.x).toBeGreaterThan(4.5) // Should be to the right of schX

  // Find the GND port (pin8)
  const gndPort = schematicPorts.find(
    (port) => circuit.db.source_port.get(port.source_port_id!)?.name === "GND",
  )

  expect(gndPort).toBeDefined()
  expect(gndPort!.center.x).toBeGreaterThan(4.5) // Should be to the right of schX
})
