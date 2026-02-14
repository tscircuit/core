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
