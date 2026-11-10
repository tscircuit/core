import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
// Use the canonical schema from circuit-json #989 until its nominal-width field ships.
import { any_circuit_element } from "circuit-json-width-preview"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("validated board widths survive save, load and subcircuit inflation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={12}
      minTraceWidth={0.1}
      defaultTraceWidth="0.35mm"
      routingDisabled
      schematicDisabled
    >
      <resistor name="R1" resistance={100} footprint="1206" pcbX={-4} />
      <resistor name="R2" resistance={100} footprint="1206" pcbX={4} />
      <trace from=".R1 > .pin1" to="net.SIGNAL" />
      <trace from=".R2 > .pin1" to="net.SIGNAL" />
      <trace from=".R1 > .pin2" to="net.POWER" thickness="0.55mm" />
      <trace from=".R2 > .pin2" to="net.POWER" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const validated = circuit
    .getCircuitJson()
    .map((element) => any_circuit_element.parse(element))
  const saved = JSON.parse(JSON.stringify(validated))
  const { circuit: restored } = getTestFixture()
  restored.pcbRoutingDisabled = true
  restored.schematicDisabled = true
  restored.add(<subcircuit name="RESTORED" circuitJson={saved} />)
  await restored.renderUntilSettled()
  const restoredBoards = restored.db.pcb_board.list()
  expect(restoredBoards).toHaveLength(1)
  expect(restoredBoards[0]).toMatchObject({
    nominal_trace_width: 0.35,
    min_trace_width: 0.1,
  })
  const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: restored.getCircuitJson(),
  })
  expect(srj.minTraceWidth).toBe(0.1)
  expect(srj.nominalTraceWidth).toBe(0.35)
  expect(
    srj.connections.map((connection) => connection.nominalTraceWidth),
  ).toEqual([0.35, 0.55])
})
