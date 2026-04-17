import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip noConnect marks source ports do_not_connect and suppresses missing trace warnings", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "NC" }}
        pinAttributes={{
          VCC: { requiresPower: true },
          GND: { requiresGround: true },
        }}
        noConnect={["NC"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const ncPort = sourcePorts.find((port) => port.name === "NC")

  expect(ncPort?.do_not_connect).toBe(true)

  const missingTraceWarnings =
    circuit.db.source_pin_missing_trace_warning.list()
  expect(
    missingTraceWarnings.find(
      (warning) => warning.source_port_id === ncPort?.source_port_id,
    ),
  ).toBeUndefined()
  expect(missingTraceWarnings.length).toBe(2)
})
