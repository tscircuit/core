import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connected pins have no missing-trace warnings without a USB-C connector", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={40} height={24} routingDisabled>
      <net name="GND" isGroundNet />
      <chip
        name="U1"
        footprint="soic8"
        pcbX={-10}
        schX={-4}
        pinLabels={{ pin1: "GND" }}
        pinAttributes={{ pin1: { requiresGround: true } }}
      />
      <resistor name="R1" resistance="1k" footprint="0603" schX={0} />
      <trace from=".U1 > .pin1" to="net.GND" />
      <trace from=".R1 > .pin1" to="net.GND" />
      <trace from=".R1 > .pin2" to="net.GND" />
      <schematictext
        text="Control: identical ground connections without USB-C produce no missing-trace warnings"
        schX={1}
        schY={-4}
        fontSize={0.2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(3)
  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
