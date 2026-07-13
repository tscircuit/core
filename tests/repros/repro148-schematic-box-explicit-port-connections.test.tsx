import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

interface ModuleProps {
  name?: string
}

const RcFilter = ({ name: _name }: ModuleProps) => (
  <subcircuit
    name="FILTER"
    showAsSchematicBox
    connections={{
      IO: "R1.pin1",
      VCC: "C1.pin2",
    }}
  >
    <port name="IO" direction="left" />
    <port name="VCC" direction="right" />
    <resistor name="R1" resistance="10k" footprint="0402" />
    <capacitor name="C1" capacitance="10uF" footprint="0603" />
    <trace name="tr_c1_r1" from="R1.pin2" to="C1.pin1" />
  </subcircuit>
)

test("showAsSchematicBox connections connect explicit ports on PCB and schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <RcFilter name="rc" />
      <resistor name="R13" resistance="10k" footprint="0402" />
      <trace name="tr_c1_r1" from="FILTER.IO" to="R13.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  expect(circuit.db.schematic_trace.list()).toHaveLength(1)
})
