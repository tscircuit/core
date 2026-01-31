import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

test("port with INV_ prefix shows inversion bubble in all directions", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        schX={0}
        schY={0}
        schWidth={5}
        schHeight={3}
        pinLabels={{
          pin1: "INV_RIGHT",
          pin2: "INV_DOWN",
          pin3: "INV_LEFT",
          pin4: "INV_UP",
        }}
        schPortArrangement={{
          rightSide: { pins: ["pin1"], direction: "top-to-bottom" },
          bottomSide: { pins: ["pin2"], direction: "left-to-right" },
          leftSide: { pins: ["pin3"], direction: "top-to-bottom" },
          topSide: { pins: ["pin4"], direction: "left-to-right" },
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
