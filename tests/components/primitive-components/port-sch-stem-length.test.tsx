import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Port schStemLength prop sets distance_from_component_edge and side_of_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        schX={0}
        schY={0}
        symbol={
          <symbol>
            <schematicrect schX={0} schY={0} width={2} height={2} />
            <port
              name="IN"
              schX={-1}
              schY={0.5}
              direction="left"
              schStemLength={0.6}
            />
            <port
              name="OUT"
              schX={1}
              schY={0.5}
              direction="right"
              schStemLength={0.8}
            />
            <port
              name="VCC"
              schX={0}
              schY={1}
              direction="up"
              schStemLength={0.5}
            />
            <port
              name="GND"
              schX={0}
              schY={-1}
              direction="down"
              schStemLength={0.4}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const schematicPorts = circuitJson.filter(
    (e) => e.type === "schematic_port",
  ) as any[]

  expect(schematicPorts.length).toBe(4)

  // Check IN port (left, stem 0.6)
  const inPort = schematicPorts.find((p) => p.display_pin_label === "IN")
  expect(inPort.side_of_component).toBe("left")
  expect(inPort.distance_from_component_edge).toBe(0.6)
  expect(inPort.center.x).toBe(-1.6) // -1 - 0.6

  // Check OUT port (right, stem 0.8)
  const outPort = schematicPorts.find((p) => p.display_pin_label === "OUT")
  expect(outPort.side_of_component).toBe("right")
  expect(outPort.distance_from_component_edge).toBe(0.8)
  expect(outPort.center.x).toBe(1.8) // 1 + 0.8

  // Check VCC port (up/top, stem 0.5)
  const vccPort = schematicPorts.find((p) => p.display_pin_label === "VCC")
  expect(vccPort.side_of_component).toBe("top")
  expect(vccPort.distance_from_component_edge).toBe(0.5)
  expect(vccPort.center.y).toBe(1.5) // 1 + 0.5

  // Check GND port (down/bottom, stem 0.4)
  const gndPort = schematicPorts.find((p) => p.display_pin_label === "GND")
  expect(gndPort.side_of_component).toBe("bottom")
  expect(gndPort.distance_from_component_edge).toBe(0.4)
  expect(gndPort.center.y).toBe(-1.4) // -1 - 0.4

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
