import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("skipped-autorouting message does not blame a capacitor for a trace's own maxLength", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <chip
        name="U1"
        footprint="soic8"
        pcbX={-5}
        pinLabels={{ 1: "VM", 4: "GND" }}
        pinAttributes={{ VM: { requiresPower: true } }}
      />
      <capacitor name="C2" capacitance="100uF" footprint="1210" pcbX={6} />
      <trace from="U1.VM" to="C2.pin1" maxLength={1} />
      <trace from="C2.pin2" to="net.GND" maxLength={20} />
      <trace from="U1.GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].message).toMatchInlineSnapshot(
    `"Autorouting was skipped because the 1mm maximum length for U1.VM to C2.pin1 cannot be satisfied: its endpoints are 11.84mm apart."`,
  )
})
