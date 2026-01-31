import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

test("port with INV_ prefix shows inversion bubble in all directions", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="15mm">
      <chip
        name="U1"
        schX={0}
        schY={0}
        pinLabels={{
          pin1: "INV_LEFT",
          pin2: "INV_RIGHT",
        }}
      />
    </board>,
  )

  circuit.render()

  const ports = circuit.db.schematic_port.list()

  expect(
    convertCircuitJsonToSchematicSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
})
