import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an explicit display label stays inline on one branch of a multi-port trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} routingDisabled schMaxTraceDistance={10}>
      <pinheader
        name="J1"
        pinCount={1}
        footprint="pinrow1"
        schX={-3}
        schY={0}
      />
      <resistor
        name="R_SHUNT"
        resistance="50m"
        footprint="0603"
        schOrientation="vertical"
        schX={0}
        schY={0}
      />
      <resistor
        name="R_FILTER"
        resistance="10k"
        footprint="0603"
        schX={3}
        schY={0}
      />

      <trace
        name="V_PLUS_INPUT"
        path={[".J1 > .pin1", ".R_SHUNT > .pin2", ".R_FILTER > .pin1"]}
        schDisplayLabel="V+"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.getWhere({
    name: "V_PLUS_INPUT",
  })!
  expect(sourceTrace.connected_source_port_ids).toHaveLength(3)

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "V+")
  expect(inlineLabels).toHaveLength(1)
  expect(inlineLabels[0]!.source_trace_id).toBe(sourceTrace.source_trace_id)

  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "V+"),
  ).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
