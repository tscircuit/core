import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

test("lengthMatchTo includes both selected pair traces in the source bus", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} schematicDisabled routingDisabled>
      <LengthTestTerminal name="TX_P" x={-6} y={5} />
      <LengthTestTerminal name="RX_P" x={6} y={5} />
      <LengthTestTerminal name="TX_N" x={-6} y={2} />
      <LengthTestTerminal name="RX_N" x={6} y={2} />
      <LengthTestTerminal name="TX_DQ" x={-6} y={-3} />
      <LengthTestTerminal name="RX_DQ" x={2} y={-3} />
      <trace name="CLK_P" from=".TX_P > .pin1" to=".RX_P > .pin1" />
      <trace name="CLK_N" from=".TX_N > .pin1" to=".RX_N > .pin1" />
      <trace name="DQ" from=".TX_DQ > .pin1" to=".RX_DQ > .pin1" />
      <bus
        name="DATA"
        connections={["DQ"]}
        lengthMatchTo=".CLOCK_PAIR"
        maxLengthSkew={0.5}
      />
      <differentialpair
        name="CLOCK_PAIR"
        positiveConnection="CLK_P"
        negativeConnection="CLK_N"
        maxLengthSkew={0.1}
      />
      <pcbnotetext
        text="DATA includes DQ and both CLOCK_PAIR conductors"
        pcbY={-7}
        fontSize={0.45}
      />
    </board>,
  )
  circuit.render()
  const data = circuit.db.source_bus.getWhere({ name: "DATA" })!
  expect(data.source_trace_ids).toEqual(
    ["DQ", "CLK_P", "CLK_N"].map(
      (name) => circuit.db.source_trace.getWhere({ name })!.source_trace_id,
    ),
  )
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
