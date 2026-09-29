import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an async 0603 footprint still warns on an unconnected resistor pin", async () => {
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
    </board>,
  )

  circuit.render()
  expect(circuit.db.source_trace.list()).toHaveLength(0)
  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(
    circuit.db.source_pin_missing_trace_warning
      .list()
      .map((warning) => warning.message),
  ).toEqual(["Port pin2 on R1 is missing a trace"])
})
