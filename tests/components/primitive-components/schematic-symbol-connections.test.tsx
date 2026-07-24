import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol MOSFET ports connect to two resistors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <resistor name="R1" resistance="10k" schX={-3} />
      <schematicsymbol
        name="Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
      />
      <resistor name="R2" resistance="1k" schX={3} />

      <trace from=".R1 > .pin2" to=".Q1 > .gate" />
      <trace from=".Q1 > .drain" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const gatePort = circuit.selectOne(".Q1 > .gate", {
    type: "port",
  }) as Port | null
  const drainPort = circuit.selectOne(".Q1 > .drain", {
    type: "port",
  }) as Port | null
  const sourceTraces = circuit.db.source_trace.list()

  expect(gatePort).not.toBeNull()
  expect(drainPort).not.toBeNull()
  expect(sourceTraces).toHaveLength(2)
  expect(
    sourceTraces.some((trace) =>
      trace.connected_source_port_ids.includes(gatePort!.source_port_id!),
    ),
  ).toBe(true)
  expect(
    sourceTraces.some((trace) =>
      trace.connected_source_port_ids.includes(drainPort!.source_port_id!),
    ),
  ).toBe(true)
  expect(circuit.db.schematic_trace.list()).toHaveLength(2)

  expect(circuit).toMatchSchematicSnapshot(`${import.meta.path}-mosfet`)
})

test("schematicsymbol diode ports connect to two resistors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <resistor name="R1" resistance="10k" schX={-3} />
      <schematicsymbol name="D1" symbolName="diode_right" />
      <resistor name="R2" resistance="1k" schX={3} />

      <trace from=".R1 > .pin2" to=".D1 > .pos" />
      <trace from=".D1 > .neg" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const positivePort = circuit.selectOne(".D1 > .pos", {
    type: "port",
  }) as Port | null
  const negativePort = circuit.selectOne(".D1 > .neg", {
    type: "port",
  }) as Port | null
  const sourceTraces = circuit.db.source_trace.list()

  expect(positivePort).not.toBeNull()
  expect(negativePort).not.toBeNull()
  expect(sourceTraces).toHaveLength(2)
  expect(
    sourceTraces.some((trace) =>
      trace.connected_source_port_ids.includes(positivePort!.source_port_id!),
    ),
  ).toBe(true)
  expect(
    sourceTraces.some((trace) =>
      trace.connected_source_port_ids.includes(negativePort!.source_port_id!),
    ),
  ).toBe(true)
  expect(circuit.db.schematic_trace.list()).toHaveLength(2)

  expect(circuit).toMatchSchematicSnapshot(`${import.meta.path}-diode`)
})
