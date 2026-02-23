import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Port schStemLength creates schematic_line from port toward component", async () => {
  const { circuit } = getTestFixture()

  // With schStemLength, schX/schY is where traces connect (end of stem)
  // The schematic_line is drawn from the port back toward the component body
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
              schX={-1.6}
              schY={0.5}
              direction="left"
              schStemLength={0.6}
            />
            <port
              name="OUT"
              schX={1.8}
              schY={0.5}
              direction="right"
              schStemLength={0.8}
            />
            <port
              name="VCC"
              schX={0}
              schY={1.5}
              direction="up"
              schStemLength={0.5}
            />
            <port
              name="GND"
              schX={0}
              schY={-1.4}
              direction="down"
              schStemLength={0.4}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify schematic_lines are created for port stems
  const circuitJson = circuit.getCircuitJson()
  const schematicLines = circuitJson.filter(
    (e) => e.type === "schematic_line",
  ) as any[]

  // 4 stem lines should be created (one per port with schStemLength)
  expect(schematicLines.length).toBe(4)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: { cellSize: 1, labelCells: true },
    drawPorts: true,
  })
})

test("Port schStemLength scales with custom symbol width/height", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U2"
        schX={0}
        schY={0}
        symbol={
          <symbol width={4} height={2}>
            <schematicrect schX={0} schY={0} width={2} height={2} />
            <port
              name="LEFT"
              schX={-1}
              schY={0}
              direction="left"
              schStemLength={0.5}
            />
            <port
              name="TOP"
              schX={0}
              schY={1}
              direction="up"
              schStemLength={0.5}
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
  const schematicLines = circuitJson.filter(
    (e) => e.type === "schematic_line",
  ) as any[]

  const leftPort = schematicPorts.find((p) => p.display_pin_label === "LEFT")
  const topPort = schematicPorts.find((p) => p.display_pin_label === "TOP")

  expect(leftPort.distance_from_component_edge).toBeCloseTo(1, 5)
  expect(topPort.distance_from_component_edge).toBeCloseTo(0.5, 5)

  const leftLine = schematicLines.find(
    (line) =>
      Math.abs(line.y1 - leftPort.center.y) < 1e-6 &&
      Math.abs(line.x1 - leftPort.center.x) < 1e-6,
  )
  const topLine = schematicLines.find(
    (line) =>
      Math.abs(line.y1 - topPort.center.y) < 1e-6 &&
      Math.abs(line.x1 - topPort.center.x) < 1e-6,
  )

  expect(Math.abs(leftLine.x2 - leftLine.x1)).toBeCloseTo(1, 5)
  expect(Math.abs(topLine.y2 - topLine.y1)).toBeCloseTo(0.5, 5)
})
