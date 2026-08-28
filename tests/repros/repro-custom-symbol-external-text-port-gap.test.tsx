import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace reaches a custom-symbol port inside text-expanded bounds", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled schMaxTraceDistance="20mm">
      <chip
        name="U1"
        schX={0}
        schY={0}
        symbol={
          <symbol>
            <schematicpath
              points={[
                { x: -0.4, y: 0.42 },
                { x: 0.45, y: 0 },
                { x: -0.4, y: -0.42 },
                { x: -0.4, y: 0.42 },
              ]}
            />
            <schematictext
              text="VALUE EXTENDS PAST PORT"
              schX={0.55}
              schY={0.24}
              fontSize={0.12}
              anchor="left"
            />
            <port
              name="OUT"
              schX={0.7}
              schY={0}
              direction="right"
              schStemLength={0.25}
            />
          </symbol>
        }
      />
      <resistor name="R1" resistance="1k" schX={3} schY={0} />
      <trace from=".U1 > .OUT" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const outputSourcePort = circuit.db.source_port
    .list()
    .find((port) => port.name === "OUT")
  const outputPort = circuit.db.schematic_port
    .list()
    .find((port) => port.source_port_id === outputSourcePort?.source_port_id)
  expect(outputPort).toBeDefined()

  const traceEndpoints = circuit.db.schematic_trace
    .list()
    .flatMap((trace) => trace.edges.flatMap((edge) => [edge.from, edge.to]))
  expect(traceEndpoints).toContainEqual(outputPort!.center)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
  })
})
