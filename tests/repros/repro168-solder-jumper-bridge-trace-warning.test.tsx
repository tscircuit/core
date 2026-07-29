import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "solder jumper bridge traces should not generate disconnected endpoint errors",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="25mm" height="25mm">
        <solderjumper
          name="JP1"
          footprint="solderjumper2_bridged12_p1.0414_pw0.6604_ph1.27"
          bridgedPins={[["1", "2"]]}
          pinCount={2}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const traceErrors = circuit.db.pcb_trace_error?.list() ?? []
    expect(traceErrors.length).toBe(0)
  },
)
