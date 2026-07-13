import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit schematic box ports route in sequential-trace mode", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" autorouter="sequential-trace">
      <subcircuit
        name="FILTER"
        showAsSchematicBox
        connections={{ IO: "R1.pin1", VCC: "C1.pin2" }}
      >
        <port name="IO" direction="left" />
        <port name="VCC" direction="right" />
        <resistor name="R1" resistance="10k" footprint="0402" />
        <capacitor name="C1" capacitance="10uF" footprint="0603" />
        <trace from="R1.pin2" to="C1.pin1" />
      </subcircuit>
      <resistor name="R13" resistance="10k" footprint="0402" />
      <trace from="FILTER.IO" to="R13.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
