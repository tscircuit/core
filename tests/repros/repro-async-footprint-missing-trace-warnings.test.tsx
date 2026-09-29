import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an async 0603 footprint does not warn on connected resistor pins", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        test: async () => ({
          footprintCircuitJson: fp.string("0603").circuitJson(),
        }),
      },
    },
  })

  circuit.add(
    <board width={10} height={10} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="test:0603" />
      <trace from=".R1 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit.db.source_pin_missing_trace_warning.list()
  const traces = circuit.db.source_trace.list()
  expect(traces).toHaveLength(2)
  expect(warnings).toHaveLength(0)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
