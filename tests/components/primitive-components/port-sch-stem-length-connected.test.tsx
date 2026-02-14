import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Ports with schStemLength can be connected with traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      {/* Buffer symbol */}
      <chip
        name="U1"
        schX={0}
        schY={0}
        symbol={
          <symbol>
            <schematicline x1={-0.5} y1={-0.6} x2={-0.5} y2={0.6} />
            <schematicline x1={-0.5} y1={0.6} x2={0.5} y2={0} />
            <schematicline x1={0.5} y1={0} x2={-0.5} y2={-0.6} />
            <schematictext
              text="U1"
              schX={-0.3}
              schY={0.8}
              fontSize={0.4}
              color="brown"
            />
            <port
              name="OUT"
              schX={1.3}
              schY={0}
              direction="right"
              schStemLength={0.8}
            />
          </symbol>
        }
      />
      {/* Inverter symbol */}
      <chip
        name="U2"
        schX={4}
        schY={0}
        symbol={
          <symbol>
            <schematicline x1={-0.5} y1={-0.6} x2={-0.5} y2={0.6} />
            <schematicline x1={-0.5} y1={0.6} x2={0.5} y2={0} />
            <schematicline x1={0.5} y1={0} x2={-0.5} y2={-0.6} />
            <schematiccircle center={{ x: 0.65, y: 0 }} radius={0.15} />
            <schematictext
              text="U2"
              schX={-0.3}
              schY={0.8}
              fontSize={0.4}
              color="brown"
            />
            <port
              name="IN"
              schX={2.7}
              schY={0}
              direction="left"
              schStemLength={0.8}
            />
          </symbol>
        }
        connections={{
          IN: ".U1 > .OUT",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify the trace connects the two ports
  const circuitJson = circuit.getCircuitJson()
  const traces = circuitJson.filter(
    (e) => e.type === "schematic_trace",
  ) as any[]

  expect(traces.length).toBeGreaterThan(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: { cellSize: 1, labelCells: true },
    drawPorts: true,
  })
})
