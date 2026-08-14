import { expect, test } from "bun:test"
import type { Port } from "lib/components"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ambiguous chip pin alias silently selects the first physical pin", async () => {
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
        text="ACTUAL: UCB0SDA silently selects physical pin 1"
        schX={0}
        schY={-2}
        fontSize={0.28}
        color="red"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pin1 = circuit.selectOne(".U1 > .pin1") as Port
  const pin2 = circuit.selectOne(".U1 > .pin2") as Port
  const aliasTrace = circuit.db.source_trace.list()[1]!

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(aliasTrace.connected_source_port_ids).toContain(pin1.source_port_id!)
  expect(aliasTrace.connected_source_port_ids).not.toContain(
    pin2.source_port_id!,
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
