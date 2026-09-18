import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a routed fanout trace does not overlap its own partial trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="16mm">
      <fanout name="U1_FANOUT" autorouter="auto">
        <chip
          name="U1"
          footprint="soic8"
          pcbX={0}
          pcbY={0}
          pinLabels={{ pin1: "GPIO1", pin2: "VCC" }}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={6}
          pcbY={2}
        />
        <trace from="U1.VCC" to="C1.1" />
        <fanoutpoint connection="U1.GPIO1" pcbX={-5} pcbY={4} />
      </fanout>
    </board>,
  )

  await circuit.renderUntilSettled()

  const falseOverlapErrors = circuit.db.pcb_trace_error
    .list()
    .filter((error) => error.message.includes("overlaps with"))

  expect(falseOverlapErrors).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showErrorsInTextOverlay: true,
  })
})
