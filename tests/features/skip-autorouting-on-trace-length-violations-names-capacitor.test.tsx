import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("skipped-autorouting message names the capacitor whose automatic limit cannot be met", async () => {
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
      <trace from="U1.VM" to="C2.pin1" />
      <trace from="C2.pin2" to="net.GND" />
      <trace from="U1.GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].message).toMatchInlineSnapshot(
    `"Autorouting was skipped because the 1mm maximum length for U1.VM to C2.pin1 cannot be satisfied: its endpoints are 11.84mm apart (1 additional violation). The limit is the decoupling trace limit of capacitor C2 (maxDecouplingTraceLength, 1mm by default for a capacitor between a chip power pin and ground). Move C2 closer, raise maxDecouplingTraceLength on C2, or set maxLength on the trace."`,
  )
})
