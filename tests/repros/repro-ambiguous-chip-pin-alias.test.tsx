import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ambiguous chip pin alias reports a connection error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm">
      <resistor
        name="R_PIN1"
        resistance="1k"
        footprint="0402"
        schX={-4}
        schY={0}
      />
      <chip
        name="U1"
        footprint="dip2"
        schX={0}
        schY={0}
        pinLabels={{
          pin1: ["UCB0SDA", "P1_2"],
          pin2: ["UCB0SDA", "P1_6"],
        }}
        schPinArrangement={{
          leftSide: { pins: ["pin1"], direction: "top-to-bottom" },
          rightSide: { pins: ["pin2"], direction: "top-to-bottom" },
        }}
      />
      <resistor
        name="R_ALIAS"
        resistance="1k"
        footprint="0402"
        schX={4}
        schY={0}
      />

      <trace from=".R_PIN1 > .pin2" to=".U1 > .pin1" />
      <trace from=".U1 > .UCB0SDA" to=".R_ALIAS > .pin1" />

      <schematictext
        text="EXPECTED: ambiguous UCB0SDA selector reports an error"
        schX={0}
        schY={2}
        fontSize={0.28}
        color="blue"
      />
      <schematictext
        text="FIXED: alias trace rejected; select pin1 or pin2"
        schX={0}
        schY={-2}
        fontSize={0.28}
        color="green"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traceConnectionErrors =
    circuit.db.source_trace_not_connected_error.list()

  expect(traceConnectionErrors).toHaveLength(1)
  expect(traceConnectionErrors[0]?.message).toBe(
    'Port selector ".U1 > .UCB0SDA" is ambiguous because it matches .U1 > .pin1, .U1 > .pin2. Use a unique physical pin selector instead.',
  )
  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(circuit.db.source_component_internal_connection.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
