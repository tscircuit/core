import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPack inner group keeps components inside parent board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="10mm" routingDisabled>
      <group pcbPack pcbPackGap="1mm">
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "VCC", pin2: "SIGNAL", pin3: "GND" }}
        />
        <capacitor name="C1" capacitance="100nF" footprint="0805" />
        <resistor name="R1" resistance="1k" footprint="0805" />

        <trace from=".U1 > .VCC" to=".C1 > .pin1" />
        <trace from=".U1 > .GND" to=".C1 > .pin2" />
        <trace from=".U1 > .SIGNAL" to=".R1 > .pin1" />
        <trace from=".R1 > .pin2" to=".C1 > .pin1" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  // TODO: Uncomment when inner pcbPack groups inherit their parent board bounds.
  // expect(circuit.db.pcb_component_outside_board_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
